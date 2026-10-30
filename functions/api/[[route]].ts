/**
 * Cloudflare Pages Functions Backend for Multi-Campaign TTRPG Platform
 * Complete Account & User System with PBKDF2 WebCrypto, session tokens,
 * D1 database storage, CSRF protection, rate limiting, and RBAC authorization.
 */

import { computeAuthoritativeParticipation, createSnapshot, pruneSnapshots } from '../../shared/rules/wizardEngine';
import { rollAbilityScores } from '../../shared/rules/engine';
import { computeLevelUpDiff, isLevelUpReady, isFieldLockedForPlayer, XP_THRESHOLDS } from '../../shared/rules/levelUpEngine';
import {
  filterSessionForViewer,
  canUserRsvp,
  canUserVote,
  canManageSessions,
  validatePollOptions,
  buildAttendanceHistoryEvent,
  calculatePollTally
} from '../../shared/rules/sessionEngine';
import {
  canUserCreateRecap,
  canUserEditRecap,
  validateRecapPayload,
  buildHighlightHistoryEvent
} from '../../shared/rules/recapEngine';
import {
  validateHandoutPayload,
  checkMediaSize,
  checkCampaignQuota,
  filterHandoutsForPlayer,
  filterPinsForPlayer,
  clampCoordinates
} from '../../shared/rules/handoutEngine';
import type { CharacterParticipation, LevelUpPayload, XpAward, SheetChangeRequest, Session, SessionStatus, SessionRsvpChoice, SessionRecap, SessionHighlight, Handout, MapPin } from '../../src/types';

interface Env {
  DB: any; // Cloudflare D1Database binding
  DM_EMAILS?: string;
  IP_HASH_SALT?: string;
  REGISTRATION_MODE?: 'invite' | 'open';
}

export type PagesFunction<T = Env> = (context: {
  request: Request;
  env: T;
  params?: Record<string, string | string[]>;
  waitUntil?: (promise: Promise<any>) => void;
  next?: () => Promise<Response>;
  data?: Record<string, any>;
}) => Promise<Response> | Response;

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string;
  role: 'dm' | 'player';
  status: 'active' | 'disabled';
  must_change_password: number;
  created_at: number;
  last_login_at: number | null;
  deleted_at: number | null;
  active_character_id: string | null;
  avatar_url?: string;
}

interface SessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  created_at: number;
  last_seen_at: number;
  expires_at: number;
  absolute_expires_at: number;
  user_agent?: string;
  ip_hash?: string;
  revoked_at: number | null;
}

// ----------------------------------------------------------------------
// Common Passwords Blacklist (~200 top breached passwords)
// ----------------------------------------------------------------------
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '1234567', 'password', 'password1', 'password123',
  'qwertyui', 'qwertyuiop', 'asdfghjk', 'asdfghjkl', 'zxcvbnm', '11111111', '00000000',
  '123123123', 'admin123', 'administrator', 'welcome1', 'welcome123', 'iloveyou', 'sunshine',
  'princess', 'football', 'monkey123', 'shadow123', 'dragon123', 'master123', 'zorvania',
  'zorvania123', 'letmein1', 'trustno1', 'starwars', 'superman', 'michael1', 'jessica1',
  'charlie1', 'whatever', 'donald123', 'killer123', 'hunter12', 'batman123', 'superman1',
  'pass1234', 'secret12', 'secret123', 'computer1', 'internet1', 'freedom1', 'mercedes1',
  'server123', 'root1234', 'oracle123', 'database1', 'gamemaster', 'dungeonmaster', 'dungeon1'
]);

// ----------------------------------------------------------------------
// Crypto & Hashing Utilities
// ----------------------------------------------------------------------
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64ToBytes(b64: string): Uint8Array {
  const standard = b64.replace(/-/g, '+').replace(/_/g, '/');
  const padded = standard + '='.repeat((4 - (standard.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sha256Hex(message: string): Promise<string> {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(message));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashIp(ip: string, salt: string): Promise<string> {
  return sha256Hex(`${ip}::${salt}`);
}

/**
 * PBKDF2-SHA-256 with EXACTLY 100000 iterations, 16-byte random salt, 32-byte derived key.
 * Stored format: "pbkdf2$sha256$100000$<saltB64>$<hashB64>"
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );

  const saltB64 = base64UrlEncode(salt);
  const hashB64 = base64UrlEncode(derivedBits);
  return `pbkdf2$sha256$100000$${saltB64}$${hashB64}`;
}

/**
 * Constant-time password verification.
 */
async function verifyPassword(password: string, storedHashRecord: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  try {
    const parts = storedHashRecord.split('$');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== 'sha256') {
      return { valid: false, needsRehash: false };
    }

    const iterations = parseInt(parts[2], 10);
    const salt = base64ToBytes(parts[3]);
    const expectedHashBytes = base64ToBytes(parts[4]);

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations,
        hash: 'SHA-256'
      },
      keyMaterial,
      expectedHashBytes.length * 8
    );

    const derivedBytes = new Uint8Array(derivedBits);
    if (derivedBytes.length !== expectedHashBytes.length) {
      return { valid: false, needsRehash: false };
    }

    // Constant-time byte comparison
    let diff = 0;
    for (let i = 0; i < derivedBytes.length; i++) {
      diff |= derivedBytes[i] ^ expectedHashBytes[i];
    }

    const valid = diff === 0;
    const needsRehash = valid && iterations !== 100000;
    return { valid, needsRehash };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

/**
 * Dummy password hash computation to prevent timing leak when user does not exist.
 */
async function dummyHashWork(): Promise<void> {
  try {
    const salt = new Uint8Array(16);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode('dummy-password'), { name: 'PBKDF2' }, false, ['deriveBits']);
    await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt as any, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  } catch {}
}

function generateRandomToken(bytesCount = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesCount));
  return base64UrlEncode(bytes);
}

// ----------------------------------------------------------------------
// Cookie Helpers (__Host-zsession)
// ----------------------------------------------------------------------
const SESSION_COOKIE_NAME = '__Host-zsession';
const SLIDING_EXPIRY_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const ABSOLUTE_MAX_MS = 60 * 24 * 60 * 60 * 1000;  // 60 days
const SLIDING_EXTEND_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 1 day

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function makeSessionCookie(token: string, maxAgeSeconds: number): string {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

function clearSessionCookie(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// ----------------------------------------------------------------------
// Password Validation Policy
// ----------------------------------------------------------------------
function validatePassword(password: string, email: string, displayName: string): string | null {
  if (!password || password.length < 8) {
    return 'رمز عبور باید حداقل ۸ نویسه (کاراکتر) باشد.';
  }
  if (password.length > 128) {
    return 'رمز عبور نباید بیشتر از ۱۲۸ نویسه باشد.';
  }
  const cleanPass = password.toLowerCase().trim();
  if (cleanPass === email.toLowerCase().trim()) {
    return 'رمز عبور نمی‌تواند با ایمیل یکسان باشد.';
  }
  if (displayName && cleanPass === displayName.toLowerCase().trim()) {
    return 'رمز عبور نمی‌تواند با نام نمایشی یکسان باشد.';
  }
  if (COMMON_PASSWORDS.has(cleanPass)) {
    return 'این رمز عبور بسیار رایج و ناامن است؛ لطفاً رمز قوی‌تری برگزینید.';
  }
  return null;
}

// ----------------------------------------------------------------------
// Security Headers
// ----------------------------------------------------------------------
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "default-src 'self'; font-src 'self' data: https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
  'Cache-Control': 'no-store'
};

// ----------------------------------------------------------------------
// Main Handler
// ----------------------------------------------------------------------
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace(/^\/api/, ''); // Strip /api prefix

  const ipHashSalt = env.IP_HASH_SALT || 'zorvania-ip-salt-default-secret';
  const clientIp = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '127.0.0.1';
  const clientIpHash = await hashIp(clientIp, ipHashSalt);
  const userAgent = request.headers.get('User-Agent') || 'unknown';

  const rawDmEmails = env.DM_EMAILS || 'dm@zorvania.ir';
  const dmEmails = rawDmEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const registrationMode = env.REGISTRATION_MODE || 'invite';

  // Helper response builder
  const json = (data: any, status = 200, extraHeaders: Record<string, string> = {}) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS,
        ...extraHeaders
      }
    });
  };

  const error = (msg: string, status = 400, extraHeaders: Record<string, string> = {}) => {
    return json({ error: msg }, status, extraHeaders);
  };

  // ---------------------------------------------------------
  // CSRF Check for State-Changing Requests
  // ---------------------------------------------------------
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const xRequestedWith = request.headers.get('X-Requested-With');
    if (!xRequestedWith || xRequestedWith.toLowerCase() !== 'zorvania') {
      return error('درخواست نامعتبر است (CSRF Header مفقود است).', 403);
    }

    const origin = request.headers.get('Origin');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== url.host) {
          return error('درخواست از مبدأ غیرمجاز است.', 403);
        }
      } catch {
        return error('مبدأ درخواست نامعتبر است.', 403);
      }
    }
  }

  // ---------------------------------------------------------
  // Opportunistic Database Cleanup (>1 day old attempts)
  // ---------------------------------------------------------
  const now = Date.now();
  if (Math.random() < 0.05 && env.DB) {
    context.waitUntil?.(
      (async () => {
        try {
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          await env.DB.prepare('DELETE FROM login_attempts WHERE created_at < ?').bind(oneDayAgo).run();
        } catch {}
      })()
    );
  }

  // ---------------------------------------------------------
  // Session Authentication from Cookie
  // ---------------------------------------------------------
  const cookieHeader = request.headers.get('Cookie');
  const sessionToken = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  let currentSession: SessionRow | null = null;
  let currentUser: UserRow | null = null;
  let setCookieHeader: string | null = null;

  if (sessionToken && env.DB) {
    const tokenHash = await sha256Hex(sessionToken);
    const sessionRes = await env.DB.prepare(
      `SELECT s.*, u.id as u_id, u.email as u_email, u.display_name as u_display_name, 
              u.password_hash as u_password_hash, u.role as u_role, u.status as u_status, 
              u.must_change_password as u_must_change_password, u.created_at as u_created_at, 
              u.last_login_at as u_last_login_at, u.deleted_at as u_deleted_at, 
              u.active_character_id as u_active_character_id, u.avatar_url as u_avatar_url
       FROM auth_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ? AND s.absolute_expires_at > ?
         AND u.status = 'active' AND u.deleted_at IS NULL`
    ).bind(tokenHash, now, now).first();

    if (sessionRes) {
      currentSession = {
        id: sessionRes.id,
        user_id: sessionRes.user_id,
        token_hash: sessionRes.token_hash,
        created_at: sessionRes.created_at,
        last_seen_at: sessionRes.last_seen_at,
        expires_at: sessionRes.expires_at,
        absolute_expires_at: sessionRes.absolute_expires_at,
        user_agent: sessionRes.user_agent,
        ip_hash: sessionRes.ip_hash,
        revoked_at: sessionRes.revoked_at
      };

      currentUser = {
        id: sessionRes.u_id,
        email: sessionRes.u_email,
        display_name: sessionRes.u_display_name,
        password_hash: sessionRes.u_password_hash,
        role: sessionRes.u_role,
        status: sessionRes.u_status,
        must_change_password: sessionRes.u_must_change_password,
        created_at: sessionRes.u_created_at,
        last_login_at: sessionRes.u_last_login_at,
        deleted_at: sessionRes.u_deleted_at,
        active_character_id: sessionRes.u_active_character_id,
        avatar_url: sessionRes.u_avatar_url
      };

      // Sliding expiry extension if last_seen_at is older than 1 day
      if (now - currentSession.last_seen_at > SLIDING_EXTEND_THRESHOLD_MS) {
        const nextExpires = Math.min(now + SLIDING_EXPIRY_MS, currentSession.absolute_expires_at);
        await env.DB.prepare(
          'UPDATE auth_sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?'
        ).bind(now, nextExpires, currentSession.id).run();

        const remainingSeconds = Math.max(1, Math.floor((nextExpires - now) / 1000));
        setCookieHeader = makeSessionCookie(sessionToken, remainingSeconds);
      }
    }
  }

  // Helper for audit logging
  const audit = async (action: string, targetId: string | null = null, meta: any = null) => {
    if (!env.DB) return;
    try {
      const auditId = `audit-${Date.now()}-${generateRandomToken(4)}`;
      await env.DB.prepare(
        'INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(auditId, currentUser?.id || null, action, targetId, meta ? JSON.stringify(meta) : null, Date.now()).run();
    } catch {}
  };

  // Rate limit checker helper
  const checkRateLimit = async (key: string, maxAttempts: number, windowMs: number): Promise<boolean> => {
    if (!env.DB) return true;
    const windowStart = Date.now() - windowMs;
    const countRow = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM login_attempts WHERE key = ? AND success = 0 AND created_at > ?'
    ).bind(key, windowStart).first();
    return (countRow?.count || 0) < maxAttempts;
  };

  const recordAttempt = async (key: string, success: boolean) => {
    if (!env.DB) return;
    try {
      await env.DB.prepare(
        'INSERT INTO login_attempts (key, created_at, success) VALUES (?, ?, ?)'
      ).bind(key, Date.now(), success ? 1 : 0).run();
    } catch {}
  };

  // ---------------------------------------------------------
  // Auth Routes
  // ---------------------------------------------------------

  // POST /api/auth/register
  if (path === '/auth/register' && method === 'POST') {
    if (!env.DB) return error('پایگاه داده در دسترس نیست.', 500);

    // IP rate limit on register: 10 per hour
    const canRegister = await checkRateLimit(`reg_ip:${clientIpHash}`, 10, 60 * 60 * 1000);
    if (!canRegister) {
      return error('تعداد تلاش‌های ثبت‌نام از این آدرس بیش از حد مجاز است. لطفاً ساعتی دیگر امتحان کنید.', 429, { 'Retry-After': '3600' });
    }

    try {
      const body = await request.json() as any;
      const rawEmail = String(body.email || '').toLowerCase().trim();
      const rawPassword = String(body.password || '');
      const rawDisplayName = String(body.displayName || '').trim();
      const inviteCode = String(body.inviteCode || '').trim();

      if (!rawEmail || !rawEmail.includes('@')) {
        return error('آدرس ایمیل معتبر الزامی است.');
      }
      if (!rawDisplayName || rawDisplayName.length < 2 || rawDisplayName.length > 40) {
        return error('نام نمایشی باید بین ۲ تا ۴۰ نویسه باشد.');
      }

      const passError = validatePassword(rawPassword, rawEmail, rawDisplayName);
      if (passError) return error(passError);

      const isDmEmail = dmEmails.includes(rawEmail);
      let assignedCharacterId: string | null = null;

      // Handle invite requirement
      if (!isDmEmail && registrationMode !== 'open') {
        if (!inviteCode) {
          return error('برای ثبت‌نام به کد دعوت معتبر نیاز است.');
        }

        const inviteHash = await sha256Hex(inviteCode);
        const inviteRow = await env.DB.prepare(
          'SELECT * FROM invites WHERE code_hash = ? AND revoked_at IS NULL'
        ).bind(inviteHash).first();

        if (!inviteRow) {
          return error('کد دعوت نامعتبر است.');
        }
        if (inviteRow.expires_at > 0 && inviteRow.expires_at < now) {
          return error('این کد دعوت منقضی شده است.');
        }
        if (inviteRow.used_count >= inviteRow.max_uses) {
          return error('این کد دعوت قبلاً استفاده شده است.');
        }

        // Atomically increment used_count
        const updateRes = await env.DB.prepare(
          'UPDATE invites SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses AND revoked_at IS NULL'
        ).bind(inviteRow.id).run();

        if (!updateRes.meta?.changes && updateRes.changes === 0) {
          return error('کد دعوت هم‌اکنون به حداکثر استفاده رسیده است.');
        }

        if (inviteRow.assign_character_id) {
          assignedCharacterId = inviteRow.assign_character_id;
        }
      }

      // Check if user exists
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(rawEmail).first();
      if (existing) {
        return error('کاربری با این ایمیل پیش‌تر ثبت‌نام کرده است.', 409);
      }

      const userId = `user-${Date.now()}-${generateRandomToken(4)}`;
      const passwordHash = await hashPassword(rawPassword);
      const userRole = isDmEmail ? 'dm' : 'player';

      await env.DB.prepare(
        `INSERT INTO users (id, email, display_name, password_hash, role, status, must_change_password, created_at, last_login_at, active_character_id)
         VALUES (?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`
      ).bind(userId, rawEmail, rawDisplayName, passwordHash, userRole, now, now, assignedCharacterId).run();

      // If a character was assigned, transfer its owner_id to the new user
      if (assignedCharacterId) {
        await env.DB.prepare(
          'UPDATE characters SET owner_id = ? WHERE id = ?'
        ).bind(userId, assignedCharacterId).run();
      }

      // Create session
      const rawToken = generateRandomToken(32);
      const tokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;

      await env.DB.prepare(
        `INSERT INTO auth_sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, userId, tokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();

      await audit('register', userId, { email: rawEmail, role: userRole });

      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1000));
      return json({
        user: {
          id: userId,
          email: rawEmail,
          name: rawDisplayName,
          displayName: rawDisplayName,
          role: userRole,
          status: 'active',
          mustChangePassword: false,
          activeCharacterId: assignedCharacterId
        }
      }, 201, { 'Set-Cookie': cookieStr });

    } catch (e: any) {
      return error(e.message || 'خطا در ثبت نام.', 500);
    }
  }

  // POST /api/auth/login
  if (path === '/auth/login' && method === 'POST') {
    if (!env.DB) return error('پایگاه داده در دسترس نیست.', 500);

    try {
      const body = await request.json() as any;
      const rawEmail = String(body.email || '').toLowerCase().trim();
      const rawPassword = String(body.password || '');

      const emailKey = `login_email:${await sha256Hex(rawEmail)}`;
      const ipKey = `login_ip:${clientIpHash}`;

      // Rate limit check: max 5 failed per email per 15 min, max 20 per IP per 15 min
      const emailAllowed = await checkRateLimit(emailKey, 5, 15 * 60 * 1000);
      const ipAllowed = await checkRateLimit(ipKey, 20, 15 * 60 * 1000);

      if (!emailAllowed || !ipAllowed) {
        return error('تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید.', 429, { 'Retry-After': '900' });
      }

      const userRow: UserRow = await env.DB.prepare(
        'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL'
      ).bind(rawEmail).first();

      if (!userRow || userRow.status === 'disabled') {
        // Run dummy hash to prevent timing attack
        await dummyHashWork();
        await recordAttempt(emailKey, false);
        await recordAttempt(ipKey, false);
        return error('ایمیل یا رمز عبور نادرست است.', 401);
      }

      const { valid, needsRehash } = await verifyPassword(rawPassword, userRow.password_hash);
      if (!valid) {
        await recordAttempt(emailKey, false);
        await recordAttempt(ipKey, false);
        return error('ایمیل یا رمز عبور نادرست است.', 401);
      }

      // Rehash if iterations outdated
      if (needsRehash) {
        const newHash = await hashPassword(rawPassword);
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, userRow.id).run();
      }

      // Record successful login
      await recordAttempt(emailKey, true);
      await recordAttempt(ipKey, true);
      await env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now, userRow.id).run();

      // Create session
      const rawToken = generateRandomToken(32);
      const tokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;

      await env.DB.prepare(
        `INSERT INTO auth_sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, userRow.id, tokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();

      await audit('login', userRow.id);

      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1000));
      return json({
        user: {
          id: userRow.id,
          email: userRow.email,
          name: userRow.display_name,
          displayName: userRow.display_name,
          role: userRow.role,
          status: userRow.status,
          mustChangePassword: userRow.must_change_password === 1,
          activeCharacterId: userRow.active_character_id
        }
      }, 200, { 'Set-Cookie': cookieStr });

    } catch (e: any) {
      return error(e.message || 'خطا در ورود.', 500);
    }
  }

  // POST /api/auth/logout
  if (path === '/auth/logout' && method === 'POST') {
    if (currentSession && env.DB) {
      await env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE id = ?').bind(now, currentSession.id).run();
      await audit('logout', currentUser?.id);
    }
    return json({ message: 'با موفقیت خارج شدید.' }, 200, { 'Set-Cookie': clearSessionCookie() });
  }

  // POST /api/auth/logout-all
  if (path === '/auth/logout-all' && method === 'POST') {
    if (!currentUser) return error('ابتدا وارد شوید.', 401);
    await env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?').bind(now, currentUser.id).run();
    await audit('logout-all', currentUser.id);
    return json({ message: 'تمام نشست‌های فعال شما خاتمه یافتند.' }, 200, { 'Set-Cookie': clearSessionCookie() });
  }

  // GET /api/auth/me
  if (path === '/auth/me' && method === 'GET') {
    if (!currentUser) {
      return json({ user: null, activeCharacterId: null, mustChangePassword: false }, 200);
    }
    return json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.display_name,
        displayName: currentUser.display_name,
        role: currentUser.role,
        status: currentUser.status,
        mustChangePassword: currentUser.must_change_password === 1,
        activeCharacterId: currentUser.active_character_id,
        avatarUrl: currentUser.avatar_url
      },
      activeCharacterId: currentUser.active_character_id,
      mustChangePassword: currentUser.must_change_password === 1
    }, 200, setCookieHeader ? { 'Set-Cookie': setCookieHeader } : {});
  }

  // POST /api/auth/reset (consume reset token)
  if (path === '/auth/reset' && method === 'POST') {
    if (!env.DB) return error('پایگاه داده در دسترس نیست.', 500);

    const canReset = await checkRateLimit(`reset_ip:${clientIpHash}`, 10, 60 * 60 * 1000);
    if (!canReset) {
      return error('تعداد تلاش‌های تغییر رمز بیش از حد مجاز است.', 429, { 'Retry-After': '3600' });
    }

    try {
      const body = await request.json() as any;
      const token = String(body.token || '').trim();
      const newPassword = String(body.newPassword || '');

      if (!token) return error('توکن بازنشانی رمز الزامی است.');

      const tokenHash = await sha256Hex(token);
      const resetRow = await env.DB.prepare(
        'SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?'
      ).bind(tokenHash, now).first();

      if (!resetRow) {
        return error('لینک تغییر رمز نامعتبر یا منقضی شده است.', 400);
      }

      const targetUser: UserRow = await env.DB.prepare(
        'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL'
      ).bind(resetRow.user_id).first();

      if (!targetUser || targetUser.status === 'disabled') {
        return error('حساب کاربری مورد نظر غیرفعال یا حذف شده است.', 400);
      }

      const passErr = validatePassword(newPassword, targetUser.email, targetUser.display_name);
      if (passErr) return error(passErr);

      const newHash = await hashPassword(newPassword);

      // Mark token as used, update password, revoke all existing sessions
      await env.DB.prepare('UPDATE password_resets SET used_at = ? WHERE id = ?').bind(now, resetRow.id).run();
      await env.DB.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').bind(newHash, targetUser.id).run();
      await env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?').bind(now, targetUser.id).run();

      // Create new session
      const rawToken = generateRandomToken(32);
      const newSessionTokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;

      await env.DB.prepare(
        `INSERT INTO auth_sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, targetUser.id, newSessionTokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();

      await audit('password-reset', targetUser.id);

      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1000));
      return json({
        message: 'رمز عبور با موفقیت به‌روزرسانی شد.',
        user: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.display_name,
          displayName: targetUser.display_name,
          role: targetUser.role,
          status: targetUser.status,
          mustChangePassword: false,
          activeCharacterId: targetUser.active_character_id
        }
      }, 200, { 'Set-Cookie': cookieStr });

    } catch (e: any) {
      return error(e.message || 'خطا در تغییر رمز عبور.', 500);
    }
  }

  // ---------------------------------------------------------
  // Require Authentication for Remaining Routes
  // ---------------------------------------------------------
  if (!currentUser) {
    return error('نشست شما تمام شده یا نامعتبر است. لطفاً وارد شوید.', 401);
  }

  // ---------------------------------------------------------
  // Shared helpers for the multi-campaign client contract
  // ---------------------------------------------------------
  const actor = currentUser;
  const parseBlob = (value: any, fallback: any) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const mapCampaignRow = (r: any) => ({
    id: r.id,
    name: r.name,
    description: r.description || '',
    coverMediaId: r.cover_media_id || null,
    tone: r.tone || undefined,
    status: r.status,
    ownerId: r.owner_id,
    sourcePackId: r.source_pack_id || null,
    settings: parseBlob(r.settings, {}),
    wizardState: r.wizard_state ? parseBlob(r.wizard_state, null) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    myRole: r.my_role || undefined,
    memberCount: r.member_count != null ? Number(r.member_count) : undefined,
    characterCount: r.character_count != null ? Number(r.character_count) : undefined
  });

  const getMembershipRole = async (campId: string, userId: string) => {
    const row = await env.DB.prepare(
      "SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND status = 'active'"
    ).bind(campId, userId).first();
    return row?.role || null;
  };

  const loadCharacterBlobs = async () => {
    const res = actor.role === 'dm'
      ? await env.DB.prepare('SELECT id, data, revision FROM characters').all()
      : await env.DB.prepare('SELECT id, data, revision FROM characters WHERE owner_id = ?').bind(actor.id).all();
    return res.results || [];
  };

  const saveCharacterBlob = async (id: string, blob: any, nextRevision: number) => {
    blob.revision = nextRevision;
    blob.updatedAt = new Date().toISOString();
    await env.DB.prepare('UPDATE characters SET data = ?, revision = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(blob), nextRevision, now, id).run();
    return blob;
  };

  // ---------------------------------------------------------
  // Home Summary (GET /api/home) — data for the post-login home screen
  // ---------------------------------------------------------
  if (path === '/home' && method === 'GET') {
    // 1) Campaigns where the user holds an active membership
    const memRes = await env.DB.prepare(
      `SELECT c.*, m.role AS my_role,
              (SELECT COUNT(*) FROM campaign_members cm WHERE cm.campaign_id = c.id AND cm.status = 'active') AS member_count,
              (SELECT COUNT(*) FROM character_participations cp WHERE cp.campaign_id = c.id AND cp.status = 'active') AS character_count
         FROM campaign_members m
         JOIN campaigns c ON c.id = m.campaign_id
        WHERE m.user_id = ? AND m.status = 'active' AND c.deleted_at IS NULL
        ORDER BY c.updated_at DESC`
    ).bind(actor.id).all();
    const myCampaigns = (memRes.results || []).map(mapCampaignRow);

    // 2) Master characters (legacy JSON-blob rows) + participation summary
    const charRes = await env.DB.prepare('SELECT id, data FROM characters WHERE owner_id = ?').bind(actor.id).all();
    const myCharacters: any[] = [];
    const charIds: string[] = [];
    for (const row of charRes.results || []) {
      const parsed = parseBlob(row.data, null);
      if (parsed && parsed.status !== 'archived') {
        myCharacters.push(parsed);
        charIds.push(row.id);
      }
    }
    if (charIds.length > 0) {
      const placeholders = charIds.map(() => '?').join(',');
      const partRes = await env.DB.prepare(
        `SELECT id, character_id, campaign_id, status, level FROM character_participations WHERE character_id IN (${placeholders})`
      ).bind(...charIds).all();
      const byChar: Record<string, any[]> = {};
      for (const p of partRes.results || []) {
        (byChar[p.character_id] = byChar[p.character_id] || []).push({
          id: p.id,
          characterId: p.character_id,
          campaignId: p.campaign_id,
          status: p.status,
          level: p.level
        });
      }
      for (const c of myCharacters) {
        c.participations = byChar[c.id] || [];
      }
    }

    const isGlobalDm = actor.role === 'dm';
    const myDmIds = new Set(
      myCampaigns.filter((c: any) => c.myRole === 'owner' || c.myRole === 'co_dm').map((c: any) => c.id)
    );

    // 3) Pending campaign invites visible to DMs of those campaigns
    const inviteRes = await env.DB.prepare(
      'SELECT * FROM campaign_invites WHERE revoked_at IS NULL ORDER BY created_at DESC'
    ).all();
    const pendingInvites = (inviteRes.results || [])
      .filter((i: any) => i.expires_at > now && i.used_count < i.max_uses && (isGlobalDm || myDmIds.has(i.campaign_id)))
      .map((i: any) => ({
        id: i.id,
        campaignId: i.campaign_id,
        role: i.role,
        label: i.label,
        createdBy: i.created_by,
        createdAt: i.created_at,
        expiresAt: i.expires_at,
        maxUses: i.max_uses,
        usedCount: i.used_count,
        assignParticipationId: i.assign_participation_id,
        revokedAt: i.revoked_at
      }));

    // 4) Pending character approvals (creation / level-up / sheet change) for DM campaigns
    const apprRes = await env.DB.prepare(
      `SELECT p.id, p.character_id, p.campaign_id, p.status, p.level, p.class_name, p.pending_level_up, p.pending_change, p.joined_at, p.updated_at,
              ch.name AS char_name, ch.data AS char_data, u.display_name AS player_name, c.name AS campaign_name
         FROM character_participations p
         JOIN characters ch ON ch.id = p.character_id
         LEFT JOIN users u ON u.id = ch.owner_id
         JOIN campaigns c ON c.id = p.campaign_id
        WHERE p.status = 'pending_approval' 
           OR (p.pending_level_up IS NOT NULL AND p.pending_level_up != '')
           OR (p.pending_change IS NOT NULL AND p.pending_change != '')`
    ).all();
    const pendingApprovals: any[] = [];
    for (const p of apprRes.results || []) {
      if (!isGlobalDm && !myDmIds.has(p.campaign_id)) continue;
      const charBlob = parseBlob(p.char_data, null);
      const levelUp = parseBlob(p.pending_level_up, null);
      const pendingChange = parseBlob(p.pending_change, null);

      if (p.status === 'pending_approval') {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: 'create',
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || 'شخصیت جدید',
          playerName: p.player_name || 'کاربر',
          level: p.level,
          requestedAt: p.joined_at,
          details: { className: p.class_name, race: charBlob?.race }
        });
      } else if (pendingChange && pendingChange.type === 'level_up') {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: 'level_up',
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || 'شخصیت',
          playerName: p.player_name || 'کاربر',
          level: pendingChange.diff?.toLevel || (p.level + 1),
          requestedAt: pendingChange.requestedAt || p.updated_at,
          details: { diff: pendingChange.diff, payload: pendingChange.payload }
        });
      } else if (pendingChange && pendingChange.type === 'sheet_change') {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: 'sheet_change',
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || 'شخصیت',
          playerName: p.player_name || 'کاربر',
          level: p.level,
          requestedAt: pendingChange.requestedAt || p.updated_at,
          details: pendingChange
        });
      } else if (levelUp) {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: 'level_up',
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || 'شخصیت',
          playerName: p.player_name || 'کاربر',
          level: levelUp.targetLevel || p.level,
          requestedAt: levelUp.requestedAt || p.updated_at,
          details: levelUp.diff
        });
      }
    }

    // Backstory reviews ready in DM campaigns
    const backstoryReviewRes = await env.DB.prepare(
      `SELECT ch.id as char_id, ch.name as char_name, ch.data as char_data, ch.updated_at,
              u.display_name as player_name, cp.campaign_id, c.name as campaign_name, cp.id as part_id, cp.level
         FROM characters ch
         JOIN character_participations cp ON cp.character_id = ch.id
         JOIN campaigns c ON c.id = cp.campaign_id
         LEFT JOIN users u ON u.id = ch.owner_id
        WHERE ch.ready_for_review = 1`
    ).all();
    for (const br of (backstoryReviewRes.results || [])) {
      if (!isGlobalDm && !myDmIds.has((br as any).campaign_id)) continue;
      const charBlob = parseBlob((br as any).char_data, null);
      if (charBlob?.reviewStatus === 'approved') continue;
      pendingApprovals.push({
        campaignId: (br as any).campaign_id,
        campaignName: (br as any).campaign_name,
        type: 'backstory_review',
        participationId: (br as any).part_id,
        characterId: (br as any).char_id,
        characterName: (br as any).char_name || charBlob?.name || 'شخصیت',
        playerName: (br as any).player_name || 'کاربر',
        level: (br as any).level || 1,
        requestedAt: (br as any).updated_at,
        details: { backstory: charBlob?.backstory }
      });
    }

    return json({
      user: {
        id: actor.id,
        email: actor.email,
        name: actor.display_name,
        displayName: actor.display_name,
        role: actor.role,
        status: actor.status,
        mustChangePassword: actor.must_change_password === 1,
        activeCharacterId: actor.active_character_id || null,
        avatarUrl: actor.avatar_url || null
      },
      myCampaigns,
      myCharacters,
      pendingInvites,
      pendingApprovals
    });
  }

  // GET /api/campaigns — campaigns the current user belongs to
  if (path === '/campaigns' && method === 'GET') {
    const memRes = await env.DB.prepare(
      `SELECT c.*, m.role AS my_role,
              (SELECT COUNT(*) FROM campaign_members cm WHERE cm.campaign_id = c.id AND cm.status = 'active') AS member_count,
              (SELECT COUNT(*) FROM character_participations cp WHERE cp.campaign_id = c.id AND cp.status = 'active') AS character_count
         FROM campaign_members m
         JOIN campaigns c ON c.id = m.campaign_id
        WHERE m.user_id = ? AND m.status = 'active' AND c.deleted_at IS NULL
        ORDER BY c.updated_at DESC`
    ).bind(actor.id).all();
    return json((memRes.results || []).map(mapCampaignRow));
  }

  // GET /api/c/:id — single campaign (with membership role)
  if (path.match(/^\/c\/[^/]+$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!row) return error('کمپین مورد نظر یافت نشد.', 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('کمپین مورد نظر یافت نشد.', 404);
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({
      ...row,
      my_role: myRole || 'owner',
      member_count: mc?.n ?? 0,
      character_count: cc?.n ?? 0
    }));
  }

  // GET /api/c/:id/members
  if (path.match(/^\/c\/[^/]+\/members$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 403);
    const res = await env.DB.prepare(
      `SELECT m.campaign_id, m.user_id, m.role, m.status, m.joined_at, u.display_name, u.email, u.avatar_url
         FROM campaign_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.campaign_id = ?
        ORDER BY m.joined_at ASC`
    ).bind(campId).all();
    return json((res.results || []).map((r: any) => ({
      campaignId: r.campaign_id,
      userId: r.user_id,
      role: r.role,
      status: r.status,
      joinedAt: r.joined_at,
      userName: r.display_name,
      userEmail: r.email,
      userAvatarUrl: r.avatar_url
    })));
  }

  // GET /api/c/:id/invites (owner / co_dm only)
  if (path.match(/^\/c\/[^/]+\/invites$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== 'dm' && myRole !== 'owner' && myRole !== 'co_dm') {
      return error('دسترسی مجاز نیست.', 403);
    }
    const res = await env.DB.prepare(
      'SELECT * FROM campaign_invites WHERE campaign_id = ? AND revoked_at IS NULL ORDER BY created_at DESC'
    ).bind(campId).all();
    return json((res.results || []).map((r: any) => ({
      id: r.id,
      campaignId: r.campaign_id,
      role: r.role,
      label: r.label,
      createdBy: r.created_by,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      maxUses: r.max_uses,
      usedCount: r.used_count,
      assignParticipationId: r.assign_participation_id,
      revokedAt: r.revoked_at
    })));
  }

  // POST /api/c/:id/invites — create a campaign invite (owner / co_dm only)
  if (path.match(/^\/c\/[^/]+\/invites$/) && method === 'POST') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== 'dm' && myRole !== 'owner' && myRole !== 'co_dm') {
      return error('دسترسی مجاز نیست.', 403);
    }
    const body = await request.json() as any;
    const role = ['owner', 'co_dm', 'player', 'spectator'].includes(body.role) ? body.role : 'player';
    const label = String(body.label || 'دعوت جدید').trim();
    const expiresInDays = Math.max(1, Math.min(365, parseInt(String(body.expiresInDays || 30), 10)));
    const maxUses = Math.max(1, parseInt(String(body.maxUses || 1), 10));
    const assignParticipationId = body.assignParticipationId || null;
    const rawCode = `inv-${generateRandomToken(6)}`;
    const codeHash = await sha256Hex(rawCode);
    const inviteId = `cinv-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;
    await env.DB.prepare(
      `INSERT INTO campaign_invites (id, campaign_id, code_hash, role, label, created_by, created_at, expires_at, max_uses, used_count, assign_participation_id, revoked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL)`
    ).bind(inviteId, campId, codeHash, role, label, actor.id, now, expiresAt, maxUses, assignParticipationId).run();
    await audit('campaign-invite-create', inviteId, { campaignId: campId, role, label, maxUses, expiresAt });
    return json({
      id: inviteId,
      campaignId: campId,
      code: rawCode,
      role,
      label,
      createdBy: actor.id,
      createdAt: now,
      expiresAt,
      maxUses,
      usedCount: 0,
      assignParticipationId,
      revokedAt: null
    }, 201);
  }

  // DELETE /api/c/:id/invites/:inviteId — revoke a campaign invite
  if (path.match(/^\/c\/[^/]+\/invites\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const campId = parts[2];
    const inviteId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== 'dm' && myRole !== 'owner' && myRole !== 'co_dm') {
      return error('دسترسی مجاز نیست.', 403);
    }
    const res = await env.DB.prepare(
      'UPDATE campaign_invites SET revoked_at = ? WHERE id = ? AND campaign_id = ? AND revoked_at IS NULL'
    ).bind(now, inviteId, campId).run();
    const changes = res?.meta?.changes ?? 0;
    if (changes === 0) return error('دعوت‌نامه یافت نشد.', 404);
    await audit('campaign-invite-revoke', inviteId, { campaignId: campId });
    return json({ success: true });
  }

  // POST /api/invites/accept — join a campaign via invite code (any authenticated user)
  if (path === '/invites/accept' && method === 'POST') {
    const body = await request.json() as any;
    const code = String(body.code || '').trim();
    if (!code) return error('کد دعوت را وارد کنید.');
    const codeHash = await sha256Hex(code);
    const inv = await env.DB.prepare(
      'SELECT * FROM campaign_invites WHERE code_hash = ? OR id = ?'
    ).bind(codeHash, code).first();
    if (!inv || inv.revoked_at) return error('کد دعوت نامعتبر یا منقضی شده است.', 404);
    if (inv.expires_at > 0 && inv.expires_at < now) return error('این کد دعوت منقضی شده است.');
    if (inv.used_count >= inv.max_uses) return error('این کد دعوت قبلاً استفاده شده است.');
    if (!inv.campaign_id) return error('این کد دعوت معتبر نیست.');
    const campId = inv.campaign_id as string;
    const camp = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!camp) return error('کمپین این دعوت یافت نشد.', 404);
    const existing = await env.DB.prepare(
      'SELECT status FROM campaign_members WHERE campaign_id = ? AND user_id = ?'
    ).bind(campId, actor.id).first();
    if (existing && existing.status === 'active') return error('شما هم‌اکنون عضو این کمپین هستید.');
    const memberRole = ['owner', 'co_dm', 'player', 'spectator'].includes(inv.role) ? inv.role : 'player';
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, ?, 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO UPDATE SET role = excluded.role, status = 'active', joined_at = excluded.joined_at`
    ).bind(campId, actor.id, memberRole, now).run();
    await env.DB.prepare(
      'UPDATE campaign_invites SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses'
    ).bind(inv.id).run();
    await audit('campaign-invite-accept', inv.id, { campaignId: campId, role: memberRole });
    return json({ campaignId: campId, role: memberRole });
  }

  // ---------------------------------------------------------
  // Campaign settings (client passes the active campaign id)
  // ---------------------------------------------------------
  if (path === '/settings/campaign' && method === 'GET') {
    const campId = url.searchParams.get('campaignId');
    if (!campId) return json({ allowPlayerCreateCharacter: true });
    const row = await env.DB.prepare('SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!row) return json({ allowPlayerCreateCharacter: true });
    const settings = parseBlob(row.settings, {});
    return json({ allowPlayerCreateCharacter: settings.allowPlayerCreateCharacter ?? true });
  }

  if (path === '/settings/campaign' && method === 'PUT') {
    const body = await request.json() as any;
    const campId = body.campaignId || url.searchParams.get('campaignId');
    if (!campId) return error('کمپین فعال یافت نشد.');
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== 'dm' && myRole !== 'owner' && myRole !== 'co_dm') {
      return error('دسترسی مجاز نیست.', 403);
    }
    const row = await env.DB.prepare('SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!row) return error('کمپین مورد نظر یافت نشد.', 404);
    const settings = parseBlob(row.settings, {});
    if (typeof body.allowPlayerCreateCharacter === 'boolean') {
      settings.allowPlayerCreateCharacter = body.allowPlayerCreateCharacter;
    }
    await env.DB.prepare('UPDATE campaigns SET settings = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(settings), now, campId).run();
    return json({ allowPlayerCreateCharacter: settings.allowPlayerCreateCharacter ?? true });
  }

  // ---------------------------------------------------------
  // Content lists used by the campaign workspace
  // ---------------------------------------------------------
  if (path === '/rewards' && method === 'GET') {
    const res = await env.DB.prepare('SELECT data FROM rewards').all();
    return json((res.results || []).map((r: any) => parseBlob(r.data, null)).filter(Boolean));
  }

  if (path === '/weapon-templates' && method === 'GET') {
    const res = await env.DB.prepare('SELECT data FROM weapon_templates').all();
    return json((res.results || []).map((r: any) => parseBlob(r.data, null)).filter(Boolean));
  }

  if (path === '/class-templates' && method === 'GET') {
    const res = await env.DB.prepare('SELECT data FROM class_templates').all();
    return json((res.results || []).map((r: any) => parseBlob(r.data, null)).filter(Boolean));
  }

  if (path === '/campaign-notes' && method === 'GET') {
    if (actor.role !== 'dm') return json([]);
    const res = await env.DB.prepare('SELECT data FROM campaign_notes').all();
    return json((res.results || []).map((r: any) => parseBlob(r.data, null)).filter(Boolean));
  }

  // ---------------------------------------------------------
  // Group Rest / Group Resources (mutate character JSON blobs)
  // ---------------------------------------------------------
  if (path === '/characters/group-rest' && method === 'POST') {
    const body = await request.json() as any;
    const type = body.type === 'long' || body.type === 'special' ? body.type : 'short';
    const notes = String(body.notes || '');
    const rows = await loadCharacterBlobs();
    const updated: any[] = [];
    for (const row of rows) {
      const char = parseBlob(row.data, null);
      if (!char) continue;
      const hp = { current: 0, max: 0, temp: 0, ...(char.hp || {}) };
      let exhaustion = char.exhaustion || 0;
      const features = (char.features || []).map((f: any) => {
        if (type === 'long') return { ...f, usedCount: 0 };
        if (type === 'short' && f.usageType === 'short') return { ...f, usedCount: 0 };
        return f;
      });
      const weapons = (char.weapons || []).map((w: any) => {
        if (type === 'long') return { ...w, abilityUsed: 0 };
        if (type === 'short' && (w.specialAbility?.restType === 'short' || w.abilityReset === 'short')) {
          return { ...w, abilityUsed: 0 };
        }
        return w;
      });
      if (type === 'long') {
        hp.current = hp.max;
        hp.temp = 0;
        if (exhaustion > 0) exhaustion -= 1;
      } else if (type === 'special') {
        hp.current = Math.min(hp.max, hp.current + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + 2);
        if (exhaustion > 0) exhaustion -= 1;
      }
      const restEntry = {
        id: `rest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: new Date().toLocaleDateString('fa-IR'),
        type,
        notes: notes || (type === 'long' ? 'استراحت کامل گروهی' : type === 'short' ? 'استراحت کوتاه گروهی' : 'استراحت ویژه در اردوگاه پریان')
      };
      const nextRevision = Number(row.revision || 0) + 1;
      const saved = await saveCharacterBlob(row.id, {
        ...char,
        hp,
        exhaustion,
        features,
        weapons,
        restLog: [restEntry, ...(char.restLog || [])]
      }, nextRevision);
      updated.push(saved);
    }
    return json(updated);
  }

  if (path === '/characters/group-resources' && method === 'POST') {
    const body = await request.json() as any;
    const rationsDelta = Number(body.rations || 0);
    const oilDelta = Number(body.lanternOil || 0);
    const rows = await loadCharacterBlobs();
    const updated: any[] = [];
    for (const row of rows) {
      const char = parseBlob(row.data, null);
      if (!char) continue;
      const saved = await saveCharacterBlob(row.id, {
        ...char,
        rations: Math.max(0, (char.rations || 0) + rationsDelta),
        lanternOil: Math.max(0, (char.lanternOil || 0) + oilDelta)
      }, Number(row.revision || 0) + 1);
      updated.push(saved);
    }
    return json(updated);
  }

  // ---------------------------------------------------------
  // Campaign create / update / members (multi-campaign writes)
  // ---------------------------------------------------------
  const requireCampaignDm = async (campId: string) => {
    const myRole = await getMembershipRole(campId, actor.id);
    return actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';
  };

  // POST /api/campaigns — create a campaign (owner membership created atomically)
  if (path === '/campaigns' && method === 'POST') {
    const body = await request.json() as any;
    const name = String(body.name || '').trim();
    if (!name) return error('نام کمپین الزامی است.');
    const campId = `camp-${Date.now()}-${generateRandomToken(4)}`;
    const defaultSettings = {
      units: 'feet',
      startingLevel: 1,
      maxEntryLevel: 20,
      abilityScoreMethods: ['standard_array', 'point_buy', 'roll', 'manual'],
      approval: { onCreate: false, onLevelUp: false },
      backstoryVisibility: 'party',
      diceVisibility: 'table',
      allowPlayerRollPrivate: true,
      allowPlayerCreateCharacter: true,
      encounterDefaults: { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true }
    };
    const settings = { ...defaultSettings, ...(body.settings || {}) };
    const description = String(body.description || '');
    const tone = body.tone ? String(body.tone) : null;
    const sourcePackId = body.packId ? String(body.packId) : null;
    await env.DB.prepare(
      `INSERT INTO campaigns (id, name, description, tone, status, owner_id, source_pack_id, settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`
    ).bind(campId, name, description, tone, actor.id, sourcePackId, JSON.stringify(settings), now, now).run();
    await env.DB.prepare(
      "INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, 'owner', 'active', ?)"
    ).bind(campId, actor.id, now).run();
    await audit('campaign-create', campId, { name });
    const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campId).first();
    return json(mapCampaignRow({ ...row, my_role: 'owner', member_count: 1, character_count: 0 }), 201);
  }

  // PATCH /api/c/:id — update campaign fields (owner / co_dm)
  if (path.match(/^\/c\/[^/]+$/) && method === 'PATCH') {
    const campId = path.split('/')[2];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);
    const row = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!row) return error('کمپین مورد نظر یافت نشد.', 404);
    const body = await request.json() as any;
    const next = {
      name: body.name !== undefined ? String(body.name) : row.name,
      description: body.description !== undefined ? String(body.description) : row.description,
      tone: body.tone !== undefined ? body.tone : row.tone,
      status: body.status !== undefined && ['draft', 'active', 'paused', 'archived'].includes(body.status) ? body.status : row.status,
      settings: body.settings !== undefined && body.settings ? body.settings : parseBlob(row.settings, {})
    };
    await env.DB.prepare(
      'UPDATE campaigns SET name = ?, description = ?, tone = ?, status = ?, settings = ?, updated_at = ? WHERE id = ?'
    ).bind(next.name, next.description, next.tone, next.status, JSON.stringify(next.settings), now, campId).run();
    await audit('campaign-update', campId, { fields: Object.keys(body) });
    const updated = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campId).first();
    const myRole = await getMembershipRole(campId, actor.id);
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({ ...updated, my_role: myRole || 'owner', member_count: mc?.n ?? 0, character_count: cc?.n ?? 0 }));
  }

  // PATCH /api/c/:id/members/:userId — change member role/status
  if (path.match(/^\/c\/[^/]+\/members\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const campId = parts[2];
    const targetUserId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);
    const member = await env.DB.prepare(
      'SELECT * FROM campaign_members WHERE campaign_id = ? AND user_id = ?'
    ).bind(campId, targetUserId).first();
    if (!member) return error('عضو مورد نظر یافت نشد.', 404);
    const body = await request.json() as any;
    if (member.role === 'owner' && body.role && body.role !== 'owner') {
      return error('نمی‌توانید نقش مالک کمپین را تغییر دهید.', 400);
    }
    const nextRole = body.role && ['owner', 'co_dm', 'player', 'spectator'].includes(body.role) ? body.role : member.role;
    const nextStatus = body.status && ['invited', 'active', 'left', 'removed'].includes(body.status) ? body.status : member.status;
    await env.DB.prepare('UPDATE campaign_members SET role = ?, status = ? WHERE campaign_id = ? AND user_id = ?')
      .bind(nextRole, nextStatus, campId, targetUserId).run();
    await audit('campaign-member-update', targetUserId, { campaignId: campId, role: nextRole, status: nextStatus });
    const u = await env.DB.prepare('SELECT display_name, email, avatar_url FROM users WHERE id = ?').bind(targetUserId).first();
    return json({
      campaignId: campId,
      userId: targetUserId,
      role: nextRole,
      status: nextStatus,
      joinedAt: member.joined_at,
      userName: u?.display_name,
      userEmail: u?.email,
      userAvatarUrl: u?.avatar_url
    });
  }

  // DELETE /api/c/:id/members/:userId — remove a member (cannot remove owner)
  if (path.match(/^\/c\/[^/]+\/members\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const campId = parts[2];
    const targetUserId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);
    const member = await env.DB.prepare(
      'SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?'
    ).bind(campId, targetUserId).first();
    if (!member) return error('عضو مورد نظر یافت نشد.', 404);
    if (member.role === 'owner') return error('امکان حذف مالک کمپین وجود ندارد.', 400);
    await env.DB.prepare("UPDATE campaign_members SET status = 'removed' WHERE campaign_id = ? AND user_id = ?")
      .bind(campId, targetUserId).run();
    await audit('campaign-member-remove', targetUserId, { campaignId: campId });
    return json({ success: true });
  }

  // POST /api/c/:id/transfer-ownership — owner transfers ownership to an active member
  if (path.match(/^\/c\/[^/]+\/transfer-ownership$/) && method === 'POST') {
    const campId = path.split('/')[2];
    const body = await request.json() as any;
    const newOwnerId = String(body.newOwnerId || '');
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== 'dm' && myRole !== 'owner') {
      return error('فقط مالک کمپین می‌تواند مالکیت را منتقل کند.', 403);
    }
    const camp = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!camp) return error('کمپین مورد نظر یافت نشد.', 404);
    const newOwnerMem = await env.DB.prepare(
      "SELECT user_id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND status = 'active'"
    ).bind(campId, newOwnerId).first();
    if (!newOwnerMem) return error('شخص انتخاب‌شده باید ابتدا عضو فعال کمپین باشد.', 400);
    if (newOwnerId === camp.owner_id) return error('این شخص هم‌اکنون مالک کمپین است.', 400);
    await env.DB.prepare("UPDATE campaign_members SET role = 'co_dm' WHERE campaign_id = ? AND user_id = ?")
      .bind(campId, camp.owner_id).run();
    await env.DB.prepare("UPDATE campaign_members SET role = 'owner' WHERE campaign_id = ? AND user_id = ?")
      .bind(campId, newOwnerId).run();
    await env.DB.prepare('UPDATE campaigns SET owner_id = ?, updated_at = ? WHERE id = ?').bind(newOwnerId, now, campId).run();
    await audit('campaign-transfer-ownership', campId, { newOwnerId });
    const updated = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campId).first();
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({ ...updated, my_role: (await getMembershipRole(campId, actor.id)) || undefined, member_count: mc?.n ?? 0, character_count: cc?.n ?? 0 }));
  }

  // ---------------------------------------------------------
  // Shared dice feed (/c/:id/dice)
  // ---------------------------------------------------------
  const mapDiceRoll = (r: any) => ({
    id: r.id,
    campaignId: r.campaign_id,
    userId: r.user_id,
    userName: r.user_name,
    characterId: r.character_id,
    characterName: r.character_name,
    rollType: r.roll_type,
    diceExpression: r.dice_expression,
    total: r.total,
    details: parseBlob(r.details, { rolls: [r.total], modifier: 0 }),
    visibility: r.visibility,
    createdAt: r.created_at
  });

  if (path.match(/^\/c\/[^/]+\/dice$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 403);
    const isCampaignDm = myRole === 'owner' || myRole === 'co_dm' || actor.role === 'dm';
    const res = await env.DB.prepare(
      'SELECT * FROM dice_rolls WHERE campaign_id = ? ORDER BY created_at DESC, id DESC LIMIT 500'
    ).bind(campId).all();
    let rolls = (res.results || []).map(mapDiceRoll);
    if (!isCampaignDm) {
      rolls = rolls.filter((r: any) => r.visibility === 'table' || r.userId === actor.id);
    }
    const after = url.searchParams.get('after');
    if (after) {
      const idx = rolls.findIndex((r: any) => r.id === after);
      if (idx !== -1) rolls = rolls.slice(0, idx);
    }
    const limit = Math.max(1, Math.min(200, parseInt(url.searchParams.get('limit') || '50', 10)));
    return json(rolls.slice(0, limit));
  }

  if (path.match(/^\/c\/[^/]+\/dice$/) && method === 'POST') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 403);
    const camp = await env.DB.prepare('SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!camp) return error('کمپین مورد نظر یافت نشد.', 404);
    const settings = parseBlob(camp.settings, {});
    const body = await request.json() as any;
    let vis = body.visibility === 'dm_only' ? 'dm_only' : 'table';
    if (actor.role !== 'dm' && vis === 'dm_only' && !settings.allowPlayerRollPrivate) vis = 'table';
    const rollId = `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const details = {
      rolls: Array.isArray(body.results) ? body.results : [Number(body.total || 0) - Number(body.modifier || 0)],
      modifier: Number(body.modifier || 0),
      advantage: body.mode === 'normal' ? undefined : body.mode,
      isCritical: !!body.nat20,
      isFumble: !!body.nat1,
      label: body.label || 'پرتاب تاس'
    };
    await env.DB.prepare(
      `INSERT INTO dice_rolls (id, campaign_id, user_id, character_id, user_name, character_name, roll_type, dice_expression, total, details, visibility, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      rollId, campId, actor.id, actor.active_character_id || null, actor.display_name,
      null, String(body.label || 'dice_roll'), String(body.formula || ''), Number(body.total || 0),
      JSON.stringify(details), vis, now
    ).run();
    const row = await env.DB.prepare('SELECT * FROM dice_rolls WHERE id = ?').bind(rollId).first();
    return json(mapDiceRoll(row), 201);
  }

  // ---------------------------------------------------------
  // Media upload (portraits / covers), 150KB file + 5MB user quota
  // ---------------------------------------------------------
  const decodeBase64 = (b64: string): Uint8Array => {
    const clean = b64.includes(',') ? b64.slice(b64.indexOf(',') + 1) : b64;
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  };

  const encodeBase64 = (bytes: Uint8Array): string => {
    let bin = '';
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  };

  if (path === '/media' && method === 'POST') {
    const body = await request.json() as any;
    const sizeBytes = Number(body.sizeBytes || 0);
    if (!body.mimeType || !body.dataBase64) return error('فایل نامعتبر است.');
    const campaignId = body.campaignId ? String(body.campaignId) : null;

    if (campaignId) {
      const myRole = await getMembershipRole(campaignId, actor.id);
      if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 403);

      // Handouts and Maps cap: 400 KB each
      if (sizeBytes > 400 * 1024) {
        return error('حجم تصویر نباید بیش از ۴۰۰ کیلوبایت باشد. لطفاً قبل از ارسال تصویر را فشرده کنید.', 413);
      }

      // Per-campaign quota: 20 MB (setting)
      let currentTotal = 0;
      try {
        const qRow = await env.DB.prepare('SELECT COALESCE(SUM(size_bytes), 0) AS total FROM media WHERE campaign_id = ?').bind(campaignId).first();
        currentTotal = Number(qRow?.total || 0);
      } catch {}
      if (currentTotal + sizeBytes > 20 * 1024 * 1024) {
        return error('سهمیه ذخیره‌سازی رسانه‌های این کمپین (۲۰ مگابایت) پر است.', 400);
      }
    } else {
      // Non-campaign media (e.g. user portrait): 150 KB cap + 5 MB user quota
      if (sizeBytes > 150 * 1024) {
        return error('حجم تصویر نباید بیش از ۱۵۰ کیلوبایت باشد. لطفاً قبل از ارسال تصویر را فشرده کنید.', 413);
      }
      const quota = await env.DB.prepare('SELECT COALESCE(SUM(size_bytes), 0) AS total FROM media WHERE owner_id = ? AND (campaign_id IS NULL OR campaign_id = "")').bind(actor.id).first();
      if (Number(quota?.total || 0) + sizeBytes > 5 * 1024 * 1024) {
        return error('سهمیه ذخیره‌سازی شما (۵ مگابایت) پر است.', 400);
      }
    }

    const bytes = decodeBase64(String(body.dataBase64));
    const mediaId = `media-${Date.now()}-${generateRandomToken(3)}`;
    try {
      await env.DB.prepare(
        'INSERT INTO media (id, owner_id, campaign_id, mime_type, size_bytes, data, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(mediaId, actor.id, campaignId, String(body.mimeType), sizeBytes, bytes, body.width ?? null, body.height ?? null, now).run();
    } catch {
      await env.DB.prepare(
        'INSERT INTO media (id, owner_id, mime_type, size_bytes, data, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(mediaId, actor.id, String(body.mimeType), sizeBytes, bytes, body.width ?? null, body.height ?? null, now).run();
    }
    const urlOut = `/api/media/${mediaId}`;
    return json({ id: mediaId, url: urlOut, sizeBytes }, 201);
  }

  if (path.match(/^\/media\/[^/]+$/) && method === 'GET') {
    const mediaId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT * FROM media WHERE id = ?').bind(mediaId).first();
    if (!row) return error('رسانه یافت نشد.', 404);

    // Authorization check: If media belongs to a campaign handout, ensure user has rights to view
    try {
      const handout = await env.DB.prepare('SELECT id, campaign_id, visibility FROM handouts WHERE media_id = ?').bind(mediaId).first();
      if (handout) {
        const myRole = await getMembershipRole(handout.campaign_id, actor.id);
        const isDm = actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';
        if (!isDm) {
          if (handout.visibility === 'hidden') {
            return error('رسانه یافت نشد.', 404);
          }
          if (handout.visibility === 'selected') {
            const hasRecip = await env.DB.prepare(`
              SELECT 1 FROM handout_recipients hr
              JOIN character_participations cp ON hr.participation_id = cp.id
              JOIN characters c ON cp.character_id = c.id
              WHERE hr.handout_id = ? AND c.owner_id = ?
            `).bind(handout.id, actor.id).first();
            if (!hasRecip) {
              return error('دسترسی مجاز نیست.', 403);
            }
          }
          if (!myRole) {
            return error('دسترسی مجاز نیست.', 403);
          }
        }
      }
    } catch {}

    let bytes: Uint8Array;
    const d: any = row.data;
    if (d instanceof Uint8Array) bytes = d;
    else if (d instanceof ArrayBuffer) bytes = new Uint8Array(d);
    else if (Array.isArray(d)) bytes = Uint8Array.from(d);
    else if (typeof d === 'string') bytes = new TextEncoder().encode(d);
    else bytes = new Uint8Array(0);

    const accept = request.headers.get('accept') || '';
    const urlObj = new URL(request.url);
    if (urlObj.searchParams.get('format') === 'json' || (accept.includes('application/json') && !accept.includes('image/'))) {
      return json({
        id: row.id,
        ownerId: row.owner_id,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        dataBase64: encodeBase64(bytes),
        width: row.width,
        height: row.height,
        createdAt: row.created_at
      });
    }

    return new Response(bytes.buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': row.mime_type || 'image/webp',
        'Content-Length': String(row.size_bytes),
        'Cache-Control': 'private, max-age=86400'
      }
    });
  }

  if (path.match(/^\/media\/[^/]+$/) && method === 'DELETE') {
    const mediaId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id FROM media WHERE id = ?').bind(mediaId).first();
    if (!row) return error('رسانه یافت نشد.', 404);
    if (row.owner_id !== actor.id && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 403);
    await env.DB.prepare('DELETE FROM media WHERE id = ?').bind(mediaId).run();
    return json({ success: true });
  }

  // Helper to verify author or campaign DM of a character
  const checkCharAuthorOrCampaignDm = async (charId: string) => {
    if (actor.role === 'dm') return true;
    const char = (await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(charId).first()) as { owner_id: string } | null;
    if (!char) return false;
    if (char.owner_id === actor.id) return true;
    const dmPart = await env.DB.prepare(
      `SELECT cm.role FROM character_participations cp
         JOIN campaign_members cm ON cm.campaign_id = cp.campaign_id
        WHERE cp.character_id = ? AND cm.user_id = ? AND cm.role IN ('owner', 'co_dm')`
    ).bind(charId, actor.id).first();
    return Boolean(dmPart);
  };

  // Helper to verify campaign DM of a character
  const checkCampaignDmForChar = async (charId: string) => {
    if (actor.role === 'dm') return true;
    const dmPart = await env.DB.prepare(
      `SELECT cm.role FROM character_participations cp
         JOIN campaign_members cm ON cm.campaign_id = cp.campaign_id
        WHERE cp.character_id = ? AND cm.user_id = ? AND cm.role IN ('owner', 'co_dm')`
    ).bind(charId, actor.id).first();
    return Boolean(dmPart);
  };

  // PATCH /api/characters/:id — update master character
  if (path.match(/^\/characters\/[^/]+$/) && method === 'PATCH') {
    const charId = path.split('/')[2];
    const charData = await request.json() as any;
    const row = (await env.DB.prepare('SELECT owner_id, revision, data FROM characters WHERE id = ?').bind(charId).first()) as { owner_id: string; revision: number; data: string } | null;
    if (!row || (actor.role !== 'dm' && row.owner_id !== actor.id)) return error('شخصیت مورد نظر یافت نشد.', 404);
    // Optimistic concurrency only when the client actually carries a revision
    if (charData.revision != null && row.revision !== charData.revision) {
      return error('شخصیت توسط شخص دیگری ویرایش شده است؛ لطفاً دوباره بارگذاری کنید.', 409);
    }
    const nextRevision = row.revision + 1;
    const oldChar = parseBlob(row.data, {});
    const updatedChar = { ...charData, revision: nextRevision, updatedAt: new Date().toISOString() };
    const readyForReview = updatedChar.readyForReview ? 1 : 0;

    await env.DB.prepare(
      'UPDATE characters SET name = ?, class_name = ?, level = ?, data = ?, revision = ?, ready_for_review = ?, updated_at = ? WHERE id = ?'
    ).bind(
      updatedChar.name || 'شخصیت بی‌نام',
      updatedChar.className || '',
      updatedChar.level || 1,
      JSON.stringify(updatedChar),
      nextRevision,
      readyForReview,
      now,
      charId
    ).run();

    // Auto-save revision if backstory was updated
    if (updatedChar.backstory && JSON.stringify(oldChar?.backstory) !== JSON.stringify(updatedChar.backstory)) {
      const revId = `rev-${Date.now()}-${generateRandomToken(3)}`;
      await env.DB.prepare(
        'INSERT INTO character_revisions (id, character_id, backstory, changed_by, created_at) VALUES (?, ?, ?, ?, ?)'
      ).bind(revId, charId, JSON.stringify(updatedChar.backstory), actor.id, now).run();

      // Prune: keep last 10
      const revs = await env.DB.prepare(
        'SELECT id FROM character_revisions WHERE character_id = ? ORDER BY created_at DESC'
      ).bind(charId).all();
      if (revs.results && revs.results.length > 10) {
        const toDelete = revs.results.slice(10).map((r: any) => r.id);
        for (const delId of toDelete) {
          await env.DB.prepare('DELETE FROM character_revisions WHERE id = ?').bind(delId).run();
        }
      }
    }

    return json(updatedChar);
  }

  // GET /api/characters/:id/revisions — list backstory revisions (last 10)
  if (path.match(/^\/characters\/[^/]+\/revisions$/) && method === 'GET') {
    const charId = path.split('/')[2];
    if (!(await checkCharAuthorOrCampaignDm(charId))) return error('دسترسی مجاز نیست.', 403);
    const rows = await env.DB.prepare(
      'SELECT * FROM character_revisions WHERE character_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(charId).all();
    const list = (rows.results || []).map((r: any) => ({
      id: r.id,
      characterId: r.character_id,
      backstory: parseBlob(r.backstory, {}),
      changedBy: r.changed_by,
      createdAt: r.created_at
    }));
    return json(list);
  }

  // POST /api/characters/:id/revisions — create a manual backstory revision
  if (path.match(/^\/characters\/[^/]+\/revisions$/) && method === 'POST') {
    const charId = path.split('/')[2];
    if (!(await checkCharAuthorOrCampaignDm(charId))) return error('دسترسی مجاز نیست.', 403);
    const body = await request.json() as any;
    const backstory = body.backstory || {};
    const revId = `rev-${Date.now()}-${generateRandomToken(3)}`;
    await env.DB.prepare(
      'INSERT INTO character_revisions (id, character_id, backstory, changed_by, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(revId, charId, JSON.stringify(backstory), actor.id, now).run();
    return json({ id: revId, characterId: charId, backstory, changedBy: actor.id, createdAt: now }, 201);
  }

  // POST /api/characters/:id/revisions/:revId/restore — restore revision
  if (path.match(/^\/characters\/[^/]+\/revisions\/[^/]+\/restore$/) && method === 'POST') {
    const parts = path.split('/');
    const charId = parts[2];
    const revId = parts[4];
    if (!(await checkCharAuthorOrCampaignDm(charId))) return error('دسترسی مجاز نیست.', 403);

    const revRow = (await env.DB.prepare('SELECT backstory FROM character_revisions WHERE id = ? AND character_id = ?').bind(revId, charId).first()) as { backstory: string } | null;
    if (!revRow) return error('ویرایش مورد نظر یافت نشد.', 404);

    const charRow = (await env.DB.prepare('SELECT data, revision FROM characters WHERE id = ?').bind(charId).first()) as { data: string; revision: number } | null;
    if (!charRow) return error('شخصیت یافت نشد.', 404);

    const char = parseBlob(charRow.data, {});
    char.backstory = parseBlob(revRow.backstory, {});
    const nextRevision = (charRow.revision || 0) + 1;
    char.revision = nextRevision;
    char.updatedAt = new Date().toISOString();

    await env.DB.prepare('UPDATE characters SET data = ?, revision = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(char), nextRevision, now, charId).run();

    return json(char);
  }

  // POST /api/characters/:id/ready-for-review — toggle ready for review
  if (path.match(/^\/characters\/[^/]+\/ready-for-review$/) && method === 'POST') {
    const charId = path.split('/')[2];
    if (!(await checkCharAuthorOrCampaignDm(charId))) return error('دسترسی مجاز نیست.', 403);
    const body = await request.json() as any;
    const ready = body.ready !== false;

    const charRow = (await env.DB.prepare('SELECT data, revision FROM characters WHERE id = ?').bind(charId).first()) as { data: string; revision: number } | null;
    if (!charRow) return error('شخصیت یافت نشد.', 404);

    const char = parseBlob(charRow.data, {});
    char.readyForReview = ready;
    char.reviewStatus = ready ? 'pending' : 'none';
    const nextRevision = (charRow.revision || 0) + 1;
    char.revision = nextRevision;
    char.updatedAt = new Date().toISOString();

    await env.DB.prepare('UPDATE characters SET data = ?, ready_for_review = ?, revision = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(char), ready ? 1 : 0, nextRevision, now, charId).run();

    return json(char);
  }

  // GET /api/characters/:id/backstory-comments — list section comments
  if (path.match(/^\/characters\/[^/]+\/backstory-comments$/) && method === 'GET') {
    const charId = path.split('/')[2];
    if (!(await checkCharAuthorOrCampaignDm(charId))) return error('دسترسی مجاز نیست.', 403);

    const rows = await env.DB.prepare(
      `SELECT c.*, u.display_name, u.role as user_role
         FROM backstory_comments c
         LEFT JOIN users u ON u.id = c.author_id
        WHERE c.character_id = ?
        ORDER BY c.created_at ASC`
    ).bind(charId).all();

    const comments = (rows.results || []).map((r: any) => ({
      id: r.id,
      characterId: r.character_id,
      sectionId: r.section_id,
      authorId: r.author_id,
      authorName: r.display_name || 'کاربر',
      authorRole: r.user_role === 'dm' ? 'دانجن مستر' : 'بازیکن',
      body: r.body,
      resolved: r.resolved === 1,
      createdAt: r.created_at
    }));
    return json(comments);
  }

  // POST /api/characters/:id/backstory-comments — add section comment
  if (path.match(/^\/characters\/[^/]+\/backstory-comments$/) && method === 'POST') {
    const charId = path.split('/')[2];
    if (!(await checkCharAuthorOrCampaignDm(charId))) return error('دسترسی مجاز نیست.', 403);
    const body = await request.json() as any;
    const sectionId = String(body.sectionId || 'general');
    const commentBody = String(body.body || '').trim();
    if (!commentBody) return error('متن دیدگاه نمی‌تواند خالی باشد.');

    const commentId = `comm-${Date.now()}-${generateRandomToken(4)}`;
    await env.DB.prepare(
      'INSERT INTO backstory_comments (id, character_id, section_id, author_id, body, resolved, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)'
    ).bind(commentId, charId, sectionId, actor.id, commentBody, now).run();

    return json({
      id: commentId,
      characterId: charId,
      sectionId,
      authorId: actor.id,
      authorName: actor.display_name,
      authorRole: actor.role === 'dm' ? 'دانجن مستر' : 'بازیکن',
      body: commentBody,
      resolved: false,
      createdAt: now
    }, 201);
  }

  // PATCH /api/characters/:id/backstory-comments/:commentId — toggle resolved
  if (path.match(/^\/characters\/[^/]+\/backstory-comments\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const charId = parts[2];
    const commentId = parts[4];
    if (!(await checkCharAuthorOrCampaignDm(charId))) return error('دسترسی مجاز نیست.', 403);

    const body = await request.json() as any;
    const resolved = body.resolved ? 1 : 0;
    await env.DB.prepare('UPDATE backstory_comments SET resolved = ? WHERE id = ? AND character_id = ?')
      .bind(resolved, commentId, charId).run();

    const row = await env.DB.prepare(
      `SELECT c.*, u.display_name, u.role as user_role
         FROM backstory_comments c
         LEFT JOIN users u ON u.id = c.author_id
        WHERE c.id = ?`
    ).bind(commentId).first();

    return json({
      id: (row as any).id,
      characterId: (row as any).character_id,
      sectionId: (row as any).section_id,
      authorId: (row as any).author_id,
      authorName: (row as any).display_name || 'کاربر',
      authorRole: (row as any).user_role === 'dm' ? 'دانجن مستر' : 'بازیکن',
      body: (row as any).body,
      resolved: (row as any).resolved === 1,
      createdAt: (row as any).created_at
    });
  }

  // POST /api/characters/:id/backstory-review — DM approve or request changes
  if (path.match(/^\/characters\/[^/]+\/backstory-review$/) && method === 'POST') {
    const charId = path.split('/')[2];
    if (!(await checkCampaignDmForChar(charId))) return error('فقط دانجن مستر مجاز به تأیید یا درخواست اصلاح پیشینه است.', 403);
    const body = await request.json() as any;
    const status = body.status === 'approved' ? 'approved' : 'changes_requested';
    const comment = String(body.comment || '').trim();

    const charRow = (await env.DB.prepare('SELECT data, revision FROM characters WHERE id = ?').bind(charId).first()) as { data: string; revision: number } | null;
    if (!charRow) return error('شخصیت یافت نشد.', 404);

    const char = parseBlob(charRow.data, {});
    char.reviewStatus = status;
    char.reviewComment = comment;
    if (status === 'approved') {
      char.readyForReview = false;
    }
    const nextRevision = (charRow.revision || 0) + 1;
    char.revision = nextRevision;
    char.updatedAt = new Date().toISOString();

    await env.DB.prepare('UPDATE characters SET data = ?, ready_for_review = ?, revision = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(char), status === 'approved' ? 0 : 1, nextRevision, now, charId).run();

    // History event
    await env.DB.prepare(
      'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, NULL, ?, ?, ?)'
    ).bind(
      `hist-rev-${Date.now()}-${generateRandomToken(3)}`,
      charId,
      'major_deed',
      JSON.stringify({
        title: status === 'approved' ? 'تأیید رسمی پیشینه داستانی' : 'درخواست اصلاح پیشینه',
        description: comment || (status === 'approved' ? 'پیشینه و خاستگاه شخصیت توسط دانجن مستر تأیید شد.' : 'دانجن مستر یادداشت‌هایی برای بهبود پیشینه درج کرد.')
      }),
      now
    ).run();

    return json(char);
  }

  if (path.match(/^\/characters\/[^/]+\/status$/) && method === 'POST') {
    const charId = path.split('/')[2];
    const body = await request.json() as any;
    if (!['active', 'retired', 'dead', 'archived'].includes(body.status)) return error('وضعیت نامعتبر است.');
    const row = await env.DB.prepare('SELECT owner_id, data, revision FROM characters WHERE id = ?').bind(charId).first();
    if (!row || (actor.role !== 'dm' && row.owner_id !== actor.id)) return error('شخصیت مورد نظر یافت نشد.', 404);
    const char = parseBlob(row.data, null);
    if (!char) return error('شخصیت مورد نظر یافت نشد.', 404);
    char.status = body.status;
    if (body.note !== undefined) char.statusNote = body.note;
    const saved = await saveCharacterBlob(charId, char, Number(row.revision || 0) + 1);
    return json(saved);
  }

  if (path.match(/^\/characters\/[^/]+\/history$/) && method === 'GET') {
    const charId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(charId).first();
    if (!row || (actor.role !== 'dm' && row.owner_id !== actor.id)) return error('شخصیت مورد نظر یافت نشد.', 404);
    const res = await env.DB.prepare(
      `SELECT h.*, c.name AS campaign_name
         FROM character_history_events h
         LEFT JOIN campaigns c ON c.id = h.campaign_id
        WHERE h.character_id = ?
        ORDER BY h.timestamp DESC`
    ).bind(charId).all();
    return json((res.results || []).map((r: any) => ({
      id: r.id,
      characterId: r.character_id,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name || undefined,
      eventType: r.event_type,
      payload: parseBlob(r.payload, {}),
      timestamp: r.timestamp
    })));
  }

  if (path.match(/^\/characters\/[^/]+\/history$/) && method === 'POST') {
    const charId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(charId).first();
    if (!row || (actor.role !== 'dm' && row.owner_id !== actor.id)) return error('شخصیت مورد نظر یافت نشد.', 404);
    const body = await request.json() as any;
    const eventTypes = ['joined', 'level_up', 'death', 'major_deed', 'retired', 'custom'];
    const eventType = eventTypes.includes(body.eventType) ? body.eventType : 'custom';
    let campaignId: string | null = null;
    if (body.campaignId) {
      const camp = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ?').bind(body.campaignId).first();
      campaignId = camp ? body.campaignId : null;
    }
    const eventId = `hist-${Date.now()}-${generateRandomToken(3)}`;
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};
    await env.DB.prepare(
      'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(eventId, charId, campaignId, eventType, JSON.stringify(payload), now).run();
    let campaignName: string | undefined;
    if (campaignId) {
      const camp = await env.DB.prepare('SELECT name FROM campaigns WHERE id = ?').bind(campaignId).first();
      campaignName = camp?.name;
    }
    return json({ id: eventId, characterId: charId, campaignId, campaignName, eventType, payload, timestamp: now }, 201);
  }

  if (path.match(/^\/characters\/[^/]+\/give-item$/) && method === 'POST') {
    if (actor.role !== 'dm') return error('فقط دانجن مستر می‌تواند شیء اهدا کند.', 403);
    const charId = path.split('/')[2];
    const body = await request.json() as any;
    const item = body.item || {};
    const row = await env.DB.prepare('SELECT data, revision FROM characters WHERE id = ?').bind(charId).first();
    if (!row) return error('شخصیت مورد نظر یافت نشد.', 404);
    const char = parseBlob(row.data, null);
    if (!char) return error('شخصیت مورد نظر یافت نشد.', 404);
    const invItem: any = {
      id: `inv-${Date.now()}`,
      name: item.name,
      quantity: 1,
      weight: 1,
      description: item.description,
      category: item.category === 'artifact' ? 'artifact' : item.category === 'weapon' ? 'weapon' : 'treasure',
      equipped: false,
      isQuestItem: item.category === 'quest',
      isNewBadge: true,
      mechanicalEffect: item.mechanicalEffect,
      secretNotes: item.secretNotes,
      weaponData: item.weaponData
    };
    char.inventory = [invItem, ...(char.inventory || [])];
    if (item.category === 'weapon' || item.weaponData) {
      const wData = item.weaponData;
      const newWeapon = {
        id: `w-${Date.now()}`,
        templateId: wData?.id,
        name: wData?.name || item.name,
        damageDice: wData?.damageDice || '1d6',
        damageType: wData?.damageType || 'سرد',
        range: wData?.range || 'نزدیک',
        properties: wData?.properties || '—',
        kind: wData?.kind || 'special',
        isSpecial: wData?.kind === 'special',
        isShowy: wData?.kind === 'showy',
        specialAbility: wData?.specialAbility,
        abilityName: wData?.specialAbility?.name,
        abilityDesc: wData?.specialAbility?.description,
        abilityMaxUses: wData?.specialAbility?.usesPerRest,
        abilityUsed: 0,
        abilityReset: wData?.specialAbility?.restType
      };
      char.weapons = [newWeapon, ...(char.weapons || [])];
    }
    const saved = await saveCharacterBlob(charId, char, Number(row.revision || 0) + 1);
    return json(saved);
  }

  // ---------------------------------------------------------
  // Character participations (join campaign, approvals, level-ups)
  // ---------------------------------------------------------
  const PART_SELECT = `
    SELECT p.*, c.name AS campaign_name, ch.data AS char_data
      FROM character_participations p
      JOIN campaigns c ON c.id = p.campaign_id
      LEFT JOIN characters ch ON ch.id = p.character_id
  `;

  const mapParticipation = (r: any) => {
    const charBlob = parseBlob(r.char_data, null);
    return {
      id: r.id,
      characterId: r.character_id,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name,
      status: r.status,
      classId: r.class_id || null,
      className: r.class_name || '',
      subclassName: r.subclass_name || undefined,
      level: r.level,
      xp: r.xp,
      abilityScores: parseBlob(r.ability_scores, { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
      currentHp: r.current_hp,
      maxHp: r.max_hp,
      tempHp: r.temp_hp,
      hitDice: parseBlob(r.hit_dice, { current: 0, max: 0, die: 'd8' }),
      acOverride: r.ac_override ?? null,
      speedOverride: r.speed_override ?? null,
      deathSaves: parseBlob(r.death_saves, { successes: 0, failures: 0 }),
      conditions: parseBlob(r.conditions, []),
      inventory: parseBlob(r.inventory, []),
      weapons: parseBlob(r.weapons, []),
      currency: parseBlob(r.currency, { gold: 0, silver: 0, copper: 0 }),
      customResources: parseBlob(r.custom_resources, []),
      spellsKnownPrepared: parseBlob(r.spells_known_prepared, undefined),
      spellSlots: parseBlob(r.spell_slots, undefined),
      features: parseBlob(r.features, []),
      notes: r.notes || '',
      dmNotes: r.dm_notes || '',
      build: parseBlob(r.build, null),
      sheetLocked: r.sheet_locked === 1,
      levelUpAvailable: r.level_up_available === 1,
      pendingLevelUp: parseBlob(r.pending_level_up, null),
      pendingChange: parseBlob(r.pending_change, null),
      joinedAt: r.joined_at,
      updatedAt: r.updated_at,
      characterName: charBlob?.name,
      characterRace: charBlob?.race,
      characterPortraitUrl: charBlob?.portraitUrl
    };
  };

  // GET /api/c/:id/participations — list for a campaign (membership required);
  // if :id is actually a character id (master character screen), list that character's participations.
  if (path.match(/^\/c\/[^/]+\/participations$/) && method === 'GET') {
    const cid = path.split('/')[2];
    const camp = await env.DB.prepare('SELECT id FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(cid).first();
    if (camp) {
      const myRole = await getMembershipRole(cid, actor.id);
      if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 403);
      const res = await env.DB.prepare(`${PART_SELECT} WHERE p.campaign_id = ? ORDER BY p.joined_at DESC`).bind(cid).all();
      return json((res.results || []).map(mapParticipation));
    }
    const char = await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(cid).first();
    if (!char || (char.owner_id !== actor.id && actor.role !== 'dm')) return json([]);
    const res = await env.DB.prepare(`${PART_SELECT} WHERE p.character_id = ? ORDER BY p.joined_at DESC`).bind(cid).all();
    return json((res.results || []).map(mapParticipation));
  }

  // POST /api/c/:id/participations — bring a master character into a campaign
  if (path.match(/^\/c\/[^/]+\/participations$/) && method === 'POST') {
    const campId = path.split('/')[2];
    const body = await request.json() as any;
    const camp = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!camp) return error('کمپین یافت نشد.', 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('ابتدا باید به این کمپین بپیوندید.', 403);
    if (!body.characterId) return error('شخصیت را انتخاب کنید.');

    const settings = parseBlob(camp.settings, {});
    const maxLevel = Number(settings.maxEntryLevel || 20);
    let level = 1;
    if (body.entryMode === 'campaign_start') {
      level = Number(settings.startingLevel || 1);
    } else if (body.entryMode === 'new_level') {
      level = Math.min(Math.max(1, Number(body.entryLevel || 1)), maxLevel);
    } else if (body.entryMode === 'same_level') {
      level = Math.min(Number(body.entryLevel || 1), maxLevel);
    }

    const existing = await env.DB.prepare(
      'SELECT id FROM character_participations WHERE campaign_id = ? AND character_id = ?'
    ).bind(campId, body.characterId).first();
    if (existing) return error('این شخصیت در این کمپین حضور دارد.', 400);

    const charRow = await env.DB.prepare('SELECT owner_id, data FROM characters WHERE id = ?').bind(body.characterId).first();
    if (!charRow || (actor.role !== 'dm' && charRow.owner_id !== actor.id)) {
      return error('شخصیت مبدأ یافت نشد.', 404);
    }
    const charBlob = parseBlob(charRow.data, null);
    const hp = 10 + (level - 1) * 6;
    const initialStatus = settings.approval?.onCreate ? 'pending_approval' : 'active';
    const partId = `part-${Date.now()}-${generateRandomToken(3)}`;
    const abilityScores = JSON.stringify({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    const hitDice = JSON.stringify({ current: level, max: level, die: 'd8' });
    const deathSaves = JSON.stringify({ successes: 0, failures: 0 });
    const currency = JSON.stringify({ gold: 10, silver: 0, copper: 0 });
    await env.DB.prepare(
      `INSERT INTO character_participations
         (id, character_id, campaign_id, status, class_id, class_name, subclass_name, level, xp, ability_scores,
          current_hp, max_hp, temp_hp, hit_dice, ac_override, speed_override, death_saves, conditions, inventory,
          weapons, currency, custom_resources, spells_known_prepared, spell_slots, features, notes, dm_notes,
          pending_level_up, joined_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, ?, NULL, ?, 0, ?, ?, ?, 0, ?, NULL, NULL, ?, '[]', '[]', '[]', ?, '[]', NULL, NULL, '[]', '', '', NULL, ?, ?)`
    ).bind(
      partId, body.characterId, campId, initialStatus, 'ماجراجو', level, abilityScores,
      hp, hp, hitDice, deathSaves, currency, now, now
    ).run();
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, 'player', 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO NOTHING`
    ).bind(campId, actor.id, now).run();
    const campName = camp.name;
    await env.DB.prepare(
      'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      `hist-${Date.now()}-${generateRandomToken(3)}`, body.characterId, campId, 'joined',
      JSON.stringify({
        title: `پیوستن به کمپین ${campName}`,
        description: `ورود در حالت ${body.entryMode === 'campaign_start' ? 'شروع کمپین' : 'سطح ' + level} (سطح ${level})`,
        level
      }),
      now
    ).run();
    await audit('participation-create', partId, { campaignId: campId, characterId: body.characterId, status: initialStatus });
    const created = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(created), 201);
  }

  // PATCH /api/c/:id/participations/:pid — update participation fields
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    const part = await env.DB.prepare('SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?').bind(partId, campId).first();
    if (!part) return error('مشارکت شخصیت یافت نشد.', 404);
    const myRole = await getMembershipRole(campId, actor.id);
    const charRow = (await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(part.character_id).first()) as { owner_id: string } | null;
    const isCharOwner = charRow?.owner_id === actor.id;
    const isDmActor = actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';
    if (!isDmActor && !isCharOwner) {
      return error('دسترسی مجاز نیست.', 403);
    }
    const body = await request.json() as any;

    // Enforce sheet lock: player cannot edit core stats when sheet is locked
    if (!isDmActor && part.sheet_locked === 1) {
      for (const k of Object.keys(body)) {
        if (isFieldLockedForPlayer(k)) {
          return error('برگه شخصیت قفل است. مشخصات پایه فقط توسط دانجن مستر یا از طریق ارتقای سطح رسمی قابل تغییر است. برای تغییر این موارد از گزینه «درخواست تغییر به DM» استفاده کنید.', 403);
        }
      }
    }
    const colMap: Record<string, string> = {
      status: 'status', level: 'level', xp: 'xp', className: 'class_name', subclassName: 'subclass_name',
      classId: 'class_id', currentHp: 'current_hp', maxHp: 'max_hp', tempHp: 'temp_hp',
      acOverride: 'ac_override', speedOverride: 'speed_override', notes: 'notes', dmNotes: 'dm_notes',
      abilityScores: 'ability_scores', hitDice: 'hit_dice', deathSaves: 'death_saves', conditions: 'conditions',
      inventory: 'inventory', weapons: 'weapons', currency: 'currency', customResources: 'custom_resources',
      spellsKnownPrepared: 'spells_known_prepared', spellSlots: 'spell_slots', features: 'features',
      pendingLevelUp: 'pending_level_up', build: 'build', sheetLocked: 'sheet_locked'
    };
    const sets: string[] = [];
    const binds: any[] = [];
    for (const [key, col] of Object.entries(colMap)) {
      if (body[key] === undefined) continue;
      if (key === 'status' && !['draft', 'pending_approval', 'active', 'rejected', 'retired', 'dead'].includes(body[key])) {
        return error('وضعیت نامعتبر است.');
      }
      const value = key === 'sheetLocked' ? (body[key] ? 1 : 0) : body[key];
      sets.push(`${col} = ?`);
      binds.push(value !== null && typeof value === 'object' ? JSON.stringify(value) : value);
    }
    if (sets.length > 0) {
      sets.push('updated_at = ?');
      binds.push(now);
      binds.push(partId, campId);
      await env.DB.prepare(`UPDATE character_participations SET ${sets.join(', ')} WHERE id = ? AND campaign_id = ?`).bind(...binds).run();
    }
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }

  // POST /api/c/:id/participations/:pid/{approve|reject|request_changes} — DM review
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/(approve|reject|request_changes)$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    const action = parts[5];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);
    const part = await env.DB.prepare('SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?').bind(partId, campId).first();
    if (!part) return error('مشارکت شخصیت یافت نشد.', 404);
    const body = await request.json().catch(() => ({})) as any;
    const comment = body?.comment || '';
    const pending = parseBlob(part.pending_level_up, null);
    let nextStatus = part.status;
    let nextLevel = part.level;
    let nextPending: any = null;
    if (action === 'approve') {
      if (pending) {
        nextLevel = Number(pending.targetLevel || part.level);
        nextPending = null;
        const camp = await env.DB.prepare('SELECT name FROM campaigns WHERE id = ?').bind(campId).first();
        await env.DB.prepare(
          'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(
          `hist-lvl-${Date.now()}-${generateRandomToken(3)}`, part.character_id, campId, 'level_up',
          JSON.stringify({
            title: `ارتقای سطح به ${nextLevel} تأیید شد`,
            oldLevel: part.level,
            newLevel: nextLevel,
            description: comment || 'تأیید ارتقای سطح توسط دانجن مستر',
            campaignName: camp?.name
          }),
          now
        ).run();
      } else {
        nextStatus = 'active';
      }
    } else if (action === 'reject') {
      nextPending = null;
      if (!pending) nextStatus = 'rejected';
    }
    await env.DB.prepare(
      'UPDATE character_participations SET status = ?, level = ?, pending_level_up = ?, updated_at = ? WHERE id = ? AND campaign_id = ?'
    ).bind(nextStatus, nextLevel, nextPending ? JSON.stringify(nextPending) : null, now, partId, campId).run();
    await audit(`participation-${action}`, partId, { campaignId: campId, comment });
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }

  // ---------------------------------------------------------
  // Step 3.4: Level-Up, XP Awards, Approvals, Sheet Lock Endpoints
  // ---------------------------------------------------------

  // POST /api/c/:id/xp-awards (DM awards XP)
  if (path.match(/^\/c\/[^/]+\/xp-awards$/) && method === 'POST') {
    const campId = path.split('/')[2];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست. فقط دانجن مستر مجاز به اعطای تجربه است.', 403);
    const body = await request.json() as any;
    const amount = Number(body.amount || 0);
    if (amount <= 0) return error('میزان تجربه باید عددی مثبت باشد.');
    const reason = String(body.reason || 'پاداش تجربه دانجن مستر').trim();
    const targetPartId = body.participationId || null;

    const awardId = `xp-${Date.now()}-${generateRandomToken(3)}`;
    await env.DB.prepare(
      `INSERT INTO xp_awards (id, campaign_id, participation_id, amount, reason, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(awardId, campId, targetPartId, amount, reason, actor.id, now).run();

    const campRow = await env.DB.prepare('SELECT settings FROM campaigns WHERE id = ?').bind(campId).first();
    const campSettings = parseBlob(campRow?.settings, {});
    const isXpMode = campSettings.levelingMode === 'xp';

    if (targetPartId) {
      const partRow = await env.DB.prepare('SELECT id, level, xp FROM character_participations WHERE id = ? AND campaign_id = ?').bind(targetPartId, campId).first();
      if (partRow) {
        const newXp = (partRow.xp || 0) + amount;
        let ready = 0;
        if (isXpMode && partRow.level < 20) {
          const nextThresh = XP_THRESHOLDS[partRow.level + 1];
          if (typeof nextThresh === 'number' && newXp >= nextThresh) ready = 1;
        }
        await env.DB.prepare(
          'UPDATE character_participations SET xp = ?, level_up_available = CASE WHEN ? = 1 THEN 1 ELSE level_up_available END, updated_at = ? WHERE id = ?'
        ).bind(newXp, ready, now, targetPartId).run();
      }
    } else {
      // Party-wide XP award
      const allParts = await env.DB.prepare('SELECT id, level, xp FROM character_participations WHERE campaign_id = ? AND status = "active"').bind(campId).all();
      for (const p of allParts.results || []) {
        const newXp = (p.xp || 0) + amount;
        let ready = 0;
        if (isXpMode && p.level < 20) {
          const nextThresh = XP_THRESHOLDS[p.level + 1];
          if (typeof nextThresh === 'number' && newXp >= nextThresh) ready = 1;
        }
        await env.DB.prepare(
          'UPDATE character_participations SET xp = ?, level_up_available = CASE WHEN ? = 1 THEN 1 ELSE level_up_available END, updated_at = ? WHERE id = ?'
        ).bind(newXp, ready, now, p.id).run();
      }
    }

    await audit('award-xp', campId, { amount, reason, targetPartId });
    return json({ id: awardId, campaignId: campId, participationId: targetPartId, amount, reason, createdBy: actor.id, createdAt: now }, 201);
  }

  // GET /api/c/:id/xp-awards
  if (path.match(/^\/c\/[^/]+\/xp-awards$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 403);
    const rows = await env.DB.prepare('SELECT * FROM xp_awards WHERE campaign_id = ? ORDER BY created_at DESC LIMIT 50').bind(campId).all();
    const list = (rows.results || []).map((r: any) => ({
      id: r.id,
      campaignId: r.campaign_id,
      participationId: r.participation_id,
      amount: r.amount,
      reason: r.reason,
      createdBy: r.created_by,
      createdAt: r.created_at
    }));
    return json(list);
  }

  // POST /api/c/:id/milestone-level-up (DM milestone toggle)
  if (path.match(/^\/c\/[^/]+\/milestone-level-up$/) && method === 'POST') {
    const campId = path.split('/')[2];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);
    const body = await request.json() as any;
    const targetPartId = body.participationId || 'all';
    const ready = body.ready !== false ? 1 : 0;

    let updatedCount = 0;
    if (targetPartId === 'all') {
      const res = await env.DB.prepare(
        'UPDATE character_participations SET level_up_available = ?, updated_at = ? WHERE campaign_id = ? AND status = "active"'
      ).bind(ready, now, campId).run();
      updatedCount = res.meta?.changes || 0;
    } else {
      const res = await env.DB.prepare(
        'UPDATE character_participations SET level_up_available = ?, updated_at = ? WHERE id = ? AND campaign_id = ?'
      ).bind(ready, now, targetPartId, campId).run();
      updatedCount = res.meta?.changes || 0;
    }

    await audit('milestone-level-up', campId, { targetPartId, ready });
    return json({ success: true, updatedCount });
  }

  // POST /api/c/:id/participations/:pid/level-up (Player or DM executes level-up wizard)
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/level-up$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    const rawPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ? AND p.campaign_id = ?`).bind(partId, campId).first();
    if (!rawPart) return error('مشارکت کاراکتر یافت نشد.', 404);

    const myRole = await getMembershipRole(campId, actor.id);
    const charRow = await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(rawPart.character_id).first();
    const isCharOwner = charRow?.owner_id === actor.id;
    const isDm = actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';
    if (!isDm && !isCharOwner) return error('دسترسی مجاز نیست.', 403);

    const campRow = await env.DB.prepare('SELECT name, settings FROM campaigns WHERE id = ?').bind(campId).first();
    const campSettings = parseBlob(campRow?.settings, {});

    // Fetch class template
    let classTemplate: any = null;
    const ctRow = await env.DB.prepare(
      'SELECT * FROM class_templates WHERE (id = ? OR name = ?) AND ((scope_type = "campaign" AND scope_id = ?) OR scope_type = "pack")'
    ).bind(rawPart.class_id || rawPart.class_name, rawPart.class_name, campId).first();
    if (ctRow) {
      classTemplate = { ...parseBlob(ctRow.data, {}), ...ctRow };
    }

    const payload = await request.json() as LevelUpPayload;
    const mappedPart: CharacterParticipation = mapParticipation(rawPart) as any;

    const { validation, diff, nextParticipation } = computeLevelUpDiff({
      participation: mappedPart,
      classTemplate,
      payload
    });

    if (!validation.valid) {
      return error(`خطا در اعتبارسنجی ارتقای سطح: ${validation.errors.join(' | ')}`, 400);
    }

    const requiresApproval = Boolean(campSettings.approval?.onLevelUp) && !isDm;

    if (requiresApproval) {
      const pendingObj = {
        fromLevel: diff.fromLevel,
        toLevel: diff.toLevel,
        diff,
        payload,
        requestedAt: now
      };
      await env.DB.prepare(
        'UPDATE character_participations SET pending_change = ?, updated_at = ? WHERE id = ?'
      ).bind(JSON.stringify(pendingObj), now, partId).run();

      await audit('level-up-request', partId, { campaignId: campId, targetLevel: diff.toLevel });
      const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
      return json(mapParticipation(updated));
    } else {
      // Direct Apply (or DM approved)
      // Snapshot before
      const snapBefore = createSnapshot(mappedPart, `قبل از ارتقا به سطح ${diff.toLevel}`, actor.id);
      await env.DB.prepare(
        `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(snapBefore.id, partId, snapBefore.label, JSON.stringify(snapBefore.state), JSON.stringify(snapBefore.build), snapBefore.level, actor.id, now).run();

      // Apply changes to database
      await env.DB.prepare(
        `UPDATE character_participations SET
           level = ?, max_hp = ?, current_hp = ?, ability_scores = ?, subclass_name = ?,
           hit_dice = ?, features = ?, spell_slots = ?, spells_known_prepared = ?,
           level_up_available = 0, pending_change = NULL, updated_at = ?
         WHERE id = ?`
      ).bind(
        nextParticipation.level,
        nextParticipation.maxHp,
        nextParticipation.currentHp,
        JSON.stringify(nextParticipation.abilityScores),
        nextParticipation.subclassName || null,
        JSON.stringify(nextParticipation.hitDice),
        JSON.stringify(nextParticipation.features),
        nextParticipation.spellSlots ? JSON.stringify(nextParticipation.spellSlots) : null,
        nextParticipation.spellsKnownPrepared ? JSON.stringify(nextParticipation.spellsKnownPrepared) : null,
        now,
        partId
      ).run();

      // Snapshot after
      const snapAfter = createSnapshot(nextParticipation, `ارتقا به سطح ${diff.toLevel}`, actor.id);
      await env.DB.prepare(
        `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(snapAfter.id, partId, snapAfter.label, JSON.stringify(snapAfter.state), JSON.stringify(snapAfter.build), snapAfter.level, actor.id, now + 1).run();

      // Prune snapshots
      const allSnapsRes = await env.DB.prepare(
        'SELECT id FROM participation_snapshots WHERE participation_id = ? ORDER BY created_at DESC'
      ).bind(partId).all();
      const sList = allSnapsRes.results || [];
      if (sList.length > 10) {
        for (const dId of sList.slice(10).map((s: any) => s.id)) {
          await env.DB.prepare('DELETE FROM participation_snapshots WHERE id = ?').bind(dId).run();
        }
      }

      // History event
      await env.DB.prepare(
        'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(
        `hist-lvl-${Date.now()}-${generateRandomToken(3)}`,
        rawPart.character_id,
        campId,
        'level_up',
        JSON.stringify({
          title: `ارتقای سطح به ${diff.toLevel}`,
          description: diff.hpBreakdown,
          oldLevel: diff.fromLevel,
          newLevel: diff.toLevel,
          level: diff.toLevel,
          campaignName: campRow?.name
        }),
        now
      ).run();

      await audit('level-up-complete', partId, { campaignId: campId, newLevel: diff.toLevel });
      const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
      return json(mapParticipation(finalPart));
    }
  }

  // POST /api/c/:id/participations/:pid/approve-level-up (DM approves pending level-up)
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/approve-level-up$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const rawPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ? AND p.campaign_id = ?`).bind(partId, campId).first();
    if (!rawPart) return error('مشارکت کاراکتر یافت نشد.', 404);

    const pendingChange = parseBlob(rawPart.pending_change, null);
    if (!pendingChange) return error('هیچ درخواست ارتقای سطحی در انتظار تأیید نیست.', 400);

    const body = await request.json().catch(() => ({})) as any;
    const comment = body?.comment || '';

    // Fetch class template
    let classTemplate: any = null;
    const ctRow = await env.DB.prepare(
      'SELECT * FROM class_templates WHERE (id = ? OR name = ?) AND ((scope_type = "campaign" AND scope_id = ?) OR scope_type = "pack")'
    ).bind(rawPart.class_id || rawPart.class_name, rawPart.class_name, campId).first();
    if (ctRow) {
      classTemplate = { ...parseBlob(ctRow.data, {}), ...ctRow };
    }

    const mappedPart: CharacterParticipation = mapParticipation(rawPart) as any;
    const { diff, nextParticipation } = computeLevelUpDiff({
      participation: mappedPart,
      classTemplate,
      payload: pendingChange.payload || { hpMode: 'fixed' }
    });

    // Snapshots before & after
    const snapBefore = createSnapshot(mappedPart, `قبل از ارتقا به سطح ${diff.toLevel}`, actor.id);
    await env.DB.prepare(
      `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(snapBefore.id, partId, snapBefore.label, JSON.stringify(snapBefore.state), JSON.stringify(snapBefore.build), snapBefore.level, actor.id, now).run();

    await env.DB.prepare(
      `UPDATE character_participations SET
         level = ?, max_hp = ?, current_hp = ?, ability_scores = ?, subclass_name = ?,
         hit_dice = ?, features = ?, spell_slots = ?, spells_known_prepared = ?,
         level_up_available = 0, pending_change = NULL, updated_at = ?
       WHERE id = ?`
    ).bind(
      nextParticipation.level,
      nextParticipation.maxHp,
      nextParticipation.currentHp,
      JSON.stringify(nextParticipation.abilityScores),
      nextParticipation.subclassName || null,
      JSON.stringify(nextParticipation.hitDice),
      JSON.stringify(nextParticipation.features),
      nextParticipation.spellSlots ? JSON.stringify(nextParticipation.spellSlots) : null,
      nextParticipation.spellsKnownPrepared ? JSON.stringify(nextParticipation.spellsKnownPrepared) : null,
      now,
      partId
    ).run();

    const snapAfter = createSnapshot(nextParticipation, `تأیید ارتقا به سطح ${diff.toLevel}`, actor.id);
    await env.DB.prepare(
      `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(snapAfter.id, partId, snapAfter.label, JSON.stringify(snapAfter.state), JSON.stringify(snapAfter.build), snapAfter.level, actor.id, now + 1).run();

    const campRow = await env.DB.prepare('SELECT name FROM campaigns WHERE id = ?').bind(campId).first();
    await env.DB.prepare(
      'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      `hist-lvl-${Date.now()}-${generateRandomToken(3)}`,
      rawPart.character_id,
      campId,
      'level_up',
      JSON.stringify({
        title: `تأیید ارتقای سطح به ${diff.toLevel} توسط دانجن مستر`,
        description: comment || diff.hpBreakdown,
        oldLevel: diff.fromLevel,
        newLevel: diff.toLevel,
        level: diff.toLevel,
        campaignName: campRow?.name
      }),
      now
    ).run();

    await audit('approve-level-up', partId, { campaignId: campId, targetLevel: diff.toLevel });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }

  // POST /api/c/:id/participations/:pid/reject-level-up (DM rejects pending level-up)
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/reject-level-up$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);
    const body = await request.json().catch(() => ({})) as any;
    await env.DB.prepare('UPDATE character_participations SET pending_change = NULL, updated_at = ? WHERE id = ?').bind(now, partId).run();
    await audit('reject-level-up', partId, { campaignId: campId, comment: body?.comment });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }

  // POST /api/c/:id/participations/:pid/undo-level-up (DM rolls back level-up)
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/undo-level-up$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const rawPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ? AND p.campaign_id = ?`).bind(partId, campId).first();
    if (!rawPart) return error('مشارکت کاراکتر یافت نشد.', 404);
    if (rawPart.level <= 1) return error('سطح کاراکتر ۱ است و امکان لغو ارتقا وجود ندارد.', 400);

    const targetLevel = rawPart.level - 1;
    // Look for snapshot matching targetLevel
    const snap = await env.DB.prepare(
      'SELECT * FROM participation_snapshots WHERE participation_id = ? AND level = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(partId, targetLevel).first();

    if (snap) {
      const state = parseBlob(snap.state, {});
      await env.DB.prepare(
        `UPDATE character_participations SET
           level = ?, max_hp = ?, current_hp = ?, ability_scores = ?,
           hit_dice = ?, features = ?, updated_at = ?
         WHERE id = ?`
      ).bind(
        targetLevel,
        state.maxHp || Math.max(1, rawPart.max_hp - 6),
        Math.min(state.maxHp || rawPart.max_hp - 6, rawPart.current_hp),
        state.abilityScores ? JSON.stringify(state.abilityScores) : rawPart.ability_scores,
        state.hitDice ? JSON.stringify(state.hitDice) : rawPart.hit_dice,
        state.features ? JSON.stringify(state.features) : rawPart.features,
        now,
        partId
      ).run();
    } else {
      await env.DB.prepare(
        `UPDATE character_participations SET
           level = ?, max_hp = MAX(1, max_hp - 6), current_hp = MIN(current_hp, MAX(1, max_hp - 6)),
           hit_dice = json_set(hit_dice, '$.max', ?, '$.current', MIN(?, json_extract(hit_dice, '$.current'))),
           updated_at = ?
         WHERE id = ?`
      ).bind(targetLevel, targetLevel, targetLevel, now, partId).run();
    }

    await env.DB.prepare(
      'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      `hist-undo-${Date.now()}-${generateRandomToken(3)}`,
      rawPart.character_id,
      campId,
      'custom',
      JSON.stringify({
        title: 'لغو ارتقای سطح اخیر',
        description: `بازگشت به سطح ${targetLevel} توسط دانجن مستر`,
        level: targetLevel
      }),
      now
    ).run();

    await audit('undo-level-up', partId, { campaignId: campId, targetLevel });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }

  // POST /api/c/:id/participations/:pid/dm-override (DM override mode)
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/dm-override$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const rawPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ? AND p.campaign_id = ?`).bind(partId, campId).first();
    if (!rawPart) return error('مشارکت کاراکتر یافت نشد.', 404);

    const body = await request.json() as any;
    const overrideData = body.data || {};
    const reason = String(body.reason || 'ویرایش مستقیم توسط دانجن مستر').trim();

    const colMap: Record<string, string> = {
      level: 'level', xp: 'xp', className: 'class_name', subclassName: 'subclass_name',
      classId: 'class_id', currentHp: 'current_hp', maxHp: 'max_hp', tempHp: 'temp_hp',
      abilityScores: 'ability_scores', hitDice: 'hit_dice', sheetLocked: 'sheet_locked',
      speedOverride: 'speed_override', acOverride: 'ac_override', notes: 'notes', dmNotes: 'dm_notes'
    };
    const sets: string[] = [];
    const binds: any[] = [];
    for (const [key, col] of Object.entries(colMap)) {
      if (overrideData[key] === undefined) continue;
      const val = key === 'sheetLocked' ? (overrideData[key] ? 1 : 0) : overrideData[key];
      sets.push(`${col} = ?`);
      binds.push(val !== null && typeof val === 'object' ? JSON.stringify(val) : val);
    }

    if (sets.length > 0) {
      sets.push('updated_at = ?');
      binds.push(now, partId);
      await env.DB.prepare(`UPDATE character_participations SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
    }

    // Record "ویرایش DM" in history
    await env.DB.prepare(
      'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      `hist-dmedit-${Date.now()}-${generateRandomToken(3)}`,
      rawPart.character_id,
      campId,
      'custom',
      JSON.stringify({
        title: 'ویرایش DM',
        description: reason,
        modifiedFields: Object.keys(overrideData)
      }),
      now
    ).run();

    await audit('dm-override', partId, { campaignId: campId, reason, fields: Object.keys(overrideData) });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }

  // POST /api/c/:id/participations/:pid/respec-window (DM respec toggle)
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/respec-window$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);
    const body = await request.json() as any;
    const open = Boolean(body.open);

    await env.DB.prepare('UPDATE character_participations SET sheet_locked = ?, updated_at = ? WHERE id = ?')
      .bind(open ? 0 : 1, now, partId).run();

    await audit('respec-window', partId, { campaignId: campId, open });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart));
  }

  // POST /api/c/:id/participations/:pid/sheet-change-request (Player requests change)
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/sheet-change-request$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    const rawPart = await env.DB.prepare('SELECT id, character_id FROM character_participations WHERE id = ? AND campaign_id = ?').bind(partId, campId).first();
    if (!rawPart) return error('مشارکت کاراکتر یافت نشد.', 404);

    const body = await request.json() as any;
    const requestedChanges = String(body.requestedChanges || '').trim();
    if (!requestedChanges) return error('شرح تغییرات درخواستی الزامی است.');
    const reason = String(body.reason || '').trim();

    const reqId = `scr-${Date.now()}-${generateRandomToken(3)}`;
    await env.DB.prepare(
      `INSERT INTO sheet_change_requests (id, campaign_id, participation_id, user_id, requested_changes, reason, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(reqId, campId, partId, actor.id, requestedChanges, reason, now, now).run();

    await audit('sheet-change-request', partId, { campaignId: campId, reqId });
    return json({ id: reqId, campaignId: campId, participationId: partId, userId: actor.id, requestedChanges, reason, status: 'pending', createdAt: now, updatedAt: now }, 201);
  }

  // GET /api/c/:id/sheet-change-requests (DM lists sheet change requests)
  if (path.match(/^\/c\/[^/]+\/sheet-change-requests$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 403);
    const rows = await env.DB.prepare(
      `SELECT scr.*, u.display_name AS player_name, ch.name AS character_name
         FROM sheet_change_requests scr
         JOIN users u ON u.id = scr.user_id
         JOIN character_participations p ON p.id = scr.participation_id
         LEFT JOIN characters ch ON ch.id = p.character_id
        WHERE scr.campaign_id = ?
        ORDER BY scr.created_at DESC`
    ).bind(campId).all();

    const list = (rows.results || []).map((r: any) => ({
      id: r.id,
      campaignId: r.campaign_id,
      participationId: r.participation_id,
      userId: r.user_id,
      requestedChanges: r.requested_changes,
      reason: r.reason,
      status: r.status,
      reviewComment: r.review_comment,
      characterName: r.character_name,
      playerName: r.player_name,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
    return json(list);
  }

  // POST /api/c/:id/sheet-change-requests/:rid/review (DM review sheet change)
  if (path.match(/^\/c\/[^/]+\/sheet-change-requests\/[^/]+\/review$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const reqId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const reqRow = await env.DB.prepare('SELECT * FROM sheet_change_requests WHERE id = ? AND campaign_id = ?').bind(reqId, campId).first();
    if (!reqRow) return error('درخواست یافت نشد.', 404);

    const body = await request.json() as any;
    const action = body.action === 'approve' ? 'approved' : 'rejected';
    const comment = String(body.comment || '').trim();

    await env.DB.prepare('UPDATE sheet_change_requests SET status = ?, review_comment = ?, updated_at = ? WHERE id = ?')
      .bind(action, comment, now, reqId).run();

    if (action === 'approved') {
      // Temporarily unlock sheet so user can apply the agreed changes
      await env.DB.prepare('UPDATE character_participations SET sheet_locked = 0, updated_at = ? WHERE id = ?')
        .bind(now, reqRow.participation_id).run();
    }

    await audit('sheet-change-review', reqId, { action, comment });
    const updated = await env.DB.prepare('SELECT * FROM sheet_change_requests WHERE id = ?').bind(reqId).first();
    return json(updated);
  }

  // POST /api/c/:id/participations/:pid/status — set participation status
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/status$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const partId = parts[4];
    const part = await env.DB.prepare('SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?').bind(partId, campId).first();
    if (!part) return error('مشارکت شخصیت یافت نشد.', 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== 'dm' && myRole !== 'owner' && myRole !== 'co_dm') return error('دسترسی مجاز نیست.', 403);
    const body = await request.json() as any;
    if (!['pending_approval', 'active', 'rejected', 'retired', 'dead'].includes(body.status)) {
      return error('وضعیت نامعتبر است.');
    }
    await env.DB.prepare('UPDATE character_participations SET status = ?, updated_at = ? WHERE id = ? AND campaign_id = ?')
      .bind(body.status, now, partId, campId).run();
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }

  // ---------------------------------------------------------
  // Step 3.3: Character Creation Wizard & Snapshots
  // ---------------------------------------------------------

  // POST /api/c/wizard/roll-abilities
  if (path === '/c/wizard/roll-abilities' && method === 'POST') {
    const random = () => {
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return arr[0] / (0xffffffff + 1);
    };
    const { rolls, scores } = rollAbilityScores(random);
    return json({ rolls, scores });
  }

  // GET /api/c/wizard/drafts or GET /api/c/:id/participations/drafts
  if ((path === '/c/wizard/drafts' || path.match(/^\/c\/[^/]+\/participations\/drafts$/)) && method === 'GET') {
    const cid = path.startsWith('/c/wizard') ? null : path.split('/')[2];
    let query = `${PART_SELECT} WHERE p.status = 'draft'`;
    const params: any[] = [];
    if (cid && cid !== 'all') {
      query += ' AND p.campaign_id = ?';
      params.push(cid);
    }
    query += ' AND ch.owner_id = ? ORDER BY p.updated_at DESC';
    params.push(actor.id);
    const res = await env.DB.prepare(query).bind(...params).all();
    return json((res.results || []).map(mapParticipation));
  }

  // POST /api/c/:id/participations/draft (Autosave Draft)
  if (path.match(/^\/c\/[^/]+\/participations\/draft$/) && method === 'POST') {
    const campId = path.split('/')[2];
    const body = await request.json() as any;
    const camp = await env.DB.prepare('SELECT id, name FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!camp) return error('کمپین یافت نشد.', 404);

    let charId = body.characterId;
    let masterCharRow = null;
    if (charId) {
      masterCharRow = await env.DB.prepare('SELECT id, data FROM characters WHERE id = ?').bind(charId).first();
    }

    if (!charId || !masterCharRow) {
      charId = `char-${Date.now()}-${generateRandomToken(3)}`;
      const masterBlob = {
        id: charId,
        ownerId: actor.id,
        name: body.masterData?.name || body.name || 'پیش‌نویس کاراکتر',
        race: body.masterData?.race || body.race || 'آدمی',
        appearance: body.masterData?.appearance || '',
        portraitUrl: body.masterData?.portraitUrl || '',
        backstory: body.masterData?.backstory || { summary: '' },
        status: 'active'
      };
      await env.DB.prepare(
        'INSERT INTO characters (id, owner_id, name, class_name, level, data, revision, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
      ).bind(charId, actor.id, masterBlob.name, body.className || 'ماجراجو', body.level || 1, JSON.stringify(masterBlob), now).run();
    } else if (body.masterData) {
      const existingBlob = parseBlob(masterCharRow.data, {});
      const updatedBlob = { ...existingBlob, ...body.masterData, updatedAt: now };
      await env.DB.prepare('UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ?')
        .bind(updatedBlob.name || masterCharRow.name, JSON.stringify(updatedBlob), now, charId).run();
    }

    let partId = body.id || body.participationId;
    let existingPart = null;
    if (partId) {
      existingPart = await env.DB.prepare('SELECT id FROM character_participations WHERE id = ?').bind(partId).first();
    } else {
      existingPart = await env.DB.prepare('SELECT id FROM character_participations WHERE campaign_id = ? AND character_id = ? AND status = "draft"').bind(campId, charId).first();
      if (existingPart) partId = existingPart.id;
    }

    const buildJson = JSON.stringify(body.build || {});
    const level = body.level || 1;
    const abilityScores = JSON.stringify(body.build?.pointBuy?.scores || body.build?.rolls?.assigned || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    const hp = 10;
    const hitDice = JSON.stringify({ current: level, max: level, die: 'd8' });
    const deathSaves = JSON.stringify({ successes: 0, failures: 0 });
    const currency = JSON.stringify({ gold: 15, silver: 0, copper: 0 });

    if (existingPart) {
      await env.DB.prepare(
        `UPDATE character_participations SET
           class_name = ?, level = ?, ability_scores = ?, build = ?, sheet_locked = 1, updated_at = ?
         WHERE id = ?`
      ).bind(body.className || 'ماجراجو', level, abilityScores, buildJson, now, partId).run();
    } else {
      partId = `part-draft-${Date.now()}-${generateRandomToken(3)}`;
      await env.DB.prepare(
        `INSERT INTO character_participations
           (id, character_id, campaign_id, status, class_name, level, xp, ability_scores,
            current_hp, max_hp, temp_hp, hit_dice, death_saves, conditions, inventory, weapons,
            currency, custom_resources, features, notes, dm_notes, build, sheet_locked, joined_at, updated_at)
         VALUES (?, ?, ?, 'draft', ?, ?, 0, ?, ?, ?, 0, ?, ?, '[]', '[]', '[]', ?, '[]', '[]', '', '', ?, 1, ?, ?)`
      ).bind(partId, charId, campId, body.className || 'ماجراجو', level, abilityScores, hp, hp, hitDice, deathSaves, currency, buildJson, now, now).run();
    }

    const saved = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(saved));
  }

  // POST /api/c/:id/participations/wizard-submit (Authoritative Validation & Submission)
  if (path.match(/^\/c\/[^/]+\/participations\/wizard-submit$/) && method === 'POST') {
    const campId = path.split('/')[2];
    const body = await request.json() as any;
    const camp = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL').bind(campId).first();
    if (!camp) return error('کمپین یافت نشد.', 404);

    const campSettings = parseBlob(camp.settings, {});

    // Fetch class template
    let classTemplate: any = null;
    const classIdOrName = body.classId || body.className || body.build?.className;
    if (classIdOrName) {
      const ctRow = await env.DB.prepare(
        'SELECT * FROM class_templates WHERE (id = ? OR name = ?) AND ((scope_type = "campaign" AND scope_id = ?) OR scope_type = "pack")'
      ).bind(classIdOrName, classIdOrName, campId).first();
      if (ctRow) {
        classTemplate = { ...parseBlob(ctRow.data, {}), ...ctRow };
      }
    }

    // Fetch lineage template
    let lineageTemplate: any = null;
    if (body.build?.lineageId) {
      const linRow = await env.DB.prepare('SELECT * FROM lineage_templates WHERE id = ?').bind(body.build.lineageId).first();
      if (linRow) {
        lineageTemplate = {
          ...linRow,
          abilityBonuses: parseBlob(linRow.ability_bonuses, {}),
          proficiencies: parseBlob(linRow.proficiencies, {}),
          traits: parseBlob(linRow.traits, [])
        };
      }
    }

    // Fetch background template
    let backgroundTemplate: any = null;
    if (body.build?.backgroundId) {
      const bgRow = await env.DB.prepare('SELECT * FROM background_templates WHERE id = ?').bind(body.build.backgroundId).first();
      if (bgRow) {
        backgroundTemplate = {
          ...bgRow,
          skillProficiencies: parseBlob(bgRow.skill_proficiencies, []),
          startingEquipment: parseBlob(bgRow.starting_equipment, [])
        };
      }
    }

    // Authoritative Server Recomputation
    const { participation: computed, validation } = computeAuthoritativeParticipation({
      masterData: body.masterData || {},
      build: body.build,
      campaignId: campId,
      campaignSettings: campSettings,
      classTemplate,
      lineageTemplate,
      backgroundTemplate,
      entryLevel: body.entryLevel || campSettings.startingLevel || 1
    });

    if (!validation.valid && validation.errors.length > 0) {
      return error(`خطا در اعتبارسنجی قوانین کاراکتر: ${validation.errors.join(' | ')}`, 400);
    }

    // Save or update Master Character
    let charId = body.characterId;
    const masterBlob = {
      id: charId || `char-${Date.now()}-${generateRandomToken(3)}`,
      ownerId: actor.id,
      name: body.masterData?.name || computed.characterName || 'شخصیت',
      race: body.masterData?.race || computed.characterRace || 'آدمی',
      appearance: body.masterData?.appearance || '',
      portraitUrl: body.masterData?.portraitUrl || '',
      backstory: body.masterData?.backstory || { summary: '' },
      status: 'active'
    };

    if (charId) {
      await env.DB.prepare('UPDATE characters SET name = ?, data = ?, updated_at = ? WHERE id = ?')
        .bind(masterBlob.name, JSON.stringify(masterBlob), now, charId).run();
    } else {
      charId = masterBlob.id;
      await env.DB.prepare(
        'INSERT INTO characters (id, owner_id, name, class_name, level, data, revision, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
      ).bind(charId, actor.id, masterBlob.name, computed.className, computed.level, JSON.stringify(masterBlob), now).run();
    }

    // Save or update participation
    let partId = body.participationId;
    const existing = partId
      ? await env.DB.prepare('SELECT id FROM character_participations WHERE id = ?').bind(partId).first()
      : null;

    if (existing) {
      await env.DB.prepare(
        `UPDATE character_participations SET
           character_id = ?, status = ?, class_id = ?, class_name = ?, subclass_name = ?, level = ?, xp = ?,
           ability_scores = ?, current_hp = ?, max_hp = ?, temp_hp = 0, hit_dice = ?, ac_override = ?,
           speed_override = ?, death_saves = ?, conditions = ?, inventory = ?, weapons = ?, currency = ?,
           custom_resources = ?, spells_known_prepared = ?, spell_slots = ?, features = ?, notes = ?, dm_notes = ?,
           build = ?, sheet_locked = ?, updated_at = ?
         WHERE id = ?`
      ).bind(
        charId, computed.status, computed.classId, computed.className, computed.subclassName || null, computed.level, computed.xp,
        JSON.stringify(computed.abilityScores), computed.currentHp, computed.maxHp, JSON.stringify(computed.hitDice),
        computed.acOverride, computed.speedOverride, JSON.stringify(computed.deathSaves), JSON.stringify(computed.conditions),
        JSON.stringify(computed.inventory), JSON.stringify(computed.weapons), JSON.stringify(computed.currency),
        JSON.stringify(computed.customResources), computed.spellsKnownPrepared ? JSON.stringify(computed.spellsKnownPrepared) : null,
        computed.spellSlots ? JSON.stringify(computed.spellSlots) : null, JSON.stringify(computed.features),
        computed.notes, computed.dmNotes, JSON.stringify(computed.build), computed.sheetLocked ? 1 : 0, now, partId
      ).run();
    } else {
      partId = `part-${Date.now()}-${generateRandomToken(3)}`;
      await env.DB.prepare(
        `INSERT INTO character_participations
           (id, character_id, campaign_id, status, class_id, class_name, subclass_name, level, xp,
            ability_scores, current_hp, max_hp, temp_hp, hit_dice, ac_override, speed_override,
            death_saves, conditions, inventory, weapons, currency, custom_resources, spells_known_prepared,
            spell_slots, features, notes, dm_notes, build, sheet_locked, joined_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        partId, charId, campId, computed.status, computed.classId, computed.className, computed.subclassName || null,
        computed.level, computed.xp, JSON.stringify(computed.abilityScores), computed.currentHp, computed.maxHp,
        JSON.stringify(computed.hitDice), computed.acOverride, computed.speedOverride, JSON.stringify(computed.deathSaves),
        JSON.stringify(computed.conditions), JSON.stringify(computed.inventory), JSON.stringify(computed.weapons),
        JSON.stringify(computed.currency), JSON.stringify(computed.customResources),
        computed.spellsKnownPrepared ? JSON.stringify(computed.spellsKnownPrepared) : null,
        computed.spellSlots ? JSON.stringify(computed.spellSlots) : null, JSON.stringify(computed.features),
        computed.notes, computed.dmNotes, JSON.stringify(computed.build), computed.sheetLocked ? 1 : 0, now, now
      ).run();
    }

    // Ensure member record
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'player', 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO NOTHING`
    ).bind(campId, actor.id, now).run();

    // Create history event 'joined'
    await env.DB.prepare(
      'INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      `hist-${Date.now()}-${generateRandomToken(3)}`, charId, campId, 'joined',
      JSON.stringify({
        title: `پیوستن به کمپین ${camp.name}`,
        description: `آفرینش کامل شخصیت در سطح ${computed.level} با ویزارد`,
        level: computed.level
      }),
      now
    ).run();

    // Create initial snapshot
    const fullPart: CharacterParticipation = {
      id: partId,
      characterId: charId,
      ...computed
    };
    const snap = createSnapshot(fullPart, `آفرینش شخصیت (سطح ${computed.level})`, actor.id);

    await env.DB.prepare(
      `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      snap.id, partId, snap.label, JSON.stringify(snap.state), JSON.stringify(snap.build), snap.level, actor.id, now
    ).run();

    // Prune snapshots: keep only newest 10!
    const allSnapsRes = await env.DB.prepare(
      'SELECT id, created_at FROM participation_snapshots WHERE participation_id = ? ORDER BY created_at DESC'
    ).bind(partId).all();
    const snapsList = allSnapsRes.results || [];
    if (snapsList.length > 10) {
      const toDelete = snapsList.slice(10).map((s: any) => s.id);
      for (const dId of toDelete) {
        await env.DB.prepare('DELETE FROM participation_snapshots WHERE id = ?').bind(dId).run();
      }
    }

    await audit('participation-wizard-submit', partId, { campaignId: campId, characterId: charId, status: computed.status });
    const finalPart = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(finalPart), 201);
  }

  // Snapshots: GET /api/c/:id/participations/:pid/snapshots
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/snapshots$/) && method === 'GET') {
    const parts = path.split('/');
    const partId = parts[4];
    const rows = await env.DB.prepare(
      'SELECT * FROM participation_snapshots WHERE participation_id = ? ORDER BY created_at DESC LIMIT 10'
    ).bind(partId).all();
    const list = (rows.results || []).map((r: any) => ({
      id: r.id,
      participationId: r.participation_id,
      label: r.label,
      state: parseBlob(r.state, {}),
      build: parseBlob(r.build, {}),
      level: r.level,
      createdBy: r.created_by,
      createdAt: r.created_at
    }));
    return json(list);
  }

  // Snapshots: POST /api/c/:id/participations/:pid/snapshots
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/snapshots$/) && method === 'POST') {
    const parts = path.split('/');
    const partId = parts[4];
    const body = await request.json() as any;
    const label = String(body.label || 'عکس لحظه‌ای').trim();

    const part = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    if (!part) return error('مشارکت یافت نشد.', 404);

    const fullPart: CharacterParticipation = mapParticipation(part) as any;
    const snap = createSnapshot(fullPart, label, actor.id);

    await env.DB.prepare(
      `INSERT INTO participation_snapshots (id, participation_id, label, state, build, level, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(snap.id, partId, snap.label, JSON.stringify(snap.state), JSON.stringify(snap.build), snap.level, actor.id, now).run();

    // Retention prune to 10
    const allSnaps = await env.DB.prepare(
      'SELECT id, created_at FROM participation_snapshots WHERE participation_id = ? ORDER BY created_at DESC'
    ).bind(partId).all();
    const snapsList = allSnaps.results || [];
    if (snapsList.length > 10) {
      const toDelete = snapsList.slice(10).map((s: any) => s.id);
      for (const dId of toDelete) {
        await env.DB.prepare('DELETE FROM participation_snapshots WHERE id = ?').bind(dId).run();
      }
    }

    return json(snap, 201);
  }

  // Snapshots: POST /api/c/:id/participations/:pid/snapshots/:sid/restore
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/snapshots\/[^/]+\/restore$/) && method === 'POST') {
    const parts = path.split('/');
    const partId = parts[4];
    const snapId = parts[6];

    const snap = await env.DB.prepare('SELECT * FROM participation_snapshots WHERE id = ? AND participation_id = ?').bind(snapId, partId).first();
    if (!snap) return error('عکس لحظه‌ای یافت نشد.', 404);

    const state = parseBlob(snap.state, {});
    const build = parseBlob(snap.build, {});

    await env.DB.prepare(
      `UPDATE character_participations SET
         level = ?, ability_scores = ?, current_hp = ?, max_hp = ?, temp_hp = ?,
         hit_dice = ?, inventory = ?, weapons = ?, currency = ?, custom_resources = ?,
         spells_known_prepared = ?, spell_slots = ?, features = ?, build = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      snap.level, JSON.stringify(state.abilityScores || {}), state.currentHp || 10, state.maxHp || 10, state.tempHp || 0,
      JSON.stringify(state.hitDice || {}), JSON.stringify(state.inventory || []), JSON.stringify(state.weapons || []),
      JSON.stringify(state.currency || {}), JSON.stringify(state.customResources || []),
      state.spellsKnownPrepared ? JSON.stringify(state.spellsKnownPrepared) : null,
      state.spellSlots ? JSON.stringify(state.spellSlots) : null,
      JSON.stringify(state.features || []), JSON.stringify(build), now, partId
    ).run();

    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }

  // ---------------------------------------------------------
  // Items CRUD (DM) — create handler above also gets scope_id fix
  // ---------------------------------------------------------
  if (path.match(/^\/items\/[^/]+$/) && method === 'PUT') {
    if (actor.role !== 'dm') return error('فقط دانجن مستر می‌تواند ویرایش کند.', 403);
    const itemId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT id FROM items WHERE id = ?').bind(itemId).first();
    if (!row) return error('شیء مورد نظر یافت نشد.', 404);
    const data = await request.json() as any;
    const updated = { ...data, id: itemId, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'UPDATE items SET name = ?, category = ?, is_revealed = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(updated.name || 'شیء', updated.category || 'general', updated.isRevealed ? 1 : 0, JSON.stringify(updated), now, itemId).run();
    return json(updated);
  }

  if (path.match(/^\/items\/[^/]+$/) && method === 'DELETE') {
    if (actor.role !== 'dm') return error('فقط دانجن مستر می‌تواند حذف کند.', 403);
    const itemId = path.split('/')[2];
    const res = await env.DB.prepare('DELETE FROM items WHERE id = ?').bind(itemId).run();
    if ((res?.meta?.changes ?? 0) === 0) return error('شیء مورد نظر یافت نشد.', 404);
    await audit('item-delete', itemId, {});
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Rewards CRUD + distribution (DM)
  // ---------------------------------------------------------
  if (path === '/rewards' && method === 'POST') {
    if (actor.role !== 'dm') return error('فقط دانجن مستر می‌تواند پاداش بسازد.', 403);
    const body = await request.json() as any;
    const rewardId = `rew-${Date.now()}-${generateRandomToken(3)}`;
    const newRew = {
      ...body,
      id: rewardId,
      createdAt: new Date().toISOString()
    };
    await env.DB.prepare(
      'INSERT INTO rewards (id, scope_type, scope_id, created_by, title, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(rewardId, 'campaign', 'zorvania-c1', actor.id, newRew.title || 'پاداش', JSON.stringify(newRew), now).run();
    return json(newRew, 201);
  }

  if (path.match(/^\/rewards\/[^/]+\/distribute$/) && method === 'POST') {
    if (actor.role !== 'dm') return error('فقط دانجن مستر می‌تواند پاداش توزیع کند.', 403);
    const rewardId = path.split('/')[2];
    const body = await request.json() as any;
    const charIds: string[] = Array.isArray(body.characterIds) ? body.characterIds : [];
    const rewRow = await env.DB.prepare('SELECT data FROM rewards WHERE id = ?').bind(rewardId).first();
    if (!rewRow) return error('پاداش مورد نظر یافت نشد.', 404);
    const rew = parseBlob(rewRow.data, {}) || {};
    const rows = await loadCharacterBlobs();
    const updated: any[] = [];
    for (const row of rows) {
      const char = parseBlob(row.data, null);
      if (!char) continue;
      if (!charIds.includes(row.id)) {
        updated.push(char);
        continue;
      }
      const currencies = { gold: 0, silver: 0, copper: 0, ...(char.currencies || {}) };
      currencies.gold = Number(currencies.gold || 0) + Number(rew.gold || 0);
      currencies.silver = Number(currencies.silver || 0) + Number(rew.silver || 0);
      const newItems = (rew.items || []).map((it: any) => ({
        ...it,
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      }));
      char.currencies = currencies;
      char.inventory = [...newItems, ...(char.inventory || [])];
      const saved = await saveCharacterBlob(row.id, char, Number(row.revision || 0) + 1);
      updated.push(saved);
    }
    return json(updated);
  }

  // ---------------------------------------------------------
  // Campaign notes CRUD (DM)
  // ---------------------------------------------------------
  if (path === '/campaign-notes' && method === 'POST') {
    if (actor.role !== 'dm') return error('فقط دانجن مستر می‌تواند یادداشت بنویسد.', 403);
    const body = await request.json() as any;
    const noteId = `cn-${Date.now()}-${generateRandomToken(3)}`;
    const newNote = { ...body, id: noteId, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'INSERT INTO campaign_notes (id, scope_type, scope_id, title, category, session_number, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(noteId, 'campaign', 'zorvania-c1', newNote.title || 'یادداشت', newNote.category || 'session', newNote.sessionNumber || null, JSON.stringify(newNote), now).run();
    return json(newNote, 201);
  }

  if (path.match(/^\/campaign-notes\/[^/]+$/) && method === 'PUT') {
    if (actor.role !== 'dm') return error('فقط دانجن مستر می‌تواند ویرایش کند.', 403);
    const noteId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT id FROM campaign_notes WHERE id = ?').bind(noteId).first();
    if (!row) return error('یادداشت مورد نظر یافت نشد.', 404);
    const body = await request.json() as any;
    const updated = { ...body, id: noteId, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'UPDATE campaign_notes SET title = ?, category = ?, session_number = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(updated.title || 'یادداشت', updated.category || 'session', updated.sessionNumber || null, JSON.stringify(updated), now, noteId).run();
    return json(updated);
  }

  if (path.match(/^\/campaign-notes\/[^/]+$/) && method === 'DELETE') {
    if (actor.role !== 'dm') return error('فقط دانجن مستر می‌تواند حذف کند.', 403);
    const noteId = path.split('/')[2];
    const res = await env.DB.prepare('DELETE FROM campaign_notes WHERE id = ?').bind(noteId).run();
    if ((res?.meta?.changes ?? 0) === 0) return error('یادداشت مورد نظر یافت نشد.', 404);
    await audit('campaign-note-delete', noteId, {});
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Account (Self) Routes
  // ---------------------------------------------------------

  // PATCH /api/me (update displayName)
  if (path === '/me' && method === 'PATCH') {
    const body = await request.json() as any;
    const displayName = String(body.displayName || '').trim();
    if (!displayName || displayName.length < 2 || displayName.length > 40) {
      return error('نام نمایشی باید بین ۲ تا ۴۰ نویسه باشد.');
    }
    await env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?').bind(displayName, currentUser.id).run();
    await audit('update-profile', currentUser.id, { displayName });
    return json({
      id: currentUser.id,
      email: currentUser.email,
      name: displayName,
      displayName,
      role: currentUser.role,
      status: currentUser.status,
      activeCharacterId: currentUser.active_character_id
    });
  }

  // POST /api/me/password
  if (path === '/me/password' && method === 'POST') {
    const body = await request.json() as any;
    const currentPass = String(body.currentPassword || '');
    const newPass = String(body.newPassword || '');

    const { valid } = await verifyPassword(currentPass, currentUser.password_hash);
    if (!valid) {
      return error('رمز عبور فعلی نادرست است.', 400);
    }

    const passErr = validatePassword(newPass, currentUser.email, currentUser.display_name);
    if (passErr) return error(passErr);

    const newHash = await hashPassword(newPass);
    await env.DB.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').bind(newHash, currentUser.id).run();

    // Revoke all OTHER sessions
    if (currentSession) {
      await env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ? AND id != ?').bind(now, currentUser.id, currentSession.id).run();
    }

    await audit('password-change', currentUser.id);
    return json({ success: true, message: 'رمز عبور با موفقیت تغییر یافت.' });
  }

  // POST /api/me/email
  if (path === '/me/email' && method === 'POST') {
    const body = await request.json() as any;
    const currentPass = String(body.currentPassword || '');
    const newEmail = String(body.newEmail || '').toLowerCase().trim();

    if (!newEmail || !newEmail.includes('@')) {
      return error('ایمیل نامعتبر است.');
    }

    const { valid } = await verifyPassword(currentPass, currentUser.password_hash);
    if (!valid) {
      return error('رمز عبور فعلی نادرست است.', 400);
    }

    const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ? AND id != ?').bind(newEmail, currentUser.id).first();
    if (exists) {
      return error('این ایمیل توسط کاربر دیگری ثبت شده است.', 409);
    }

    await env.DB.prepare('UPDATE users SET email = ? WHERE id = ?').bind(newEmail, currentUser.id).run();
    await audit('email-change', currentUser.id, { newEmail });

    return json({
      id: currentUser.id,
      email: newEmail,
      name: currentUser.display_name,
      displayName: currentUser.display_name,
      role: currentUser.role
    });
  }

  // GET /api/me/sessions
  if (path === '/me/sessions' && method === 'GET') {
    const res = await env.DB.prepare(
      'SELECT id, user_id, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash FROM auth_sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC'
    ).bind(currentUser.id, now).all();

    const sessions = (res.results || []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      createdAt: s.created_at,
      lastSeenAt: s.last_seen_at,
      expiresAt: s.expires_at,
      absoluteExpiresAt: s.absolute_expires_at,
      userAgent: s.user_agent,
      isCurrent: s.id === currentSession?.id
    }));
    return json(sessions);
  }

  // DELETE /api/me/sessions/:id
  if (path.match(/^\/me\/sessions\/[^/]+$/) && method === 'DELETE') {
    const targetSessionId = path.split('/')[3];
    await env.DB.prepare(
      'UPDATE auth_sessions SET revoked_at = ? WHERE id = ? AND user_id = ?'
    ).bind(now, targetSessionId, currentUser.id).run();

    if (targetSessionId === currentSession?.id) {
      return json({ message: 'نشست فعلی لغو شد.' }, 200, { 'Set-Cookie': clearSessionCookie() });
    }
    return json({ success: true });
  }

  // PUT /api/me/active-character
  if (path === '/me/active-character' && method === 'PUT') {
    const body = await request.json() as any;
    const charId = body.characterId;
    if (charId) {
      const char = await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(charId).first();
      if (!char) return error('کاراکتر یافت نشد.', 404);
      if (currentUser.role !== 'dm' && char.owner_id !== currentUser.id) {
        return error('شما مالک این کاراکتر نیستید.', 404);
      }
    }
    await env.DB.prepare('UPDATE users SET active_character_id = ? WHERE id = ?').bind(charId || null, currentUser.id).run();
    return json({ success: true, activeCharacterId: charId });
  }

  // GET /api/me/export
  if (path === '/me/export' && method === 'GET') {
    const charRows = await env.DB.prepare('SELECT data FROM characters WHERE owner_id = ?').bind(currentUser.id).all();
    const noteRows = await env.DB.prepare('SELECT data FROM notes WHERE owner_id = ?').bind(currentUser.id).all();

    const exportData = {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.display_name,
        role: currentUser.role
      },
      characters: (charRows.results || []).map((r: any) => JSON.parse(r.data)),
      notes: (noteRows.results || []).map((r: any) => JSON.parse(r.data)),
      exportedAt: new Date().toISOString()
    };
    return json(exportData);
  }

  // ---------------------------------------------------------
  // DM User Management & Invites (DM Only)
  // ---------------------------------------------------------
  if (path.startsWith('/users') || path.startsWith('/invites') || path.startsWith('/audit')) {
    if (currentUser.role !== 'dm') {
      return error('دسترسی مجاز نیست؛ نیازمند نقش دانجن مستر.', 403);
    }
  }

  // GET /api/users
  if (path === '/users' && method === 'GET') {
    const search = url.searchParams.get('search') || '';
    const roleFilter = url.searchParams.get('role');
    const statusFilter = url.searchParams.get('status');

    let query = 'SELECT * FROM users WHERE deleted_at IS NULL';
    const params: any[] = [];

    if (roleFilter && (roleFilter === 'dm' || roleFilter === 'player')) {
      query += ' AND role = ?';
      params.push(roleFilter);
    }
    if (statusFilter && (statusFilter === 'active' || statusFilter === 'disabled')) {
      query += ' AND status = ?';
      params.push(statusFilter);
    }
    query += ' ORDER BY created_at DESC';

    const usersRes = await env.DB.prepare(query).bind(...params).all();
    let usersList = (usersRes.results || []) as UserRow[];

    if (search) {
      const s = search.toLowerCase();
      usersList = usersList.filter(u => u.display_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }

    // Enhance users with character names and active session counts
    const charRes = await env.DB.prepare('SELECT id, owner_id, name FROM characters').all();
    const charsByOwner: Record<string, string[]> = {};
    for (const c of (charRes.results || [])) {
      if (c.owner_id) {
        if (!charsByOwner[c.owner_id]) charsByOwner[c.owner_id] = [];
        charsByOwner[c.owner_id].push(c.name);
      }
    }

    const sessRes = await env.DB.prepare(
      'SELECT user_id, COUNT(*) as c FROM auth_sessions WHERE revoked_at IS NULL AND expires_at > ? GROUP BY user_id'
    ).bind(now).all();
    const sessionCountByUser: Record<string, number> = {};
    for (const s of (sessRes.results || [])) {
      sessionCountByUser[s.user_id] = s.c;
    }

    const results = usersList.map(u => ({
      id: u.id,
      email: u.email,
      name: u.display_name,
      displayName: u.display_name,
      role: u.role,
      status: u.status,
      mustChangePassword: u.must_change_password === 1,
      createdAt: u.created_at,
      lastLoginAt: u.last_login_at,
      activeCharacterId: u.active_character_id,
      characterNames: charsByOwner[u.id] || [],
      activeSessionCount: sessionCountByUser[u.id] || 0
    }));

    return json(results);
  }

  // PATCH /api/users/:id
  if (path.match(/^\/users\/[^/]+$/) && method === 'PATCH') {
    const targetUserId = path.split('/')[2];
    const body = await request.json() as any;

    const targetUser: UserRow = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').bind(targetUserId).first();
    if (!targetUser) return error('کاربر یافت نشد.', 404);

    const isTargetProtectedDm = dmEmails.includes(targetUser.email.toLowerCase());

    // Role guard: cannot demote protected DM
    if (body.role && body.role !== targetUser.role) {
      if (isTargetProtectedDm && body.role !== 'dm') {
        return error('امکان تنزل رتبه ایمیل‌های اصلی دانجن مستر وجود ندارد.', 403);
      }
      if (targetUser.role === 'dm' && body.role === 'player') {
        const dmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
        if ((dmCount?.c || 0) <= 1) {
          return error('حداقل یک دانجن مستر فعال باید در سیستم باقی بماند.', 400);
        }
      }
    }

    // Status guard: cannot disable protected DM or last active DM
    if (body.status && body.status !== targetUser.status) {
      if (isTargetProtectedDm && body.status === 'disabled') {
        return error('امکان غیرفعال کردن دانجن مستر اصلی وجود ندارد.', 403);
      }
      if (targetUser.role === 'dm' && body.status === 'disabled') {
        const activeDmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
        if ((activeDmCount?.c || 0) <= 1) {
          return error('نمی‌توان تنها دانجن مستر فعال را غیرفعال کرد.', 400);
        }
      }
    }

    const nextDisplayName = body.displayName ? String(body.displayName).trim() : targetUser.display_name;
    const nextRole = (body.role === 'dm' || body.role === 'player') ? body.role : targetUser.role;
    const nextStatus = (body.status === 'active' || body.status === 'disabled') ? body.status : targetUser.status;

    await env.DB.prepare(
      'UPDATE users SET display_name = ?, role = ?, status = ? WHERE id = ?'
    ).bind(nextDisplayName, nextRole, nextStatus, targetUserId).run();

    // If disabled, revoke all sessions
    if (nextStatus === 'disabled') {
      await env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?').bind(now, targetUserId).run();
    }

    await audit('user-update', targetUserId, { displayName: nextDisplayName, role: nextRole, status: nextStatus });

    return json({
      id: targetUserId,
      email: targetUser.email,
      name: nextDisplayName,
      displayName: nextDisplayName,
      role: nextRole,
      status: nextStatus
    });
  }

  // POST /api/users/:id/reset-token (Generate one-time reset link)
  if (path.match(/^\/users\/[^/]+\/reset-token$/) && method === 'POST') {
    const targetUserId = path.split('/')[2];
    const targetUser: UserRow = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').bind(targetUserId).first();
    if (!targetUser) return error('کاربر یافت نشد.', 404);

    const resetToken = generateRandomToken(32);
    const tokenHash = await sha256Hex(resetToken);
    const resetId = `reset-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours

    await env.DB.prepare(
      'INSERT INTO password_resets (id, user_id, token_hash, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(resetId, targetUserId, tokenHash, currentUser.id, now, expiresAt).run();

    await audit('create-reset-token', targetUserId);

    const resetLink = `${url.origin}/#reset-password?token=${resetToken}`;
    return json({
      resetToken,
      resetLink,
      expiresAt
    });
  }

  // POST /api/users/:id/revoke-sessions
  if (path.match(/^\/users\/[^/]+\/revoke-sessions$/) && method === 'POST') {
    const targetUserId = path.split('/')[2];
    await env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?').bind(now, targetUserId).run();
    await audit('revoke-user-sessions', targetUserId);
    return json({ success: true, message: 'تمام نشست‌های کاربر با موفقیت لغو شدند.' });
  }

  // POST /api/users/:id/assign-character
  if (path.match(/^\/users\/[^/]+\/assign-character$/) && method === 'POST') {
    const targetUserId = path.split('/')[2];
    const body = await request.json() as any;
    const charId = body.characterId;

    const targetUser = await env.DB.prepare('SELECT id, active_character_id FROM users WHERE id = ? AND deleted_at IS NULL').bind(targetUserId).first();
    if (!targetUser) return error('کاربر یافت نشد.', 404);

    const char = await env.DB.prepare('SELECT id FROM characters WHERE id = ?').bind(charId).first();
    if (!char) return error('کاراکتر یافت نشد.', 404);

    await env.DB.prepare('UPDATE characters SET owner_id = ? WHERE id = ?').bind(targetUserId, charId).run();

    if (!targetUser.active_character_id) {
      await env.DB.prepare('UPDATE users SET active_character_id = ? WHERE id = ?').bind(charId, targetUserId).run();
    }

    await audit('assign-character', targetUserId, { characterId: charId });
    return json({ success: true });
  }

  // DELETE /api/users/:id (soft delete)
  if (path.match(/^\/users\/[^/]+$/) && method === 'DELETE') {
    const targetUserId = path.split('/')[2];
    if (targetUserId === currentUser.id) {
      return error('شما نمی‌توانید حساب کاربری خود را حذف کنید.', 400);
    }

    const targetUser: UserRow = await env.DB.prepare('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL').bind(targetUserId).first();
    if (!targetUser) return error('کاربر یافت نشد.', 404);

    if (dmEmails.includes(targetUser.email.toLowerCase())) {
      return error('امکان حذف دانجن مستر اصلی وجود ندارد.', 403);
    }

    if (targetUser.role === 'dm') {
      const dmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
      if ((dmCount?.c || 0) <= 1) {
        return error('امکان حذف تنها دانجن مستر فعال وجود ندارد.', 400);
      }
    }

    // Soft delete: status=disabled, deleted_at=now, sessions revoked, characters unassigned
    await env.DB.prepare('UPDATE users SET deleted_at = ?, status = ? WHERE id = ?').bind(now, 'disabled', targetUserId).run();
    await env.DB.prepare('UPDATE auth_sessions SET revoked_at = ? WHERE user_id = ?').bind(now, targetUserId).run();
    await env.DB.prepare('UPDATE characters SET owner_id = NULL WHERE owner_id = ?').bind(targetUserId).run();

    await audit('user-delete', targetUserId);
    return json({ success: true, message: 'کاربر با موفقیت حذف شد.' });
  }

  // POST /api/invites
  if (path === '/invites' && method === 'POST') {
    const body = await request.json() as any;
    const label = String(body.label || 'دعوت جدید').trim();
    const expiresInDays = Math.max(1, Math.min(365, parseInt(body.expiresInDays || 30, 10)));
    const maxUses = Math.max(1, parseInt(body.maxUses || 1, 10));
    const assignCharacterId = body.assignCharacterId || null;

    const rawCode = generateRandomToken(16);
    const codeHash = await sha256Hex(rawCode);
    const inviteId = `inv-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1000;

    await env.DB.prepare(
      'INSERT INTO invites (id, code_hash, label, created_by, created_at, expires_at, max_uses, used_count, assign_character_id) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)'
    ).bind(inviteId, codeHash, label, currentUser.id, now, expiresAt, maxUses, assignCharacterId).run();

    await audit('invite-create', inviteId, { label, maxUses, expiresAt, assignCharacterId });

    const inviteLink = `${url.origin}/#register?code=${rawCode}`;
    return json({
      invite: {
        id: inviteId,
        label,
        createdBy: currentUser.id,
        createdAt: now,
        expiresAt,
        maxUses,
        usedCount: 0,
        assignCharacterId,
        code: rawCode,
        inviteLink
      }
    }, 201);
  }

  // GET /api/invites
  if (path === '/invites' && method === 'GET') {
    const res = await env.DB.prepare('SELECT * FROM invites ORDER BY created_at DESC').all();
    const invites = (res.results || []).map((r: any) => {
      let status = 'active';
      if (r.revoked_at) status = 'revoked';
      else if (r.expires_at > 0 && r.expires_at < now) status = 'expired';
      else if (r.used_count >= r.max_uses) status = 'used';

      return {
        id: r.id,
        label: r.label,
        createdBy: r.created_by,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
        maxUses: r.max_uses,
        usedCount: r.used_count,
        assignCharacterId: r.assign_character_id,
        revokedAt: r.revoked_at,
        status
      };
    });
    return json(invites);
  }

  // DELETE /api/invites/:id (revoke invite)
  if (path.match(/^\/invites\/[^/]+$/) && method === 'DELETE') {
    const inviteId = path.split('/')[2];
    await env.DB.prepare('UPDATE invites SET revoked_at = ? WHERE id = ?').bind(now, inviteId).run();
    await audit('invite-revoke', inviteId);
    return json({ success: true });
  }

  // GET /api/audit
  if (path === '/audit' && method === 'GET') {
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get('limit') || '100', 10)));
    const res = await env.DB.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?').bind(limit).all();
    const items = (res.results || []).map((r: any) => ({
      id: r.id,
      actorId: r.actor_id,
      action: r.action,
      targetId: r.target_id,
      meta: r.meta ? JSON.parse(r.meta) : null,
      createdAt: r.created_at
    }));
    return json(items);
  }

  // ---------------------------------------------------------
  // Characters Routes (Authorization & 404 matrix)
  // ---------------------------------------------------------
  if (path === '/characters' && method === 'GET') {
    let results: any[] = [];
    if (currentUser.role === 'dm') {
      const stmt = await env.DB.prepare('SELECT data FROM characters').all();
      results = stmt.results || [];
    } else {
      const stmt = await env.DB.prepare('SELECT data FROM characters WHERE owner_id = ?').bind(currentUser.id).all();
      results = stmt.results || [];
    }
    return json(results.map(row => JSON.parse(row.data)));
  }

  if (path.match(/^\/characters\/[^/]+$/) && method === 'GET') {
    const charId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id, data FROM characters WHERE id = ?').bind(charId).first();
    // 404 if not found or player does not own it (hide existence)
    if (!row || (currentUser.role !== 'dm' && row.owner_id !== currentUser.id)) {
      return error('شخصیت یافت نشد.', 404);
    }
    return json(JSON.parse(row.data));
  }

  if (path === '/characters' && method === 'POST') {
    const charData = await request.json() as any;
    const charId = `char-${Date.now()}-${generateRandomToken(4)}`;
    const newChar = {
      ...charData,
      id: charId,
      ownerId: currentUser.id,
      revision: 1,
      updatedAt: new Date().toISOString()
    };

    await env.DB.prepare(
      'INSERT INTO characters (id, owner_id, name, class_name, level, data, revision, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      charId,
      currentUser.id,
      newChar.name || 'شخصیت نو',
      newChar.className || '',
      newChar.level || 1,
      JSON.stringify(newChar),
      1,
      now
    ).run();

    if (!currentUser.active_character_id) {
      await env.DB.prepare('UPDATE users SET active_character_id = ? WHERE id = ?').bind(charId, currentUser.id).run();
    }

    return json(newChar, 201);
  }

  if (path.match(/^\/characters\/[^/]+$/) && method === 'PUT') {
    const charId = path.split('/')[2];
    const charData = await request.json() as any;

    const row = await env.DB.prepare('SELECT owner_id, revision FROM characters WHERE id = ?').bind(charId).first();
    if (!row || (currentUser.role !== 'dm' && row.owner_id !== currentUser.id)) {
      return error('شخصیت یافت نشد.', 404);
    }

    // Optimistic concurrency check
    if (row.revision !== charData.revision) {
      return error('تعارض در ذخیره‌سازی: داده‌ها توسط کاربر دیگری تغییر یافته‌اند.', 409);
    }

    const nextRevision = row.revision + 1;
    const updatedChar = {
      ...charData,
      revision: nextRevision,
      updatedAt: new Date().toISOString()
    };

    await env.DB.prepare(
      'UPDATE characters SET name = ?, class_name = ?, level = ?, data = ?, revision = ?, updated_at = ? WHERE id = ?'
    ).bind(
      updatedChar.name,
      updatedChar.className,
      updatedChar.level,
      JSON.stringify(updatedChar),
      nextRevision,
      now,
      charId
    ).run();

    return json(updatedChar);
  }

  if (path.match(/^\/characters\/[^/]+$/) && method === 'DELETE') {
    const charId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(charId).first();
    if (!row || (currentUser.role !== 'dm' && row.owner_id !== currentUser.id)) {
      return error('شخصیت یافت نشد.', 404);
    }
    await env.DB.prepare('DELETE FROM characters WHERE id = ?').bind(charId).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Notes Routes (Private to player, shared optionally with DM)
  // ---------------------------------------------------------
  if (path === '/notes' && method === 'GET') {
    const charFilter = url.searchParams.get('characterId');
    let stmt;
    if (currentUser.role === 'dm') {
      stmt = charFilter
        ? env.DB.prepare('SELECT data FROM notes WHERE character_id = ? AND (shared_with_dm = 1 OR owner_id = ?)').bind(charFilter, currentUser.id)
        : env.DB.prepare('SELECT data FROM notes WHERE shared_with_dm = 1 OR owner_id = ?').bind(currentUser.id);
    } else {
      stmt = charFilter
        ? env.DB.prepare('SELECT data FROM notes WHERE owner_id = ? AND character_id = ?').bind(currentUser.id, charFilter)
        : env.DB.prepare('SELECT data FROM notes WHERE owner_id = ?').bind(currentUser.id);
    }
    const res = await stmt.all();
    return json((res.results || []).map((r: any) => JSON.parse(r.data)));
  }

  if (path === '/notes' && method === 'POST') {
    const noteData = await request.json() as any;
    const noteId = `note-${Date.now()}-${generateRandomToken(4)}`;
    const newNote = {
      ...noteData,
      id: noteId,
      ownerId: currentUser.id,
      updatedAt: new Date().toISOString()
    };

    await env.DB.prepare(
      'INSERT INTO notes (id, character_id, owner_id, title, shared_with_dm, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      noteId,
      newNote.characterId || null,
      currentUser.id,
      newNote.title,
      newNote.sharedWithDm ? 1 : 0,
      JSON.stringify(newNote),
      now
    ).run();

    return json(newNote, 201);
  }

  if (path.match(/^\/notes\/[^/]+$/) && method === 'PUT') {
    const noteId = path.split('/')[2];
    const noteData = await request.json() as any;
    const row = await env.DB.prepare('SELECT owner_id FROM notes WHERE id = ?').bind(noteId).first();
    if (!row || (currentUser.role !== 'dm' && row.owner_id !== currentUser.id)) {
      return error('یادداشت یافت نشد.', 404);
    }
    const updated = { ...noteData, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'UPDATE notes SET title = ?, shared_with_dm = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(updated.title, updated.sharedWithDm ? 1 : 0, JSON.stringify(updated), now, noteId).run();
    return json(updated);
  }

  if (path.match(/^\/notes\/[^/]+$/) && method === 'DELETE') {
    const noteId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id FROM notes WHERE id = ?').bind(noteId).first();
    if (!row || (currentUser.role !== 'dm' && row.owner_id !== currentUser.id)) {
      return error('یادداشت یافت نشد.', 404);
    }
    await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(noteId).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // NPCs / Bestiary (Players ONLY see revealed=1, DM sees all)
  // ---------------------------------------------------------
  if (path === '/npcs' && method === 'GET') {
    let stmt;
    if (currentUser.role === 'dm') {
      stmt = env.DB.prepare('SELECT data FROM npcs');
    } else {
      stmt = env.DB.prepare('SELECT data FROM npcs WHERE is_revealed = 1');
    }
    const res = await stmt.all();
    return json((res.results || []).map((r: any) => JSON.parse(r.data)));
  }

  if (path === '/npcs' && method === 'POST') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    const id = `npc-${Date.now()}`;
    const newNpc = { ...data, id, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'INSERT INTO npcs (id, scope_type, scope_id, name, type, is_revealed, location_tag, session_tag, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, 'campaign', 'zorvania-c1', newNpc.name, newNpc.type, newNpc.isRevealed ? 1 : 0, newNpc.locationTag || '', newNpc.sessionTag || '', JSON.stringify(newNpc), now).run();
    return json(newNpc, 201);
  }

  if (path.match(/^\/npcs\/[^/]+$/) && method === 'PUT') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    const data = await request.json() as any;
    const updated = { ...data, id, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'UPDATE npcs SET name = ?, type = ?, is_revealed = ?, location_tag = ?, session_tag = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(updated.name, updated.type, updated.isRevealed ? 1 : 0, updated.locationTag || '', updated.sessionTag || '', JSON.stringify(updated), now, id).run();
    return json(updated);
  }

  if (path.match(/^\/npcs\/[^/]+$/) && method === 'DELETE') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    await env.DB.prepare('DELETE FROM npcs WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Items & Library (Players ONLY see revealed=1, DM sees all)
  // ---------------------------------------------------------
  if (path === '/items' && method === 'GET') {
    let stmt;
    if (currentUser.role === 'dm') {
      stmt = env.DB.prepare('SELECT data FROM items');
    } else {
      stmt = env.DB.prepare('SELECT data FROM items WHERE is_revealed = 1');
    }
    const res = await stmt.all();
    return json((res.results || []).map((r: any) => JSON.parse(r.data)));
  }

  if (path === '/items' && method === 'POST') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    const id = `item-${Date.now()}`;
    const newItem = { ...data, id, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'INSERT INTO items (id, scope_type, scope_id, name, category, is_revealed, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, 'campaign', 'zorvania-c1', newItem.name, newItem.category, newItem.isRevealed ? 1 : 0, JSON.stringify(newItem), now).run();
    return json(newItem, 201);
  }

  // ---------------------------------------------------------
  // Live Sync Route (Polling status, cache-free)
  // ---------------------------------------------------------
  if (path === '/live' && method === 'GET') {
    if (!env.DB) {
      return json({ activeEncounterId: null, version: 0, serverTime: Date.now() }, 200, {
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });
    }
    const row = await env.DB.prepare(
      "SELECT id, version FROM encounters WHERE status IN ('active', 'paused') ORDER BY updated_at DESC LIMIT 1"
    ).first();
    return json(
      {
        activeEncounterId: row?.id || null,
        version: row ? Number(row.version) : 0,
        serverTime: Date.now()
      },
      200,
      { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    );
  }

  // ---------------------------------------------------------
  // Locations Routes (DM CRUD, Players revealed only)
  // ---------------------------------------------------------
  if (path === '/locations' && method === 'GET') {
    if (!env.DB) return json([]);
    if (currentUser?.role === 'dm') {
      const res = await env.DB.prepare('SELECT * FROM locations ORDER BY created_at ASC').all();
      const list = (res.results || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        region: r.region,
        description: r.description,
        imageUrl: r.image_url,
        dmNotes: r.dm_notes,
        revealed: r.revealed === 1,
        parentId: r.parent_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return json(list);
    } else {
      // Players see ONLY revealed locations without dm_notes
      const res = await env.DB.prepare(
        'SELECT id, name, region, description, image_url, revealed, parent_id, created_at, updated_at FROM locations WHERE revealed = 1 ORDER BY name ASC'
      ).all();
      const list = (res.results || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        region: r.region,
        description: r.description,
        imageUrl: r.image_url,
        revealed: true,
        parentId: r.parent_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return json(list);
    }
  }

  if (path === '/locations' && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    const id = `loc-${Date.now()}-${generateRandomToken(4)}`;
    const locName = String(data.name || '').trim();
    if (!locName) return error('نام مکان الزامی است.');
    const region = data.region || 'ورنا';
    const desc = data.description || '';
    const imgUrl = data.imageUrl || '';
    const dmNotes = data.dmNotes || '';
    const revealed = data.revealed ? 1 : 0;
    const parentId = data.parentId || null;
    const t = Date.now();

    await env.DB.prepare(
      `INSERT INTO locations (id, scope_type, scope_id, name, region, description, image_url, dm_notes, revealed, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, 'campaign', 'zorvania-c1', locName, region, desc, imgUrl, dmNotes, revealed, parentId, t, t).run();

    await audit('create_location', id, { name: locName, region });
    return json({
      id,
      name: locName,
      region,
      description: desc,
      imageUrl: imgUrl,
      dmNotes,
      revealed: revealed === 1,
      parentId,
      createdAt: t,
      updatedAt: t
    }, 201);
  }

  if (path.startsWith('/locations/') && method === 'PATCH') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const locId = path.replace('/locations/', '');
    const existing = await env.DB.prepare('SELECT * FROM locations WHERE id = ?').bind(locId).first();
    if (!existing) return error('مکان یافت نشد.', 404);

    const data = await request.json() as any;
    const locName = data.name !== undefined ? String(data.name).trim() : existing.name;
    const region = data.region !== undefined ? data.region : existing.region;
    const desc = data.description !== undefined ? data.description : existing.description;
    const imgUrl = data.imageUrl !== undefined ? data.imageUrl : existing.image_url;
    const dmNotes = data.dmNotes !== undefined ? data.dmNotes : existing.dm_notes;
    const revealed = data.revealed !== undefined ? (data.revealed ? 1 : 0) : existing.revealed;
    const parentId = data.parentId !== undefined ? data.parentId : existing.parent_id;
    const t = Date.now();

    await env.DB.prepare(
      `UPDATE locations SET name = ?, region = ?, description = ?, image_url = ?, dm_notes = ?, revealed = ?, parent_id = ?, updated_at = ? WHERE id = ?`
    ).bind(locName, region, desc, imgUrl, dmNotes, revealed, parentId, t, locId).run();

    await audit('update_location', locId, { name: locName, revealed: revealed === 1 });
    return json({
      id: locId,
      name: locName,
      region,
      description: desc,
      imageUrl: imgUrl,
      dmNotes,
      revealed: revealed === 1,
      parentId,
      createdAt: existing.created_at,
      updatedAt: t
    });
  }

  if (path.startsWith('/locations/') && method === 'DELETE') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const locId = path.replace('/locations/', '');
    await env.DB.prepare('DELETE FROM locations WHERE id = ?').bind(locId).run();
    await audit('delete_location', locId);
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Live Encounters Helper Functions
  // ---------------------------------------------------------
  const computeQualitativeHealth = (hp: number, maxHp: number): 'سالم' | 'زخمی' | 'نیمه‌جان' | 'رو به مرگ' => {
    if (maxHp <= 0 || hp <= 0) return 'رو به مرگ';
    const pct = (hp / maxHp) * 100;
    if (pct > 75) return 'سالم';
    if (pct >= 25) return 'زخمی';
    return 'نیمه‌جان';
  };

  const buildPlayerEncounterSnapshot = async (encRow: any) => {
    const encId = encRow.id;
    let settings: any = { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true };
    try {
      if (typeof encRow.settings === 'string') settings = JSON.parse(encRow.settings);
      else if (encRow.settings) settings = encRow.settings;
    } catch {}

    let locData: any = null;
    if (encRow.location_id) {
      const locRow = await env.DB.prepare(
        'SELECT id, name, region, description, image_url, revealed FROM locations WHERE id = ?'
      ).bind(encRow.location_id).first();
      if (locRow) {
        locData = {
          id: locRow.id,
          name: locRow.name,
          region: locRow.region,
          description: locRow.revealed === 1 ? locRow.description : undefined,
          imageUrl: locRow.revealed === 1 ? locRow.image_url : undefined
        };
      }
    }

    const partRows = await env.DB.prepare(
      'SELECT * FROM encounter_participants WHERE encounter_id = ? ORDER BY initiative DESC, sort_index ASC'
    ).bind(encId).all();

    const playerParticipants: any[] = [];
    for (const p of (partRows.results || [])) {
      // Hidden participants are NEVER included in any player response
      if (p.visibility === 'hidden') continue;

      // Defeated visibility follows showDefeated
      if (p.status === 'defeated' && settings.showDefeated === false) continue;

      // Announced participants show as "موجود ناشناخته" with no stats
      if (p.visibility === 'announced') {
        playerParticipants.push({
          id: p.id,
          kind: p.kind,
          displayNameForPlayers: 'موجود ناشناخته',
          healthStatus: 'سالم',
          status: p.status,
          initiative: p.initiative,
          initiativeStatus: p.initiative_status,
          phase: null,
          sortIndex: p.sort_index,
          characterId: null,
          isAlly: false
        });
        continue;
      }

      // Revealed participant
      let currentHp = p.hp;
      let maxHp = p.max_hp;

      if (p.kind === 'character' && p.character_id) {
        const charRow = await env.DB.prepare('SELECT data FROM characters WHERE id = ?').bind(p.character_id).first();
        if (charRow?.data) {
          try {
            const charData = JSON.parse(charRow.data);
            if (charData.hp) {
              currentHp = charData.hp.current;
              maxHp = charData.hp.max;
            }
          } catch {}
        }
      }

      const healthStatus = computeQualitativeHealth(currentHp, maxHp);
      const isAlly = p.kind === 'character';
      const isOwnCharacter = currentUser && p.character_id && currentUser.active_character_id === p.character_id;

      let conditions: string[] | undefined = undefined;
      if (settings.showConditions !== false) {
        try {
          conditions = typeof p.conditions === 'string' ? JSON.parse(p.conditions) : (p.conditions || []);
        } catch {
          conditions = [];
        }
      }

      let exactHp: { current: number; max: number } | undefined = undefined;
      if (settings.showExactHp === true || isAlly || isOwnCharacter) {
        exactHp = { current: currentHp, max: maxHp };
      }

      let exactAc: string | undefined = undefined;
      if (settings.showAc === true || isAlly || isOwnCharacter) {
        exactAc = p.ac;
      }

      playerParticipants.push({
        id: p.id,
        kind: p.kind,
        displayNameForPlayers: p.display_name_for_players || p.instance_name,
        healthStatus,
        status: p.status,
        conditions,
        exactHp,
        exactAc,
        initiative: p.initiative,
        initiativeStatus: p.initiative_status,
        phase: p.phase,
        sortIndex: p.sort_index,
        characterId: p.character_id,
        isAlly
      });
    }

    const eventRows = await env.DB.prepare(
      'SELECT * FROM encounter_events WHERE encounter_id = ? AND visible_to_players = 1 ORDER BY created_at ASC'
    ).bind(encId).all();

    const events = (eventRows.results || []).map((e: any) => ({
      id: e.id,
      encounterId: e.encounter_id,
      round: e.round,
      type: e.type,
      text: e.text,
      visibleToPlayers: true,
      createdAt: e.created_at
    }));

    return {
      id: encRow.id,
      name: encRow.name,
      locationId: encRow.location_id,
      location: locData,
      status: encRow.status,
      round: encRow.round,
      currentParticipantId: encRow.current_participant_id,
      settings,
      version: encRow.version,
      participants: playerParticipants,
      events
    };
  };

  const buildDmEncounterSnapshot = async (encRow: any) => {
    const encId = encRow.id;
    let settings: any = { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true };
    try {
      if (typeof encRow.settings === 'string') settings = JSON.parse(encRow.settings);
      else if (encRow.settings) settings = encRow.settings;
    } catch {}

    let locData: any = null;
    if (encRow.location_id) {
      const locRow = await env.DB.prepare('SELECT * FROM locations WHERE id = ?').bind(encRow.location_id).first();
      if (locRow) {
        locData = {
          id: locRow.id,
          name: locRow.name,
          region: locRow.region,
          description: locRow.description,
          imageUrl: locRow.image_url,
          dmNotes: locRow.dm_notes,
          revealed: locRow.revealed === 1,
          parentId: locRow.parent_id,
          createdAt: locRow.created_at,
          updatedAt: locRow.updated_at
        };
      }
    }

    const partRows = await env.DB.prepare(
      'SELECT * FROM encounter_participants WHERE encounter_id = ? ORDER BY initiative DESC, sort_index ASC'
    ).bind(encId).all();

    const participants = (partRows.results || []).map((p: any) => ({
      id: p.id,
      encounterId: p.encounter_id,
      kind: p.kind,
      npcTemplateId: p.npc_template_id,
      characterId: p.character_id,
      instanceName: p.instance_name,
      displayNameForPlayers: p.display_name_for_players,
      maxHp: p.max_hp,
      hp: p.hp,
      ac: p.ac,
      acState: p.ac_state,
      conditions: typeof p.conditions === 'string' ? JSON.parse(p.conditions) : (p.conditions || []),
      initiative: p.initiative,
      initiativeStatus: p.initiative_status,
      visibility: p.visibility,
      status: p.status,
      phase: p.phase,
      groupId: p.group_id,
      sortIndex: p.sort_index,
      addedAtRound: p.added_at_round,
      revision: p.revision || 1,
      notes: p.notes,
      createdAt: p.created_at
    }));

    const eventRows = await env.DB.prepare(
      'SELECT * FROM encounter_events WHERE encounter_id = ? ORDER BY created_at ASC'
    ).bind(encId).all();

    const events = (eventRows.results || []).map((e: any) => ({
      id: e.id,
      encounterId: e.encounter_id,
      round: e.round,
      type: e.type,
      text: e.text,
      visibleToPlayers: e.visible_to_players === 1,
      createdAt: e.created_at
    }));

    return {
      id: encRow.id,
      name: encRow.name,
      locationId: encRow.location_id,
      location: locData,
      status: encRow.status,
      round: encRow.round,
      currentParticipantId: encRow.current_participant_id,
      sessionTag: encRow.session_tag,
      settings,
      version: encRow.version,
      dmNotes: encRow.dm_notes,
      startedAt: encRow.started_at,
      endedAt: encRow.ended_at,
      createdBy: encRow.created_by,
      createdAt: encRow.created_at,
      updatedAt: encRow.updated_at,
      participants,
      events
    };
  };

  // ---------------------------------------------------------
  // Live Encounter Routes (Player & View)
  // ---------------------------------------------------------
  if (path === '/encounters/active' && method === 'GET') {
    if (!env.DB) return error('پایگاه داده در دسترس نیست.', 500);
    const encRow = await env.DB.prepare(
      "SELECT * FROM encounters WHERE status IN ('active', 'paused') ORDER BY updated_at DESC LIMIT 1"
    ).first();
    if (!encRow) return error('هیچ مبارزه فعالی یافت نشد.', 404);

    const snapshot = await buildPlayerEncounterSnapshot(encRow);
    return json(snapshot);
  }

  if (path.startsWith('/encounters/') && path.includes('/view') && method === 'GET') {
    const encId = path.replace('/encounters/', '').replace('/view', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    // Draft encounters are invisible to players (Acceptance Test 1)
    if (currentUser?.role !== 'dm' && encRow.status === 'draft') {
      return error('مبارزه مورد نظر یافت نشد.', 404);
    }

    const since = url.searchParams.get('since');
    if (since && Number(since) === Number(encRow.version)) {
      return json({ notModified: true });
    }

    const etag = `W/"enc-${encRow.id}-${encRow.version}"`;
    if (request.headers.get('If-None-Match') === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag, ...SECURITY_HEADERS } });
    }

    if (currentUser?.role === 'dm') {
      const dmSnapshot = await buildDmEncounterSnapshot(encRow);
      return json(dmSnapshot, 200, { ETag: etag });
    } else {
      const playerSnapshot = await buildPlayerEncounterSnapshot(encRow);
      return json(playerSnapshot, 200, { ETag: etag });
    }
  }

  // Player rolls / submits initiative for OWN character
  if (path.startsWith('/encounters/') && path.endsWith('/initiative') && method === 'POST') {
    if (!currentUser) return error('نشست نامعتبر است.', 401);
    const encId = path.replace('/encounters/', '').replace('/initiative', '');
    const body = await request.json() as any;
    const { characterId, value } = body;

    if (!characterId) return error('شناسه شخصیت الزامی است.');
    const numValue = Number(value);
    // Acceptance Test 5: Reject values outside 1-40
    if (isNaN(numValue) || numValue < 1 || numValue > 40) {
      return error('مقدار ابتکار عمل باید بین ۱ تا ۴۰ باشد.', 400);
    }

    // Acceptance Test 5: Player can submit initiative ONLY for their OWN character
    if (currentUser.role !== 'dm') {
      const charRow = await env.DB.prepare('SELECT owner_id, name FROM characters WHERE id = ?').bind(characterId).first();
      if (!charRow || charRow.owner_id !== currentUser.id) {
        return error('شما فقط می‌توانید برای شخصیت متعلق به خود ابتکار عمل بیندازید.', 403);
      }
    }

    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const participant = await env.DB.prepare(
      'SELECT * FROM encounter_participants WHERE encounter_id = ? AND character_id = ?'
    ).bind(encId, characterId).first();
    if (!participant) return error('این شخصیت در مبارزه حضور ندارد.', 404);

    let settings: any = {};
    try {
      settings = typeof encRow.settings === 'string' ? JSON.parse(encRow.settings) : (encRow.settings || {});
    } catch {}

    const newStatus = settings.playerInitiativeRolls === false ? 'set' : 'pending';
    const newVersion = (encRow.version || 0) + 1;
    const t = Date.now();

    await env.DB.prepare(
      'UPDATE encounter_participants SET initiative = ?, initiative_status = ?, revision = revision + 1 WHERE id = ?'
    ).bind(numValue, newStatus, participant.id).run();

    await env.DB.prepare('UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?').bind(newVersion, t, encId).run();

    const charName = participant.display_name_for_players || participant.instance_name;
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', ?, 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, `${charName} ابتکار عمل ${numValue} را ثبت کرد.`, t).run();

    return json({ success: true, initiative: numValue, initiativeStatus: newStatus });
  }

  // ---------------------------------------------------------
  // DM Live Encounters Management
  // ---------------------------------------------------------
  if (path === '/encounters' && method === 'GET') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const statusFilter = url.searchParams.get('status');
    const locFilter = url.searchParams.get('locationId');

    let query = 'SELECT * FROM encounters WHERE 1=1';
    const bindings: any[] = [];
    if (statusFilter) {
      query += ' AND status = ?';
      bindings.push(statusFilter);
    }
    if (locFilter) {
      query += ' AND location_id = ?';
      bindings.push(locFilter);
    }
    query += ' ORDER BY updated_at DESC';

    const rows = await env.DB.prepare(query).bind(...bindings).all();
    const results = [];
    for (const r of (rows.results || [])) {
      const full = await buildDmEncounterSnapshot(r);
      results.push(full);
    }
    return json(results);
  }

  if (path === '/encounters' && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const body = await request.json() as any;
    const id = `enc-${Date.now()}-${generateRandomToken(4)}`;
    const encName = String(body.name || 'مبارزه جدید').trim();
    const locationId = body.locationId || null;
    const sessionTag = body.sessionTag || '';
    const dmNotes = body.dmNotes || '';
    const settings = JSON.stringify({
      showExactHp: Boolean(body.settings?.showExactHp),
      showAc: Boolean(body.settings?.showAc),
      showConditions: body.settings?.showConditions !== false,
      showDefeated: body.settings?.showDefeated !== false,
      playerInitiativeRolls: body.settings?.playerInitiativeRolls !== false
    });
    const t = Date.now();

    await env.DB.prepare(
      `INSERT INTO encounters (
         id, scope_type, scope_id, name, location_id, status, round, current_participant_id, session_tag,
         settings, version, dm_notes, started_at, ended_at, created_by, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, 'draft', 0, NULL, ?, ?, 1, ?, NULL, NULL, ?, ?, ?)`
    ).bind(id, 'campaign', 'zorvania-c1', encName, locationId, sessionTag, settings, dmNotes, currentUser?.id || null, t, t).run();

    const created = await buildDmEncounterSnapshot({
      id, name: encName, location_id: locationId, status: 'draft', round: 0,
      current_participant_id: null, session_tag: sessionTag, settings, version: 1,
      dm_notes: dmNotes, created_by: currentUser?.id, created_at: t, updated_at: t
    });
    return json(created, 201);
  }

  if (path.startsWith('/encounters/') && method === 'GET' && !path.includes('/view') && !path.includes('/participants') && !path.includes('/events')) {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);
    const full = await buildDmEncounterSnapshot(encRow);
    return json(full);
  }

  if (path.startsWith('/encounters/') && method === 'PATCH' && !path.includes('/participants')) {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const data = await request.json() as any;
    const newName = data.name !== undefined ? String(data.name).trim() : encRow.name;
    const newLocId = data.locationId !== undefined ? data.locationId : encRow.location_id;
    const newSessionTag = data.sessionTag !== undefined ? data.sessionTag : encRow.session_tag;
    const newDmNotes = data.dmNotes !== undefined ? data.dmNotes : encRow.dm_notes;
    const newSettings = data.settings !== undefined ? JSON.stringify(data.settings) : encRow.settings;
    const newStatus = data.status !== undefined ? data.status : encRow.status;
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();

    await env.DB.prepare(
      `UPDATE encounters SET name = ?, location_id = ?, session_tag = ?, dm_notes = ?, settings = ?, status = ?, version = ?, updated_at = ? WHERE id = ?`
    ).bind(newName, newLocId, newSessionTag, newDmNotes, newSettings, newStatus, nextVersion, t, encId).run();

    const updatedRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    const full = await buildDmEncounterSnapshot(updatedRow);
    return json(full);
  }

  // Start Encounter
  if (path.startsWith('/encounters/') && path.endsWith('/start') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/start', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    // Pick top initiative participant
    const partRow = await env.DB.prepare(
      "SELECT id FROM encounter_participants WHERE encounter_id = ? AND status = 'active' ORDER BY initiative DESC, sort_index ASC LIMIT 1"
    ).bind(encId).first();

    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();

    await env.DB.prepare(
      `UPDATE encounters SET status = 'active', round = 1, current_participant_id = ?, started_at = ?, version = ?, updated_at = ? WHERE id = ?`
    ).bind(partRow?.id || null, t, nextVersion, t, encId).run();

    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, 1, 'start', 'مبارزه آغاز شد (دور ۱)', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, t).run();

    return json({ success: true, status: 'active', round: 1, currentParticipantId: partRow?.id || null, version: nextVersion });
  }

  // Pause Encounter
  if (path.startsWith('/encounters/') && path.endsWith('/pause') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/pause', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'paused', version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();

    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', 'مبارزه موقتاً متوقف شد.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();

    return json({ success: true, status: 'paused', version: nextVersion });
  }

  // Resume Encounter
  if (path.startsWith('/encounters/') && path.endsWith('/resume') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/resume', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'active', version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();

    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', 'مبارزه مجدداً از سر گرفته شد.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();

    return json({ success: true, status: 'active', version: nextVersion });
  }

  // End Encounter
  if (path.startsWith('/encounters/') && path.endsWith('/end') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/end', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'ended', ended_at = ?, version = ?, updated_at = ? WHERE id = ?").bind(t, nextVersion, t, encId).run();

    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'end', 'مبارزه با پیروزی به پایان رسید.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();

    return json({ success: true, status: 'ended', version: nextVersion });
  }

  // Next Turn (Defeated participants skipped automatically)
  if (path.startsWith('/encounters/') && path.endsWith('/next-turn') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/next-turn', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const partRows = await env.DB.prepare(
      'SELECT * FROM encounter_participants WHERE encounter_id = ? AND initiative IS NOT NULL ORDER BY initiative DESC, sort_index ASC'
    ).bind(encId).all();

    // Acceptance Test 6: Defeated participants are skipped on Next turn
    const activeParts = (partRows.results || []).filter((p: any) => p.status === 'active');
    if (activeParts.length === 0) return error('هیچ مبارز فعالی یافت نشد.');

    const currentIndex = activeParts.findIndex((p: any) => p.id === encRow.current_participant_id);
    let nextRound = encRow.round || 1;
    let nextIndex = 0;

    if (currentIndex === -1 || currentIndex >= activeParts.length - 1) {
      nextIndex = 0;
      nextRound = nextRound + 1;
    } else {
      nextIndex = currentIndex + 1;
    }

    const nextPart = activeParts[nextIndex];
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();

    await env.DB.prepare(
      'UPDATE encounters SET current_participant_id = ?, round = ?, version = ?, updated_at = ? WHERE id = ?'
    ).bind(nextPart.id, nextRound, nextVersion, t, encId).run();

    if (nextRound > (encRow.round || 1)) {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'round', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, nextRound, `آغاز دور ${nextRound}`, t).run();
    }

    const pName = nextPart.display_name_for_players || nextPart.instance_name;
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'turn', ?, 1, ?)`
    ).bind(`evt-${t + 1}-${generateRandomToken(4)}`, encId, nextRound, `نوبت به ${pName} رسید.`, t + 1).run();

    return json({ success: true, currentParticipantId: nextPart.id, round: nextRound, version: nextVersion });
  }

  // Prev Turn
  if (path.startsWith('/encounters/') && path.endsWith('/prev-turn') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/prev-turn', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const partRows = await env.DB.prepare(
      'SELECT * FROM encounter_participants WHERE encounter_id = ? AND initiative IS NOT NULL ORDER BY initiative DESC, sort_index ASC'
    ).bind(encId).all();

    const activeParts = (partRows.results || []).filter((p: any) => p.status === 'active');
    if (activeParts.length === 0) return error('هیچ مبارز فعالی یافت نشد.');

    const currentIndex = activeParts.findIndex((p: any) => p.id === encRow.current_participant_id);
    let nextRound = encRow.round || 1;
    let prevIndex = 0;

    if (currentIndex <= 0) {
      prevIndex = activeParts.length - 1;
      nextRound = Math.max(1, nextRound - 1);
    } else {
      prevIndex = currentIndex - 1;
    }

    const prevPart = activeParts[prevIndex];
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();

    await env.DB.prepare(
      'UPDATE encounters SET current_participant_id = ?, round = ?, version = ?, updated_at = ? WHERE id = ?'
    ).bind(prevPart.id, nextRound, nextVersion, t, encId).run();

    return json({ success: true, currentParticipantId: prevPart.id, round: nextRound, version: nextVersion });
  }

  // Batch Add Participants / Reinforcements
  if (path.startsWith('/encounters/') && path.endsWith('/participants') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/participants', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const body = await request.json() as any;
    const items = Array.isArray(body.participants) ? body.participants : [body];
    const announceReinforcements = Boolean(body.announceReinforcements);
    const announcementText = body.announcementText || 'نیروهای کمکی از راه رسیدند!';

    const createdList: any[] = [];
    const t = Date.now();

    const maxSortRow = await env.DB.prepare('SELECT MAX(sort_index) as m FROM encounter_participants WHERE encounter_id = ?').bind(encId).first();
    let currentSort = (maxSortRow?.m ?? 0) + 1;

    for (const item of items) {
      const pid = `part-${Date.now()}-${generateRandomToken(4)}`;
      const kind = item.kind || 'monster';
      const npcTemplateId = item.npcTemplateId || null;
      const characterId = item.characterId || null;
      const instanceName = item.instanceName || 'موجود';
      const displayNameForPlayers = item.displayNameForPlayers || instanceName;
      const maxHp = Number(item.maxHp || 10);
      const hp = Number(item.hp !== undefined ? item.hp : maxHp);
      const ac = String(item.ac || '10');
      const acState = item.acState || null;
      const conditions = JSON.stringify(item.conditions || []);
      const initiative = item.initiative !== undefined && item.initiative !== null ? Number(item.initiative) : null;
      const initiativeStatus = initiative !== null ? 'set' : 'none';
      const visibility = item.visibility || 'revealed';
      const status = item.status || 'active';
      const phase = item.phase || null;
      const groupId = item.groupId || null;
      const notes = item.notes || '';
      const addedAtRound = encRow.round || 0;

      await env.DB.prepare(
        `INSERT INTO encounter_participants (
           id, encounter_id, kind, npc_template_id, character_id, instance_name,
           display_name_for_players, max_hp, hp, ac, ac_state, conditions, initiative,
           initiative_status, visibility, status, phase, group_id, sort_index,
           added_at_round, revision, notes, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).bind(
        pid, encId, kind, npcTemplateId, characterId, instanceName,
        displayNameForPlayers, maxHp, hp, ac, acState, conditions, initiative,
        initiativeStatus, visibility, status, phase, groupId, currentSort++,
        addedAtRound, notes, t
      ).run();

      createdList.push({
        id: pid,
        encounterId: encId,
        kind,
        npcTemplateId,
        characterId,
        instanceName,
        displayNameForPlayers,
        maxHp,
        hp,
        ac,
        visibility,
        status,
        initiative,
        initiativeStatus,
        revision: 1
      });
    }

    // Acceptance Test 2: If announced, post player-visible event
    if (announceReinforcements) {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'add', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, announcementText, t).run();
    }

    // Acceptance Test 2: Current turn pointer does NOT move when adding reinforcements
    const nextVersion = (encRow.version || 0) + 1;
    await env.DB.prepare('UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?').bind(nextVersion, t, encId).run();

    return json({ success: true, created: createdList, version: nextVersion }, 201);
  }

  // Update Participant (PATCH) with revision concurrency control
  if (path.startsWith('/encounters/') && path.includes('/participants/') && method === 'PATCH') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const parts = path.split('/');
    const encId = parts[2];
    const pid = parts[4];

    const partRow = await env.DB.prepare('SELECT * FROM encounter_participants WHERE id = ? AND encounter_id = ?').bind(pid, encId).first();
    if (!partRow) return error('مبارز یافت نشد.', 404);

    const data = await request.json() as any;

    // Acceptance Test 9: Participant revision concurrency
    if (data.revision !== undefined && Number(data.revision) !== Number(partRow.revision)) {
      return error('تغییرات توسط تب یا کاربر دیگری به‌روزرسانی شده است.', 409);
    }

    const newHp = data.hp !== undefined ? Number(data.hp) : partRow.hp;
    const newMaxHp = data.maxHp !== undefined ? Number(data.maxHp) : partRow.max_hp;
    const newAc = data.ac !== undefined ? String(data.ac) : partRow.ac;
    const newAcState = data.acState !== undefined ? data.acState : partRow.ac_state;
    const newConditions = data.conditions !== undefined ? JSON.stringify(data.conditions) : partRow.conditions;
    const newInit = data.initiative !== undefined ? (data.initiative === null ? null : Number(data.initiative)) : partRow.initiative;
    const newInitStatus = data.initiativeStatus !== undefined ? data.initiativeStatus : (newInit !== null ? 'set' : partRow.initiative_status);
    const newVisibility = data.visibility !== undefined ? data.visibility : partRow.visibility;
    const newStatus = data.status !== undefined ? data.status : partRow.status;
    const newPhase = data.phase !== undefined ? data.phase : partRow.phase;
    const newName = data.instanceName !== undefined ? data.instanceName : partRow.instance_name;
    const newDisplayName = data.displayNameForPlayers !== undefined ? data.displayNameForPlayers : partRow.display_name_for_players;
    const newNotes = data.notes !== undefined ? data.notes : partRow.notes;
    const newSortIndex = data.sortIndex !== undefined ? Number(data.sortIndex) : partRow.sort_index;
    const newRevision = (partRow.revision || 1) + 1;
    const t = Date.now();

    await env.DB.prepare(
      `UPDATE encounter_participants SET 
         hp = ?, max_hp = ?, ac = ?, ac_state = ?, conditions = ?, initiative = ?, 
         initiative_status = ?, visibility = ?, status = ?, phase = ?, instance_name = ?, 
         display_name_for_players = ?, notes = ?, sort_index = ?, revision = ?
       WHERE id = ?`
    ).bind(
      newHp, newMaxHp, newAc, newAcState, newConditions, newInit,
      newInitStatus, newVisibility, newStatus, newPhase, newName,
      newDisplayName, newNotes, newSortIndex, newRevision, pid
    ).run();

    // If character, sync HP with character sheet
    if (partRow.kind === 'character' && partRow.character_id && data.hp !== undefined) {
      const charRow = await env.DB.prepare('SELECT data FROM characters WHERE id = ?').bind(partRow.character_id).first();
      if (charRow?.data) {
        try {
          const cData = JSON.parse(charRow.data);
          cData.hp = { ...cData.hp, current: newHp, max: newMaxHp };
          await env.DB.prepare('UPDATE characters SET data = ?, updated_at = ? WHERE id = ?')
            .bind(JSON.stringify(cData), t, partRow.character_id).run();
        } catch {}
      }
    }

    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    const nextEncVersion = (encRow?.version || 0) + 1;
    await env.DB.prepare('UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?').bind(nextEncVersion, t, encId).run();

    if (data.status === 'defeated' && partRow.status !== 'defeated') {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'defeat', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `${partRow.display_name_for_players || partRow.instance_name} شکست خورد.`, t).run();
    } else if (data.visibility === 'revealed' && partRow.visibility !== 'revealed') {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'reveal', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `${newDisplayName || newName} آشکار شد!`, t).run();
    }

    return json({ success: true, revision: newRevision, version: nextEncVersion });
  }

  // Delete Participant
  if (path.startsWith('/encounters/') && path.includes('/participants/') && method === 'DELETE') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const parts = path.split('/');
    const encId = parts[2];
    const pid = parts[4];

    await env.DB.prepare('DELETE FROM encounter_participants WHERE id = ? AND encounter_id = ?').bind(pid, encId).run();
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    const nextVersion = (encRow?.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare('UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?').bind(nextVersion, t, encId).run();

    return json({ success: true, version: nextVersion });
  }

  // Add Event
  if (path.startsWith('/encounters/') && path.endsWith('/events') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/events', '');
    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    if (!encRow) return error('مبارزه یافت نشد.', 404);

    const body = await request.json() as any;
    const text = String(body.text || '').trim();
    if (!text) return error('متن رویداد الزامی است.');
    const visible = body.visibleToPlayers !== false ? 1 : 0;
    const t = Date.now();

    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'note', ?, ?, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, text, visible, t).run();

    const nextVersion = (encRow.version || 0) + 1;
    await env.DB.prepare('UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?').bind(nextVersion, t, encId).run();

    return json({ success: true, version: nextVersion });
  }

  // Distribute Loot to Character
  if (path.startsWith('/encounters/') && path.endsWith('/loot') && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const encId = path.replace('/encounters/', '').replace('/loot', '');
    const body = await request.json() as any;
    const { characterId, item } = body;
    if (!characterId || !item || !item.name) return error('شناسه شخصیت و اطلاعات آیتم الزامی است.');

    const charRow = await env.DB.prepare('SELECT * FROM characters WHERE id = ?').bind(characterId).first();
    if (!charRow) return error('شخصیت یافت نشد.', 404);

    const charData = JSON.parse(charRow.data);
    const newItem = {
      id: `item-${Date.now()}-${generateRandomToken(4)}`,
      name: item.name,
      category: item.category || 'loot',
      quantity: item.quantity || 1,
      weight: item.weight || 0.5,
      description: item.description || '',
      mechanicalEffect: item.mechanicalEffect || '',
      secretNotes: item.secretNotes || '',
      isNew: true
    };
    charData.inventory = [...(charData.inventory || []), newItem];
    const t = Date.now();

    await env.DB.prepare('UPDATE characters SET data = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(charData), t, characterId).run();

    const encRow = await env.DB.prepare('SELECT * FROM encounters WHERE id = ?').bind(encId).first();
    const nextVersion = (encRow?.version || 0) + 1;
    await env.DB.prepare('UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?').bind(nextVersion, t, encId).run();

    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'note', ?, 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `غنیمت ${item.name} به ${charRow.name} اهدا شد.`, t).run();

    return json({ success: true, version: nextVersion, item: newItem });
  }

  // ---------------------------------------------------------
  // Calendar Routes
  // ---------------------------------------------------------
  if (path === '/calendar' && method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM campaign_calendar WHERE id = ?').bind('zorvania-calendar').first();
    if (!row) {
      return json({
        id: 'zorvania-calendar',
        year: 1500,
        month: 1,
        day: 1,
        isOffDay: false,
        currentFestival: 'جشن فرهگان',
        updatedAt: now
      });
    }
    return json({
      id: row.id,
      year: row.year,
      month: row.month,
      day: row.day,
      isOffDay: row.is_off_day === 1,
      offDayIndex: row.off_day_index,
      currentFestival: row.current_festival,
      updatedAt: row.updated_at
    });
  }

  if (path === '/calendar' && method === 'PUT') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    await env.DB.prepare(
      'INSERT INTO campaign_calendar (id, year, month, day, is_off_day, off_day_index, current_festival, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET year = excluded.year, month = excluded.month, day = excluded.day, is_off_day = excluded.is_off_day, off_day_index = excluded.off_day_index, current_festival = excluded.current_festival, updated_at = excluded.updated_at'
    ).bind('zorvania-calendar', data.year, data.month, data.day, data.isOffDay ? 1 : 0, data.offDayIndex || 0, data.currentFestival || '', now).run();
    return json({ ...data, updatedAt: now });
  }

  // ---------------------------------------------------------
  // Ending Tracker (DM Only)
  // ---------------------------------------------------------
  if (path === '/endings' && method === 'GET') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const row = await env.DB.prepare('SELECT data FROM campaign_endings WHERE id = ?').bind('zorvania-endings').first();
    if (!row) {
      return json({ id: 'zorvania-endings', updatedAt: now });
    }
    return json(JSON.parse(row.data));
  }

  if (path === '/endings' && method === 'PUT') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    await env.DB.prepare(
      'INSERT INTO campaign_endings (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
    ).bind('zorvania-endings', JSON.stringify({ ...data, updatedAt: now }), now).run();
    return json({ ...data, updatedAt: now });
  }

  // ---------------------------------------------------------
  // Shanshin Encounters
  // ---------------------------------------------------------
  if (path === '/shanshin-encounters' && method === 'GET') {
    const res = await env.DB.prepare('SELECT * FROM shanshin_encounters ORDER BY id ASC').all();
    return json(res.results || []);
  }

  // ---------------------------------------------------------
  // Phase 2: DM Library & Content Packs
  // ---------------------------------------------------------
  if (path === '/library' && method === 'GET') {
    const source = url.searchParams.get('source') || 'current_campaign';
    const type = url.searchParams.get('type') || '';
    const q = (url.searchParams.get('q') || '').trim().toLowerCase();
    const tag = url.searchParams.get('tag') || '';
    const region = url.searchParams.get('region') || '';
    const sort = url.searchParams.get('sort') || 'newest';

    // Query appropriate tables
    let scopeType = 'campaign';
    let scopeId = 'zorvania-c1';

    if (source === 'my_library') {
      const libRow = await env.DB.prepare('SELECT id FROM content_packs WHERE owner_id = ? AND is_default_library = 1').bind(currentUser.id).first();
      scopeType = 'pack';
      scopeId = libRow?.id || 'pack-zorvania';
    } else if (source.startsWith('pack-') || source.startsWith('pack_')) {
      scopeType = 'pack';
      scopeId = source;
    } else if (source.startsWith('camp-') || source === 'zorvania-c1') {
      scopeType = 'campaign';
      scopeId = source;
    }

    const itemsList: any[] = [];
    if (!type || type === 'location') {
      const rows = await env.DB.prepare('SELECT * FROM locations WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
      for (const r of (rows.results || [])) {
        itemsList.push({ ...r, itemType: 'location', name: r.name, tags: JSON.parse(r.tags || '[]') });
      }
    }
    if (!type || type === 'npc') {
      const rows = await env.DB.prepare('SELECT * FROM npcs WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
      for (const r of (rows.results || [])) {
        itemsList.push({ ...r, itemType: 'npc', name: r.name, tags: JSON.parse(r.tags || '[]') });
      }
    }
    if (!type || type === 'item') {
      const rows = await env.DB.prepare('SELECT * FROM items WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
      for (const r of (rows.results || [])) {
        itemsList.push({ ...r, itemType: 'item', name: r.name, tags: JSON.parse(r.tags || '[]') });
      }
    }
    if (!type || type === 'encounter') {
      const rows = await env.DB.prepare('SELECT * FROM encounters WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
      for (const r of (rows.results || [])) {
        itemsList.push({ ...r, itemType: 'encounter', name: r.name, tags: JSON.parse(r.tags || '[]') });
      }
    }
    if (!type || type === 'faction') {
      const rows = await env.DB.prepare('SELECT * FROM factions WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
      for (const r of (rows.results || [])) {
        itemsList.push({ ...r, itemType: 'faction', name: r.name, tags: JSON.parse(r.tags || '[]') });
      }
    }
    if (!type || type === 'class_template') {
      const rows = await env.DB.prepare('SELECT * FROM class_templates WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
      for (const r of (rows.results || [])) {
        let parsed = {};
        try { parsed = JSON.parse(r.data); } catch {}
        itemsList.push({ ...parsed, ...r, itemType: 'class_template', name: r.name, tags: JSON.parse(r.tags || '[]') });
      }
    }
    if (!type || type === 'lineage_template') {
      const rows = await env.DB.prepare('SELECT * FROM lineage_templates WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
      for (const r of (rows.results || [])) {
        itemsList.push({
          ...r,
          itemType: 'lineage_template',
          name: r.name,
          tags: JSON.parse(r.tags || '[]'),
          abilityBonuses: JSON.parse(r.ability_bonuses || '{}'),
          traits: JSON.parse(r.traits || '[]'),
          languages: JSON.parse(r.languages || '[]'),
          proficiencies: JSON.parse(r.proficiencies || '{}'),
          resistances: JSON.parse(r.resistances || '[]'),
          senses: JSON.parse(r.senses || '{}'),
          sublineages: JSON.parse(r.sublineages || '[]'),
          nameSuggestions: JSON.parse(r.name_suggestions || '[]'),
          backstoryPrompts: JSON.parse(r.backstory_prompts || '[]')
        });
      }
    }
    if (!type || type === 'background_template') {
      const rows = await env.DB.prepare('SELECT * FROM background_templates WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
      for (const r of (rows.results || [])) {
        itemsList.push({
          ...r,
          itemType: 'background_template',
          name: r.name,
          tags: JSON.parse(r.tags || '[]'),
          skillProficiencies: JSON.parse(r.skill_proficiencies || '[]'),
          toolProficiencies: JSON.parse(r.tool_proficiencies || '[]'),
          languages: JSON.parse(r.languages || '[]'),
          startingEquipment: JSON.parse(r.starting_equipment || '[]'),
          personalityTables: JSON.parse(r.personality_tables || '{}')
        });
      }
    }

    let filtered = itemsList;
    if (q) {
      filtered = filtered.filter(i => (i.name && i.name.toLowerCase().includes(q)) || (i.description && i.description.toLowerCase().includes(q)));
    }
    if (tag) {
      filtered = filtered.filter(i => i.tags && i.tags.includes(tag));
    }
    if (region) {
      filtered = filtered.filter(i => i.region === region);
    }

    return json({ items: filtered, total: filtered.length });
  }

  // GET & POST /api/packs
  if (path === '/packs' && method === 'GET') {
    const kind = url.searchParams.get('kind');
    let q = 'SELECT * FROM content_packs WHERE visibility = "instance" OR owner_id = ?';
    const params: any[] = [currentUser.id];
    if (kind) {
      q += ' AND kind = ?';
      params.push(kind);
    }
    const res = await env.DB.prepare(q).bind(...params).all();
    return json(res.results || []);
  }

  if (path === '/packs' && method === 'POST') {
    const data = await request.json() as any;
    const packId = `pack-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO content_packs (id, owner_id, name, description, version, visibility, kind, tags, is_default_library, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(packId, currentUser.id, data.name, data.description || '', '1.0.0', data.visibility || 'private', data.kind || 'pack', JSON.stringify(data.tags || []), t, t).run();

    return json({ id: packId, name: data.name, kind: data.kind || 'pack', createdAt: t }, 201);
  }

  // Favorites GET & PUT
  if (path === '/favorites' && method === 'GET') {
    const res = await env.DB.prepare('SELECT * FROM favorites WHERE user_id = ?').bind(currentUser.id).all();
    return json(res.results || []);
  }

  if (path === '/favorites' && method === 'PUT') {
    const data = await request.json() as any;
    const existing = await env.DB.prepare('SELECT * FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?')
      .bind(currentUser.id, data.entityType, data.entityId).first();
    let isFavorite = false;
    if (existing) {
      await env.DB.prepare('DELETE FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?')
        .bind(currentUser.id, data.entityType, data.entityId).run();
      isFavorite = false;
    } else {
      await env.DB.prepare('INSERT INTO favorites (user_id, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?)')
        .bind(currentUser.id, data.entityType, data.entityId, Date.now()).run();
      isFavorite = true;
    }
    return json({ isFavorite });
  }

  // Wizard: POST /api/campaigns/draft
  if (path === '/campaigns/draft' && method === 'POST') {
    const data = await request.json() as any;
    const campId = `camp-draft-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    const defaultSettings = JSON.stringify({
      units: 'feet',
      startingLevel: 1,
      maxEntryLevel: 20,
      abilityScoreMethods: ['standard_array', 'point_buy', 'roll', 'manual'],
      approval: { onCreate: false, onLevelUp: false },
      backstoryVisibility: 'party',
      diceVisibility: 'table',
      allowPlayerRollPrivate: true,
      allowPlayerCreateCharacter: true,
      encounterDefaults: {
        showExactHp: false,
        showAc: false,
        showConditions: true,
        showDefeated: true,
        playerInitiativeRolls: true
      }
    });

    const initWizard = JSON.stringify({
      step: 1,
      completed: [],
      startMode: data.startMode || 'empty',
      sourceId: data.sourceId || null,
      answers: { name: 'کمپین جدید' }
    });

    await env.DB.prepare(
      `INSERT INTO campaigns (id, name, description, status, owner_id, settings, wizard_state, created_at, updated_at)
       VALUES (?, 'کمپین جدید', '', 'draft', ?, ?, ?, ?, ?)`
    ).bind(campId, currentUser.id, defaultSettings, initWizard, t, t).run();

    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'owner', 'active', ?)`
    ).bind(campId, currentUser.id, t).run();

    return json({ id: campId, name: 'کمپین جدید', status: 'draft', wizardState: JSON.parse(initWizard) }, 201);
  }

  // Wizard: PATCH /api/campaigns/:id/wizard
  if (path.match(/^\/campaigns\/[^/]+\/wizard$/) && method === 'PATCH') {
    const campId = path.split('/')[2];
    const data = await request.json() as any;
    const camp = await env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(campId).first();
    if (!camp) return error('کمپین یافت نشد.', 404);

    const currentWiz = camp.wizard_state ? JSON.parse(camp.wizard_state) : { step: 1, answers: {} };
    const mergedWiz = {
      ...currentWiz,
      ...data,
      answers: {
        ...(currentWiz.answers || {}),
        ...(data.answers || {})
      }
    };

    const newName = mergedWiz.answers.name || camp.name;
    const newDesc = mergedWiz.answers.description || camp.description;
    const t = Date.now();

    await env.DB.prepare(
      'UPDATE campaigns SET name = ?, description = ?, wizard_state = ?, updated_at = ? WHERE id = ?'
    ).bind(newName, newDesc, JSON.stringify(mergedWiz), t, campId).run();

    return json({ id: campId, name: newName, description: newDesc, wizardState: mergedWiz });
  }

  // Wizard: POST /api/campaigns/:id/launch
  if (path.match(/^\/campaigns\/[^/]+\/launch$/) && method === 'POST') {
    const campId = path.split('/')[2];
    const t = Date.now();
    await env.DB.prepare("UPDATE campaigns SET status = 'active', updated_at = ? WHERE id = ?").bind(t, campId).run();
    return json({ success: true, id: campId, status: 'active' });
  }

  // Factions: GET /api/c/:id/factions
  if (path.match(/^\/c\/[^/]+\/factions$/) && method === 'GET') {
    const cId = path.split('/')[2];
    const rows = await env.DB.prepare('SELECT * FROM factions WHERE scope_type = "campaign" AND scope_id = ?').bind(cId).all();
    const list = (rows.results || []).map((r: any) => ({
      ...r,
      revealed: r.revealed === 1,
      tags: JSON.parse(r.tags || '[]')
    }));
    return json(list);
  }

  // Factions: POST /api/c/:id/factions
  if (path.match(/^\/c\/[^/]+\/factions$/) && method === 'POST') {
    const cId = path.split('/')[2];
    const data = await request.json() as any;
    const fId = `fac-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO factions (id, scope_type, scope_id, name, description, attitude, region, revealed, dm_notes, tags, source_mode, created_at, updated_at)
       VALUES (?, 'campaign', ?, ?, ?, ?, ?, ?, ?, ?, 'copy', ?, ?)`
    ).bind(fId, cId, data.name, data.description || '', data.attitude || '', data.region || '', data.revealed ? 1 : 0, data.dmNotes || '', JSON.stringify(data.tags || []), t, t).run();

    return json({ id: fId, name: data.name, ...data, createdAt: t, updatedAt: t }, 201);
  }

  // Campaign Docs: GET /api/c/:id/docs
  if (path.match(/^\/c\/[^/]+\/docs$/) && method === 'GET') {
    const cId = path.split('/')[2];
    const rows = await env.DB.prepare('SELECT * FROM campaign_docs WHERE campaign_id = ? ORDER BY sort_index ASC').bind(cId).all();
    return json(rows.results || []);
  }

  // Campaign Docs: POST /api/c/:id/docs
  if (path.match(/^\/c\/[^/]+\/docs$/) && method === 'POST') {
    const cId = path.split('/')[2];
    const data = await request.json() as any;
    const dId = `cdoc-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO campaign_docs (id, campaign_id, kind, title, body, visibility, sort_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(dId, cId, data.kind || 'session_zero', data.title, data.body || '', data.visibility || 'party', data.sortIndex || 0, t, t).run();

    return json({ id: dId, ...data, createdAt: t, updatedAt: t }, 201);
  }

  // Generic Calendar: GET & PUT /api/generic-calendar
  if (path === '/generic-calendar' && method === 'GET') {
    const row = await env.DB.prepare('SELECT * FROM calendars ORDER BY updated_at DESC LIMIT 1').first();
    if (!row) {
      return json({
        id: 'cal-zorvania',
        name: 'گاه‌شمار شاه‌روزان (زروانیا)',
        eraLabel: 'پ.ر.ن',
        startYear: 1500,
        months: [],
        festivals: [],
        offDays: []
      });
    }
    return json({
      id: row.id,
      name: row.name,
      eraLabel: row.era_label,
      startYear: row.start_year,
      months: JSON.parse(row.months || '[]'),
      festivals: [],
      offDays: JSON.parse(row.off_days || '[]'),
      weekdays: JSON.parse(row.weekdays || '[]')
    });
  }

  // ---------------------------------------------------------
  // Class Templates REST
  // ---------------------------------------------------------
  if (path === '/class-templates' && method === 'GET') {
    const scopeType = url.searchParams.get('scopeType') || 'campaign';
    const scopeId = url.searchParams.get('scopeId') || 'zorvania-c1';
    const rows = await env.DB.prepare('SELECT * FROM class_templates WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r: any) => {
      let parsed = {};
      try { parsed = JSON.parse(r.data); } catch {}
      return { ...parsed, ...r, tags: JSON.parse(r.tags || '[]') };
    });
    return json(list);
  }

  if (path === '/class-templates' && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    const id = data.id || `class-${Date.now()}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO class_templates (id, scope_type, scope_id, name, data, tags, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, data.scopeType || 'campaign', data.scopeId || 'zorvania-c1', data.name, JSON.stringify(data), JSON.stringify(data.tags || []), t).run();
    return json({ ...data, id, updatedAt: t }, 201);
  }

  if (path.startsWith('/class-templates/') && (method === 'PUT' || method === 'PATCH')) {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    const data = await request.json() as any;
    const t = Date.now();
    await env.DB.prepare(
      'UPDATE class_templates SET name = ?, data = ?, tags = ?, updated_at = ? WHERE id = ?'
    ).bind(data.name, JSON.stringify(data), JSON.stringify(data.tags || []), t, id).run();
    return json({ ...data, id, updatedAt: t });
  }

  if (path.startsWith('/class-templates/') && method === 'DELETE') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    await env.DB.prepare('DELETE FROM class_templates WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Lineage Templates REST
  // ---------------------------------------------------------
  if (path === '/lineage-templates' && method === 'GET') {
    const scopeType = url.searchParams.get('scopeType') || 'campaign';
    const scopeId = url.searchParams.get('scopeId') || 'zorvania-c1';
    const rows = await env.DB.prepare('SELECT * FROM lineage_templates WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r: any) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      abilityBonuses: JSON.parse(r.ability_bonuses || '{}'),
      traits: JSON.parse(r.traits || '[]'),
      languages: JSON.parse(r.languages || '[]'),
      proficiencies: JSON.parse(r.proficiencies || '{}'),
      resistances: JSON.parse(r.resistances || '[]'),
      senses: JSON.parse(r.senses || '{}'),
      sublineages: JSON.parse(r.sublineages || '[]'),
      nameSuggestions: JSON.parse(r.name_suggestions || '[]'),
      backstoryPrompts: JSON.parse(r.backstory_prompts || '[]')
    }));
    return json(list);
  }

  if (path.startsWith('/lineage-templates/') && method === 'GET') {
    const id = path.split('/')[2];
    const r = await env.DB.prepare('SELECT * FROM lineage_templates WHERE id = ?').bind(id).first();
    if (!r) return error('نژاد یافت نشد.', 404);
    return json({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      abilityBonuses: JSON.parse(r.ability_bonuses || '{}'),
      traits: JSON.parse(r.traits || '[]'),
      languages: JSON.parse(r.languages || '[]'),
      proficiencies: JSON.parse(r.proficiencies || '{}'),
      resistances: JSON.parse(r.resistances || '[]'),
      senses: JSON.parse(r.senses || '{}'),
      sublineages: JSON.parse(r.sublineages || '[]'),
      nameSuggestions: JSON.parse(r.name_suggestions || '[]'),
      backstoryPrompts: JSON.parse(r.backstory_prompts || '[]')
    });
  }

  if (path === '/lineage-templates' && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    const id = data.id || `lin-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO lineage_templates (
        id, scope_type, scope_id, source_id, source_mode, tags, name, description,
        size, speed, ability_bonuses, traits, languages, proficiencies, resistances,
        senses, sublineages, name_suggestions, backstory_prompts, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, data.scopeType || 'campaign', data.scopeId || 'zorvania-c1', data.sourceId || null,
      data.sourceMode || 'copy', JSON.stringify(data.tags || []), data.name, data.description || '',
      data.size || 'متوسط (Medium)', data.speed || 30, JSON.stringify(data.abilityBonuses || {}),
      JSON.stringify(data.traits || []), JSON.stringify(data.languages || []),
      JSON.stringify(data.proficiencies || {}), JSON.stringify(data.resistances || []),
      JSON.stringify(data.senses || {}), JSON.stringify(data.sublineages || []),
      JSON.stringify(data.nameSuggestions || []), JSON.stringify(data.backstoryPrompts || []),
      t, t
    ).run();
    return json({ ...data, id, createdAt: t, updatedAt: t }, 201);
  }

  if (path.startsWith('/lineage-templates/') && (method === 'PUT' || method === 'PATCH')) {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    const data = await request.json() as any;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE lineage_templates SET
        name = ?, description = ?, size = ?, speed = ?, ability_bonuses = ?,
        traits = ?, languages = ?, proficiencies = ?, resistances = ?, senses = ?,
        sublineages = ?, name_suggestions = ?, backstory_prompts = ?, tags = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      data.name, data.description || '', data.size || 'متوسط (Medium)', data.speed || 30,
      JSON.stringify(data.abilityBonuses || {}), JSON.stringify(data.traits || []),
      JSON.stringify(data.languages || []), JSON.stringify(data.proficiencies || {}),
      JSON.stringify(data.resistances || []), JSON.stringify(data.senses || {}),
      JSON.stringify(data.sublineages || []), JSON.stringify(data.nameSuggestions || []),
      JSON.stringify(data.backstoryPrompts || []), JSON.stringify(data.tags || []),
      t, id
    ).run();
    return json({ ...data, id, updatedAt: t });
  }

  if (path.startsWith('/lineage-templates/') && method === 'DELETE') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    await env.DB.prepare('DELETE FROM lineage_templates WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Background Templates REST
  // ---------------------------------------------------------
  if (path === '/background-templates' && method === 'GET') {
    const scopeType = url.searchParams.get('scopeType') || 'campaign';
    const scopeId = url.searchParams.get('scopeId') || 'zorvania-c1';
    const rows = await env.DB.prepare('SELECT * FROM background_templates WHERE scope_type = ? AND scope_id = ?').bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r: any) => ({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      skillProficiencies: JSON.parse(r.skill_proficiencies || '[]'),
      toolProficiencies: JSON.parse(r.tool_proficiencies || '[]'),
      languages: JSON.parse(r.languages || '[]'),
      startingEquipment: JSON.parse(r.starting_equipment || '[]'),
      featureName: r.feature_name,
      featureDescription: r.feature_description,
      personalityTables: JSON.parse(r.personality_tables || '{}')
    }));
    return json(list);
  }

  if (path.startsWith('/background-templates/') && method === 'GET') {
    const id = path.split('/')[2];
    const r = await env.DB.prepare('SELECT * FROM background_templates WHERE id = ?').bind(id).first();
    if (!r) return error('پیشینه یافت نشد.', 404);
    return json({
      ...r,
      tags: JSON.parse(r.tags || '[]'),
      skillProficiencies: JSON.parse(r.skill_proficiencies || '[]'),
      toolProficiencies: JSON.parse(r.tool_proficiencies || '[]'),
      languages: JSON.parse(r.languages || '[]'),
      startingEquipment: JSON.parse(r.starting_equipment || '[]'),
      featureName: r.feature_name,
      featureDescription: r.feature_description,
      personalityTables: JSON.parse(r.personality_tables || '{}')
    });
  }

  if (path === '/background-templates' && method === 'POST') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    const id = data.id || `bg-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO background_templates (
        id, scope_type, scope_id, source_id, source_mode, tags, name, description,
        skill_proficiencies, tool_proficiencies, languages, starting_equipment,
        feature_name, feature_description, personality_tables, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id, data.scopeType || 'campaign', data.scopeId || 'zorvania-c1', data.sourceId || null,
      data.sourceMode || 'copy', JSON.stringify(data.tags || []), data.name, data.description || '',
      JSON.stringify(data.skillProficiencies || []), JSON.stringify(data.toolProficiencies || []),
      JSON.stringify(data.languages || []), JSON.stringify(data.startingEquipment || []),
      data.featureName || '', data.featureDescription || '',
      JSON.stringify(data.personalityTables || {}), t, t
    ).run();
    return json({ ...data, id, createdAt: t, updatedAt: t }, 201);
  }

  if (path.startsWith('/background-templates/') && (method === 'PUT' || method === 'PATCH')) {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    const data = await request.json() as any;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE background_templates SET
        name = ?, description = ?, skill_proficiencies = ?, tool_proficiencies = ?,
        languages = ?, starting_equipment = ?, feature_name = ?, feature_description = ?,
        personality_tables = ?, tags = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      data.name, data.description || '', JSON.stringify(data.skillProficiencies || []),
      JSON.stringify(data.toolProficiencies || []), JSON.stringify(data.languages || []),
      JSON.stringify(data.startingEquipment || []), data.featureName || '',
      data.featureDescription || '', JSON.stringify(data.personalityTables || {}),
      JSON.stringify(data.tags || []), t, id
    ).run();
    return json({ ...data, id, updatedAt: t });
  }

  if (path.startsWith('/background-templates/') && method === 'DELETE') {
    if (currentUser?.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    await env.DB.prepare('DELETE FROM background_templates WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // STEP 4.1: SESSIONS AND SCHEDULING
  // ---------------------------------------------------------
  const loadFullSession = async (campId: string, sid: string, viewerRole: any) => {
    const s = await env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND campaign_id = ?').bind(sid, campId).first();
    if (!s) return null;

    // RSVPs with user profile info
    const rsvpRes = await env.DB.prepare(
      `SELECT r.session_id, r.user_id, r.status, r.note, r.updated_at, u.display_name, u.avatar_url
         FROM session_rsvps r
         LEFT JOIN users u ON u.id = r.user_id
        WHERE r.session_id = ?`
    ).bind(sid).all();
    const rsvps = (rsvpRes.results || []).map((r: any) => ({
      sessionId: r.session_id,
      userId: r.user_id,
      status: r.status,
      note: r.note || undefined,
      updatedAt: r.updated_at,
      userName: r.display_name || undefined,
      userAvatarUrl: r.avatar_url || undefined
    }));

    // Poll if any
    let poll: any = undefined;
    const pollRow = await env.DB.prepare('SELECT * FROM session_polls WHERE session_id = ?').bind(sid).first();
    if (pollRow) {
      const voteRes = await env.DB.prepare(
        `SELECT v.poll_id, v.option_id, v.user_id, v.choice, u.display_name
           FROM session_poll_votes v
           LEFT JOIN users u ON u.id = v.user_id
          WHERE v.poll_id = ?`
      ).bind(pollRow.id).all();
      const votes = (voteRes.results || []).map((v: any) => ({
        pollId: v.poll_id,
        optionId: v.option_id,
        userId: v.user_id,
        choice: v.choice,
        userName: v.display_name || undefined
      }));
      const options = parseBlob(pollRow.options, []);
      const userVotes: Record<string, string> = {};
      for (const v of votes) {
        if (v.userId === actor.id) {
          userVotes[v.optionId] = v.choice;
        }
      }
      poll = {
        id: pollRow.id,
        sessionId: sid,
        options,
        status: pollRow.status,
        votes,
        totalVotes: votes.length,
        userVotes
      };
    }

    // Attendance if any
    const attRes = await env.DB.prepare('SELECT * FROM session_attendance WHERE session_id = ?').bind(sid).all();
    const attendance = (attRes.results || []).map((a: any) => ({
      sessionId: a.session_id,
      participationId: a.participation_id,
      attended: Number(a.attended) === 1
    }));

    const myRsvp = rsvps.find((r: any) => r.userId === actor.id)?.status;

    const sessionObj: Session = {
      id: s.id,
      campaignId: s.campaign_id,
      number: Number(s.number),
      title: s.title,
      scheduledAt: s.scheduled_at || null,
      durationMinutes: s.duration_minutes ? Number(s.duration_minutes) : 240,
      placeText: s.place_text || undefined,
      onlineUrl: s.online_url || undefined,
      status: s.status as SessionStatus,
      inWorldDate: s.in_world_date || undefined,
      dmNotes: s.dm_notes || undefined,
      createdBy: s.created_by,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      rsvps,
      myRsvp,
      poll,
      attendance
    };

    const isDm = actor.role === 'dm' || viewerRole === 'owner' || viewerRole === 'co_dm';
    return filterSessionForViewer(sessionObj, isDm ? 'dm' : viewerRole || 'player');
  };

  // GET /api/c/:id/sessions — list all sessions in a campaign
  if (path.match(/^\/c\/[^/]+\/sessions$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('کمپین مورد نظر یافت نشد.', 404);

    const sRes = await env.DB.prepare(
      `SELECT id FROM sessions
        WHERE campaign_id = ?
        ORDER BY CASE WHEN scheduled_at IS NULL THEN 1 ELSE 0 END, scheduled_at ASC, number ASC, created_at ASC`
    ).bind(campId).all();

    const list: Session[] = [];
    for (const r of (sRes.results || [])) {
      const full = await loadFullSession(campId, (r as any).id, myRole);
      if (full) list.push(full);
    }
    return json(list);
  }

  // POST /api/c/:id/sessions — create a new session (DM only, optionally with poll dates)
  if (path.match(/^\/c\/[^/]+\/sessions$/) && method === 'POST') {
    const campId = path.split('/')[2];
    if (!(await requireCampaignDm(campId))) return error('فقط دانجن مستر مجاز به ایجاد جلسه است.', 403);

    const body = await request.json() as any;
    const title = String(body.title || '').trim();
    if (!title) return error('عنوان جلسه الزامی است.', 400);

    let sessionNum = Number(body.number);
    if (!sessionNum || isNaN(sessionNum)) {
      const maxRow = await env.DB.prepare('SELECT MAX(number) as mn FROM sessions WHERE campaign_id = ?').bind(campId).first();
      sessionNum = ((maxRow?.mn as number) || 0) + 1;
    }

    const sid = `ses-${Date.now()}-${generateRandomToken(4)}`;
    const scheduledAt = body.scheduledAt ? String(body.scheduledAt) : null;
    const duration = body.durationMinutes ? Number(body.durationMinutes) : 240;
    const placeText = body.placeText ? String(body.placeText) : null;
    const onlineUrl = body.onlineUrl ? String(body.onlineUrl) : null;
    const inWorldDate = body.inWorldDate ? String(body.inWorldDate) : null;
    const dmNotes = body.dmNotes ? String(body.dmNotes) : null;
    const status: SessionStatus = body.status && ['planned', 'confirmed', 'done', 'cancelled'].includes(body.status)
      ? body.status
      : (scheduledAt ? 'confirmed' : 'planned');

    // Poll options handling (2 to 5 dates)
    const pollOptions = body.pollOptions;
    if (pollOptions && Array.isArray(pollOptions) && pollOptions.length > 0) {
      const pVal = validatePollOptions(pollOptions);
      if (!pVal.valid) {
        return error(pVal.error || 'گزینه‌های نظرسنجی تاریخ نامعتبر است.', 400);
      }
      const pollId = `poll-${Date.now()}-${generateRandomToken(4)}`;
      const formattedOpts = pollOptions.map((o: any, idx: number) => ({
        id: o.id || `opt-${idx + 1}`,
        startsAt: String(o.startsAt)
      }));

      await env.DB.prepare(
        `INSERT INTO session_polls (id, session_id, options, status)
         VALUES (?, ?, ?, 'open')`
      ).bind(pollId, sid, JSON.stringify(formattedOpts)).run();
    }

    await env.DB.prepare(
      `INSERT INTO sessions (
        id, campaign_id, number, title, scheduled_at, duration_minutes,
        place_text, online_url, status, in_world_date, dm_notes, created_by,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      sid, campId, sessionNum, title, scheduledAt, duration,
      placeText, onlineUrl, status, inWorldDate, dmNotes, actor.id,
      now, now
    ).run();

    await audit('session-create', sid, { campaignId: campId, number: sessionNum, title });
    const created = await loadFullSession(campId, sid, 'owner');
    return json(created, 201);
  }

  // GET /api/c/:id/sessions/:sid — single session
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+$/) && method === 'GET') {
    const parts = path.split('/');
    const campId = parts[2];
    const sid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);

    const s = await loadFullSession(campId, sid, myRole);
    if (!s) return error('جلسه مورد نظر یافت نشد.', 404);
    return json(s);
  }

  // PATCH /api/c/:id/sessions/:sid — update session details
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const campId = parts[2];
    const sid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const existing = await env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND campaign_id = ?').bind(sid, campId).first();
    if (!existing) return error('جلسه مورد نظر یافت نشد.', 404);

    const body = await request.json() as any;
    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    const number = body.number !== undefined ? Number(body.number) : existing.number;
    const scheduledAt = body.scheduledAt !== undefined ? (body.scheduledAt ? String(body.scheduledAt) : null) : existing.scheduled_at;
    const duration = body.durationMinutes !== undefined ? Number(body.durationMinutes) : existing.duration_minutes;
    const placeText = body.placeText !== undefined ? (body.placeText ? String(body.placeText) : null) : existing.place_text;
    const onlineUrl = body.onlineUrl !== undefined ? (body.onlineUrl ? String(body.onlineUrl) : null) : existing.online_url;
    const status = body.status !== undefined && ['planned', 'confirmed', 'done', 'cancelled'].includes(body.status) ? body.status : existing.status;
    const inWorldDate = body.inWorldDate !== undefined ? (body.inWorldDate ? String(body.inWorldDate) : null) : existing.in_world_date;
    const dmNotes = body.dmNotes !== undefined ? (body.dmNotes ? String(body.dmNotes) : null) : existing.dm_notes;

    await env.DB.prepare(
      `UPDATE sessions SET
        title = ?, number = ?, scheduled_at = ?, duration_minutes = ?,
        place_text = ?, online_url = ?, status = ?, in_world_date = ?,
        dm_notes = ?, updated_at = ?
       WHERE id = ? AND campaign_id = ?`
    ).bind(
      title, number, scheduledAt, duration,
      placeText, onlineUrl, status, inWorldDate,
      dmNotes, now, sid, campId
    ).run();

    await audit('session-update', sid, { campaignId: campId });
    const updated = await loadFullSession(campId, sid, 'owner');
    return json(updated);
  }

  // DELETE /api/c/:id/sessions/:sid — delete a session
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const campId = parts[2];
    const sid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    await env.DB.prepare('DELETE FROM session_attendance WHERE session_id = ?').bind(sid).run();
    const poll = await env.DB.prepare('SELECT id FROM session_polls WHERE session_id = ?').bind(sid).first();
    if (poll) {
      await env.DB.prepare('DELETE FROM session_poll_votes WHERE poll_id = ?').bind(poll.id).run();
      await env.DB.prepare('DELETE FROM session_polls WHERE id = ?').bind(poll.id).run();
    }
    await env.DB.prepare('DELETE FROM session_rsvps WHERE session_id = ?').bind(sid).run();
    await env.DB.prepare('DELETE FROM sessions WHERE id = ? AND campaign_id = ?').bind(sid, campId).run();

    await audit('session-delete', sid, { campaignId: campId });
    return json({ success: true });
  }

  // POST /api/c/:id/sessions/:sid/rsvp — submit RSVP (Player or DM; Spectators blocked with 403)
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/rsvp$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const sid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);

    if (!canUserRsvp(myRole as any) && actor.role !== 'dm') {
      return error('تماشاچیان یا کاربران بدون عضویت مجاز به ثبت حضور نیستند.', 403);
    }

    const s = await env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND campaign_id = ?').bind(sid, campId).first();
    if (!s) return error('جلسه مورد نظر یافت نشد.', 404);
    if (s.status === 'cancelled') return error('جلسه لغو شده است.', 400);

    const body = await request.json() as any;
    const rsvpStatus = body.status as SessionRsvpChoice;
    if (!['yes', 'no', 'maybe'].includes(rsvpStatus)) {
      return error('وضعیت حضور نامعتبر است (باید yes، no یا maybe باشد).', 400);
    }
    const note = body.note ? String(body.note).trim() : null;

    await env.DB.prepare(
      `INSERT INTO session_rsvps (session_id, user_id, status, note, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(session_id, user_id) DO UPDATE SET
         status = excluded.status,
         note = excluded.note,
         updated_at = excluded.updated_at`
    ).bind(sid, actor.id, rsvpStatus, note, now).run();

    await audit('session-rsvp', sid, { status: rsvpStatus, note });
    return json({
      sessionId: sid,
      userId: actor.id,
      status: rsvpStatus,
      note: note || undefined,
      updatedAt: now
    });
  }

  // POST /api/c/:id/sessions/:sid/poll/vote — cast vote in date poll (Spectators blocked with 403)
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/poll\/vote$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const sid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);

    if (!canUserVote(myRole as any) && actor.role !== 'dm') {
      return error('تماشاچیان یا کاربران بدون عضویت مجاز به رأی‌دهی در نظرسنجی نیستند.', 403);
    }

    const poll = await env.DB.prepare('SELECT * FROM session_polls WHERE session_id = ?').bind(sid).first();
    if (!poll) return error('نظرسنجی تاریخی برای این جلسه وجود ندارد.', 404);
    if (poll.status !== 'open') return error('این نظرسنجی بسته شده است.', 400);

    const body = await request.json() as any;
    const optionId = String(body.optionId || '');
    const choice = body.choice as SessionRsvpChoice;
    if (!['yes', 'maybe', 'no'].includes(choice)) {
      return error('گزینه رأی نامعتبر است.', 400);
    }

    const options = parseBlob(poll.options, []);
    if (!options.some((o: any) => o.id === optionId)) {
      return error('گزینه مورد نظر در نظرسنجی یافت نشد.', 400);
    }

    await env.DB.prepare(
      `INSERT INTO session_poll_votes (poll_id, option_id, user_id, choice)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(poll_id, option_id, user_id) DO UPDATE SET
         choice = excluded.choice`
    ).bind(poll.id, optionId, actor.id, choice).run();

    await audit('session-poll-vote', poll.id, { optionId, choice });
    const full = await loadFullSession(campId, sid, myRole);
    return json(full?.poll || { success: true });
  }

  // POST /api/c/:id/sessions/:sid/poll/confirm — DM confirms a poll option, setting scheduled_at
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/poll\/confirm$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const sid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('فقط دانجن مستر مجاز به نهایی‌سازی تاریخ جلسه است.', 403);

    const poll = await env.DB.prepare('SELECT * FROM session_polls WHERE session_id = ?').bind(sid).first();
    if (!poll) return error('نظرسنجی یافت نشد.', 404);

    const body = await request.json() as any;
    const optionId = String(body.optionId || '');
    const options = parseBlob(poll.options, []);
    const chosen = options.find((o: any) => o.id === optionId);
    if (!chosen) return error('گزینه تاریخ انتخاب‌شده یافت نشد.', 404);

    await env.DB.prepare(
      `UPDATE sessions SET
        scheduled_at = ?,
        status = 'confirmed',
        updated_at = ?
       WHERE id = ? AND campaign_id = ?`
    ).bind(chosen.startsAt, now, sid, campId).run();

    await env.DB.prepare("UPDATE session_polls SET status = 'closed' WHERE id = ?").bind(poll.id).run();

    await audit('session-poll-confirm', sid, { optionId, startsAt: chosen.startsAt });
    const updated = await loadFullSession(campId, sid, 'owner');
    return json(updated);
  }

  // POST /api/c/:id/sessions/:sid/attendance — DM records session attendance, increments sessions_attended, writes history event
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/attendance$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const sid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('فقط دانجن مستر مجاز به ثبت حضور و غیاب است.', 403);

    const s = await env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND campaign_id = ?').bind(sid, campId).first();
    if (!s) return error('جلسه یافت نشد.', 404);

    const body = await request.json() as any;
    const attendanceList = (body.attendance || []) as Array<{ participationId: string; attended: boolean }>;

    // 1. Mark session as done
    await env.DB.prepare("UPDATE sessions SET status = 'done', updated_at = ? WHERE id = ? AND campaign_id = ?")
      .bind(now, sid, campId).run();

    // 2. Process attendance records
    for (const item of attendanceList) {
      if (!item.participationId) continue;
      const attendedInt = item.attended ? 1 : 0;

      await env.DB.prepare(
        `INSERT INTO session_attendance (session_id, participation_id, attended)
         VALUES (?, ?, ?)
         ON CONFLICT(session_id, participation_id) DO UPDATE SET
           attended = excluded.attended`
      ).bind(sid, item.participationId, attendedInt).run();

      if (item.attended) {
        // Increment sessions_attended
        await env.DB.prepare(
          'UPDATE character_participations SET sessions_attended = COALESCE(sessions_attended, 0) + 1 WHERE id = ?'
        ).bind(item.participationId).run();

        // Write character history event: "حضور در جلسه N"
        const part = await env.DB.prepare('SELECT character_id FROM character_participations WHERE id = ?')
          .bind(item.participationId).first();

        if (part?.character_id) {
          const hist = buildAttendanceHistoryEvent(Number(s.number), s.title, sid, campId);
          await env.DB.prepare(
            `INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            hist.id,
            part.character_id,
            campId,
            hist.eventType,
            JSON.stringify(hist.payload),
            now
          ).run();
        }
      }
    }

    await audit('session-attendance', sid, { campaignId: campId, count: attendanceList.length });
    const updated = await loadFullSession(campId, sid, 'owner');
    return json({ success: true, session: updated });
  }

  // -------------------------------------------------------------
  // Step 4.2: Session Recaps & Highlights
  // -------------------------------------------------------------
  const mapRecapRow = (r: any): SessionRecap => ({
    id: r.id,
    sessionId: r.session_id,
    campaignId: r.campaign_id,
    authorId: r.author_id,
    authorName: r.author_name || 'کاربر',
    sessionNumber: r.session_number !== null ? Number(r.session_number) : undefined,
    sessionTitle: r.session_title || undefined,
    title: r.title,
    body: r.body,
    visibility: r.visibility,
    status: r.status,
    linkedNpcIds: parseBlob(r.linked_npcs, []),
    linkedLocationIds: parseBlob(r.linked_locations, []),
    linkedQuestIds: parseBlob(r.linked_quests, []),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at)
  });

  // GET /api/c/:id/recaps — list recaps for campaign
  if (path.match(/^\/c\/[^/]+\/recaps$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);
    const isDm = actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';

    const urlObj = new URL(request.url);
    const sessionIdParam = urlObj.searchParams.get('sessionId');
    const searchParam = urlObj.searchParams.get('search');

    let query = `
      SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
      FROM session_recaps r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN sessions s ON r.session_id = s.id
      WHERE r.campaign_id = ?
    `;
    const params: any[] = [campId];

    if (!isDm) {
      query += ` AND ( (r.status = 'published' AND r.visibility = 'party') OR r.author_id = ? )`;
      params.push(actor.id);
    }
    if (sessionIdParam) {
      query += ` AND r.session_id = ?`;
      params.push(sessionIdParam);
    }
    if (searchParam && searchParam.trim()) {
      query += ` AND (r.title LIKE ? OR r.body LIKE ?)`;
      params.push(`%${searchParam.trim()}%`, `%${searchParam.trim()}%`);
    }

    query += ` ORDER BY r.created_at DESC`;
    const res = await env.DB.prepare(query).bind(...params).all();
    const list = (res.results || []).map(mapRecapRow);
    return json(list);
  }

  // GET /api/c/:id/recaps/latest — latest published party recap
  if (path.match(/^\/c\/[^/]+\/recaps\/latest$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);
    const isDm = actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';

    let query = `
      SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
      FROM session_recaps r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN sessions s ON r.session_id = s.id
      WHERE r.campaign_id = ?
    `;
    const params: any[] = [campId];
    if (!isDm) {
      query += ` AND r.status = 'published' AND r.visibility = 'party'`;
    }
    query += ` ORDER BY r.created_at DESC LIMIT 1`;

    const row = await env.DB.prepare(query).bind(...params).first();
    return json(row ? mapRecapRow(row) : null);
  }

  // POST /api/c/:id/recaps — create recap
  if (path.match(/^\/c\/[^/]+\/recaps$/) && method === 'POST') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);

    const campRow = await env.DB.prepare('SELECT settings FROM campaigns WHERE id = ?').bind(campId).first();
    const campSettings = parseBlob(campRow?.settings, {});
    const isDmGlobal = actor.role === 'dm';
    const effectiveRole = isDmGlobal ? 'owner' : (myRole || 'player');

    if (!canUserCreateRecap(effectiveRole as any, campSettings.allowPlayerRecaps)) {
      return error('شما دسترسی لازم برای نگارش خلاصه جلسه را ندارید.', 403);
    }

    const body = await request.json() as any;
    const val = validateRecapPayload({ title: body.title, body: body.body });
    if (!val.valid) return error(val.error || 'اطلاعات نامعتبر است.', 400);

    const recapId = `recap-${Date.now()}-${generateRandomToken(4)}`;
    const sessionId = body.sessionId ? String(body.sessionId) : '';
    const title = String(body.title).trim();
    const recapBody = String(body.body).trim();
    const visibility = body.visibility === 'dm_only' ? 'dm_only' : 'party';
    const status = body.status === 'draft' ? 'draft' : 'published';
    const linkedNpcs = JSON.stringify(body.linkedNpcIds || []);
    const linkedLocs = JSON.stringify(body.linkedLocationIds || []);
    const linkedQuests = JSON.stringify(body.linkedQuestIds || []);

    await env.DB.prepare(
      `INSERT INTO session_recaps (
        id, session_id, campaign_id, author_id, title, body, visibility,
        status, linked_npcs, linked_locations, linked_quests, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      recapId, sessionId, campId, actor.id, title, recapBody, visibility,
      status, linkedNpcs, linkedLocs, linkedQuests, now, now
    ).run();

    await audit('recap-create', recapId, { campaignId: campId, sessionId, title });
    const row = await env.DB.prepare(`
      SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
      FROM session_recaps r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN sessions s ON r.session_id = s.id
      WHERE r.id = ?
    `).bind(recapId).first();
    return json(mapRecapRow(row), 201);
  }

  // PATCH /api/c/:id/recaps/:recapId — edit recap
  if (path.match(/^\/c\/[^/]+\/recaps\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const campId = parts[2];
    const recapId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);

    const existing = await env.DB.prepare('SELECT * FROM session_recaps WHERE id = ? AND campaign_id = ?').bind(recapId, campId).first();
    if (!existing) return error('خلاصه جلسه یافت نشد.', 404);

    const isDmGlobal = actor.role === 'dm';
    const effectiveRole = isDmGlobal ? 'owner' : (myRole || 'player');
    if (!canUserEditRecap({ authorId: existing.author_id } as any, effectiveRole as any, actor.id)) {
      return error('شما دسترسی لازم برای ویرایش این خلاصه را ندارید.', 403);
    }

    const body = await request.json() as any;
    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    const recapBody = body.body !== undefined ? String(body.body).trim() : existing.body;
    const visibility = body.visibility !== undefined && ['party', 'dm_only'].includes(body.visibility) ? body.visibility : existing.visibility;
    const status = body.status !== undefined && ['draft', 'published'].includes(body.status) ? body.status : existing.status;
    const linkedNpcs = body.linkedNpcIds !== undefined ? JSON.stringify(body.linkedNpcIds) : existing.linked_npcs;
    const linkedLocs = body.linkedLocationIds !== undefined ? JSON.stringify(body.linkedLocationIds) : existing.linked_locations;
    const linkedQuests = body.linkedQuestIds !== undefined ? JSON.stringify(body.linkedQuestIds) : existing.linked_quests;

    await env.DB.prepare(
      `UPDATE session_recaps SET
        title = ?, body = ?, visibility = ?, status = ?,
        linked_npcs = ?, linked_locations = ?, linked_quests = ?, updated_at = ?
       WHERE id = ? AND campaign_id = ?`
    ).bind(
      title, recapBody, visibility, status,
      linkedNpcs, linkedLocs, linkedQuests, now,
      recapId, campId
    ).run();

    await audit('recap-update', recapId, { campaignId: campId });
    const row = await env.DB.prepare(`
      SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
      FROM session_recaps r
      LEFT JOIN users u ON r.author_id = u.id
      LEFT JOIN sessions s ON r.session_id = s.id
      WHERE r.id = ?
    `).bind(recapId).first();
    return json(mapRecapRow(row));
  }

  // DELETE /api/c/:id/recaps/:recapId — delete recap
  if (path.match(/^\/c\/[^/]+\/recaps\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const campId = parts[2];
    const recapId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);

    const existing = await env.DB.prepare('SELECT author_id FROM session_recaps WHERE id = ? AND campaign_id = ?').bind(recapId, campId).first();
    if (!existing) return error('خلاصه جلسه یافت نشد.', 404);

    const isDmGlobal = actor.role === 'dm';
    const effectiveRole = isDmGlobal ? 'owner' : (myRole || 'player');
    if (!canUserEditRecap({ authorId: existing.author_id } as any, effectiveRole as any, actor.id)) {
      return error('شما دسترسی لازم برای حذف این خلاصه را ندارید.', 403);
    }

    await env.DB.prepare('DELETE FROM session_recaps WHERE id = ? AND campaign_id = ?').bind(recapId, campId).run();
    await audit('recap-delete', recapId, { campaignId: campId });
    return json({ success: true });
  }

  // GET /api/c/:id/highlights — list session highlights
  if (path.match(/^\/c\/[^/]+\/highlights$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);
    const isDm = actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';

    const urlObj = new URL(request.url);
    const sessionIdParam = urlObj.searchParams.get('sessionId');

    let query = `
      SELECT h.*, cp.character_name, u.display_name AS player_name
      FROM session_highlights h
      LEFT JOIN character_participations cp ON h.participation_id = cp.id
      LEFT JOIN characters c ON cp.character_id = c.id
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE h.campaign_id = ?
    `;
    const params: any[] = [campId];

    if (!isDm) {
      query += ` AND h.visible_to_player = 1`;
    }
    if (sessionIdParam) {
      query += ` AND h.session_id = ?`;
      params.push(sessionIdParam);
    }
    query += ` ORDER BY h.created_at ASC`;

    const res = await env.DB.prepare(query).bind(...params).all();
    const list = (res.results || []).map((r: any): SessionHighlight => ({
      id: r.id,
      sessionId: r.session_id,
      campaignId: r.campaign_id,
      participationId: r.participation_id,
      characterId: r.character_id,
      characterName: r.character_name,
      playerName: r.player_name,
      text: r.text,
      visibleToPlayer: Boolean(r.visible_to_player),
      createdAt: Number(r.created_at)
    }));
    return json(list);
  }

  // POST /api/c/:id/highlights — create a highlight (DM only)
  if (path.match(/^\/c\/[^/]+\/highlights$/) && method === 'POST') {
    const campId = path.split('/')[2];
    if (!(await requireCampaignDm(campId))) return error('فقط دانجن مستر مجاز به ثبت رویداد برجسته است.', 403);

    const body = await request.json() as any;
    const text = String(body.text || '').trim();
    if (!text) return error('متن رویداد برجسته نمی‌تواند خالی باشد.', 400);

    const hlId = `hl-${Date.now()}-${generateRandomToken(4)}`;
    const sessionId = body.sessionId ? String(body.sessionId) : '';
    const participationId = body.participationId ? String(body.participationId) : null;
    const characterId = body.characterId ? String(body.characterId) : null;
    const visibleToPlayer = body.visibleToPlayer === false || body.visibleToPlayer === 0 ? 0 : 1;

    await env.DB.prepare(
      `INSERT INTO session_highlights (
        id, session_id, campaign_id, participation_id, character_id, text, visible_to_player, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(hlId, sessionId, campId, participationId, characterId, text, visibleToPlayer, now).run();

    // Create milestone history event for character
    if (characterId) {
      const sess = await env.DB.prepare('SELECT number FROM sessions WHERE id = ?').bind(sessionId).first();
      const hist = buildHighlightHistoryEvent({
        id: hlId,
        sessionId,
        campaignId: campId,
        characterId,
        text,
        visibleToPlayer,
        createdAt: now
      }, sess?.number ? Number(sess.number) : undefined);

      await env.DB.prepare(
        `INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        `hist-hl-${Date.now()}-${generateRandomToken(3)}`,
        characterId,
        campId,
        hist.eventType,
        JSON.stringify(hist.payload),
        now
      ).run();
    }

    await audit('highlight-create', hlId, { campaignId: campId, sessionId, text });
    return json({
      id: hlId,
      sessionId,
      campaignId: campId,
      participationId,
      characterId,
      text,
      visibleToPlayer: Boolean(visibleToPlayer),
      createdAt: now
    }, 201);
  }

  // DELETE /api/c/:id/highlights/:highlightId
  if (path.match(/^\/c\/[^/]+\/highlights\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const campId = parts[2];
    const highlightId = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    await env.DB.prepare('DELETE FROM session_highlights WHERE id = ? AND campaign_id = ?').bind(highlightId, campId).run();
    await audit('highlight-delete', highlightId, { campaignId: campId });
    return json({ success: true });
  }

  // POST /api/c/:id/sessions/:sid/close — closing sheet bundled action
  if (path.match(/^\/c\/[^/]+\/sessions\/[^/]+\/close$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const sid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const s = await env.DB.prepare('SELECT * FROM sessions WHERE id = ? AND campaign_id = ?').bind(sid, campId).first();
    if (!s) return error('جلسه یافت نشد.', 404);

    const body = await request.json() as any;

    // 1. Mark session done
    await env.DB.prepare("UPDATE sessions SET status = 'done', updated_at = ? WHERE id = ? AND campaign_id = ?")
      .bind(now, sid, campId).run();

    // 2. Insert recap if provided
    let createdRecap: any = null;
    if (body.recap && body.recap.title && body.recap.body) {
      const recapId = `recap-${Date.now()}-${generateRandomToken(4)}`;
      const title = String(body.recap.title).trim();
      const rBody = String(body.recap.body).trim();
      const visibility = body.recap.visibility === 'dm_only' ? 'dm_only' : 'party';
      const status = body.recap.status === 'draft' ? 'draft' : 'published';
      const linkedNpcs = JSON.stringify(body.recap.linkedNpcIds || []);
      const linkedLocs = JSON.stringify(body.recap.linkedLocationIds || []);
      const linkedQuests = JSON.stringify(body.recap.linkedQuestIds || []);

      await env.DB.prepare(
        `INSERT INTO session_recaps (
          id, session_id, campaign_id, author_id, title, body, visibility,
          status, linked_npcs, linked_locations, linked_quests, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(recapId, sid, campId, actor.id, title, rBody, visibility, status, linkedNpcs, linkedLocs, linkedQuests, now, now).run();

      const rRow = await env.DB.prepare(`
        SELECT r.*, u.display_name AS author_name, s.number AS session_number, s.title AS session_title
        FROM session_recaps r
        LEFT JOIN users u ON r.author_id = u.id
        LEFT JOIN sessions s ON r.session_id = s.id
        WHERE r.id = ?
      `).bind(recapId).first();
      createdRecap = mapRecapRow(rRow);
    }

    // 3. Award XP if provided
    if (body.xpAward && body.xpAward.amount > 0) {
      const amount = Number(body.xpAward.amount);
      if (body.xpAward.isPartyWide || !body.xpAward.participationId) {
        await env.DB.prepare(
          "UPDATE character_participations SET xp = COALESCE(xp, 0) + ?, updated_at = ? WHERE campaign_id = ? AND status = 'active'"
        ).bind(amount, now, campId).run();
      } else {
        await env.DB.prepare(
          'UPDATE character_participations SET xp = COALESCE(xp, 0) + ?, updated_at = ? WHERE id = ? AND campaign_id = ?'
        ).bind(amount, now, body.xpAward.participationId, campId).run();
      }
    }

    // 4. Milestone level-ups if provided
    if (body.milestoneLevelUps && Array.isArray(body.milestoneLevelUps) && body.milestoneLevelUps.length > 0) {
      for (const pId of body.milestoneLevelUps) {
        await env.DB.prepare(
          'UPDATE character_participations SET level_up_available = 1, updated_at = ? WHERE id = ? AND campaign_id = ?'
        ).bind(now, pId, campId).run();
      }
    }

    // 5. Highlights if provided
    const createdHighlights: any[] = [];
    if (body.highlights && Array.isArray(body.highlights) && body.highlights.length > 0) {
      for (const hl of body.highlights) {
        if (!hl.text || !hl.text.trim()) continue;
        const hlId = `hl-${Date.now()}-${generateRandomToken(4)}`;
        const pId = hl.participationId ? String(hl.participationId) : null;
        const cId = hl.characterId ? String(hl.characterId) : null;
        const vis = hl.visibleToPlayer === false ? 0 : 1;

        await env.DB.prepare(
          `INSERT INTO session_highlights (
            id, session_id, campaign_id, participation_id, character_id, text, visible_to_player, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(hlId, sid, campId, pId, cId, hl.text.trim(), vis, now).run();

        if (cId) {
          const hist = buildHighlightHistoryEvent({
            id: hlId,
            sessionId: sid,
            campaignId: campId,
            characterId: cId,
            text: hl.text.trim(),
            visibleToPlayer: vis,
            createdAt: now
          }, s.number ? Number(s.number) : undefined);

          await env.DB.prepare(
            `INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp)
             VALUES (?, ?, ?, ?, ?, ?)`
          ).bind(
            `hist-hl-${Date.now()}-${generateRandomToken(3)}`,
            cId,
            campId,
            hist.eventType,
            JSON.stringify(hist.payload),
            now
          ).run();
        }

        createdHighlights.push({
          id: hlId,
          sessionId: sid,
          campaignId: campId,
          participationId: pId,
          characterId: cId,
          text: hl.text.trim(),
          visibleToPlayer: Boolean(vis),
          createdAt: now
        });
      }
    }

    await audit('session-close', sid, { campaignId: campId });
    const updatedSession = await loadFullSession(campId, sid, 'owner');
    return json({
      session: updatedSession,
      recap: createdRecap,
      highlights: createdHighlights
    });
  }

  // ---------------------------------------------------------
  // Step 4.3: Handouts and Maps (Migration 006)
  // ---------------------------------------------------------

  // Helper to load pins and recipients for a handout list
  const populateHandoutExtras = async (handoutRows: any[], isDm: boolean, actorPartId?: string | null): Promise<Handout[]> => {
    if (!handoutRows || handoutRows.length === 0) return [];
    const handoutIds = handoutRows.map(h => h.id);

    // Load recipients
    const recipientsMap: Record<string, string[]> = {};
    for (const hId of handoutIds) {
      recipientsMap[hId] = [];
    }
    try {
      const qPlaceholders = handoutIds.map(() => '?').join(',');
      const recips = await env.DB.prepare(
        `SELECT handout_id, participation_id FROM handout_recipients WHERE handout_id IN (${qPlaceholders})`
      ).bind(...handoutIds).all();
      for (const r of (recips.results || [])) {
        if (!recipientsMap[r.handout_id]) recipientsMap[r.handout_id] = [];
        recipientsMap[r.handout_id].push(r.participation_id);
      }
    } catch {}

    // Load map pins
    const pinsMap: Record<string, MapPin[]> = {};
    for (const hId of handoutIds) {
      pinsMap[hId] = [];
    }
    try {
      const qPlaceholders = handoutIds.map(() => '?').join(',');
      const pinRows = await env.DB.prepare(
        `SELECT * FROM map_pins WHERE handout_id IN (${qPlaceholders})`
      ).bind(...handoutIds).all();
      for (const p of (pinRows.results || [])) {
        if (!pinsMap[p.handout_id]) pinsMap[p.handout_id] = [];
        pinsMap[p.handout_id].push({
          id: p.id,
          handoutId: p.handout_id,
          x: Number(p.x),
          y: Number(p.y),
          label: p.label,
          note: p.note,
          revealed: Number(p.revealed)
        });
      }
    } catch {}

    // Map rows to typed Handout objects (no base64 in list responses!)
    const items: Handout[] = handoutRows.map(h => ({
      id: h.id,
      campaignId: h.campaign_id,
      title: h.title,
      kind: h.kind,
      body: h.body || '',
      mediaId: h.media_id || null,
      mediaUrl: h.media_id ? `/api/media/${h.media_id}` : (h.media_url || null),
      visibility: h.visibility || 'hidden',
      revealedAt: h.revealed_at ? Number(h.revealed_at) : null,
      tags: parseBlob(h.tags, []),
      sortIndex: Number(h.sort_index || 0),
      createdBy: h.created_by,
      createdByName: h.created_by_name || 'دانجن مستر',
      createdAt: Number(h.created_at),
      updatedAt: Number(h.updated_at),
      recipients: recipientsMap[h.id] || [],
      pins: pinsMap[h.id] || []
    }));

    return filterHandoutsForPlayer(items, actorPartId, isDm);
  };

  // GET /api/c/:id/handouts — List revealed handouts for players or all for DM
  if (path.match(/^\/c\/[^/]+\/handouts$/) && method === 'GET') {
    const campId = path.split('/')[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);
    const isDm = actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';

    let actorPartId: string | null = null;
    if (!isDm) {
      const partRow = await env.DB.prepare(`
        SELECT cp.id FROM character_participations cp
        JOIN characters c ON cp.character_id = c.id
        WHERE cp.campaign_id = ? AND c.owner_id = ? AND cp.status = 'active'
        LIMIT 1
      `).bind(campId, actor.id).first();
      actorPartId = partRow?.id || null;
    }

    const rows = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.campaign_id = ?
      ORDER BY h.sort_index ASC, h.created_at DESC
    `).bind(campId).all();

    const handouts = await populateHandoutExtras(rows.results || [], isDm, actorPartId);
    return json(handouts);
  }

  // GET /api/c/:id/handouts/:hid — Get single handout
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+$/) && method === 'GET') {
    const parts = path.split('/');
    const campId = parts[2];
    const hid = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== 'dm') return error('دسترسی مجاز نیست.', 404);
    const isDm = actor.role === 'dm' || myRole === 'owner' || myRole === 'co_dm';

    let actorPartId: string | null = null;
    if (!isDm) {
      const partRow = await env.DB.prepare(`
        SELECT cp.id FROM character_participations cp
        JOIN characters c ON cp.character_id = c.id
        WHERE cp.campaign_id = ? AND c.owner_id = ? AND cp.status = 'active'
        LIMIT 1
      `).bind(campId, actor.id).first();
      actorPartId = partRow?.id || null;
    }

    const row = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.id = ? AND h.campaign_id = ?
    `).bind(hid, campId).first();
    if (!row) return error('سند یافت نشد.', 404);

    const list = await populateHandoutExtras([row], isDm, actorPartId);
    if (list.length === 0) return error('سند یافت نشد یا دسترسی مجاز نیست.', 404);
    return json(list[0]);
  }

  // POST /api/c/:id/handouts — Create handout (DM only)
  if (path.match(/^\/c\/[^/]+\/handouts$/) && method === 'POST') {
    const campId = path.split('/')[2];
    if (!(await requireCampaignDm(campId))) return error('فقط دانجن مستر مجاز به ایجاد اسناد است.', 403);

    const body = await request.json() as any;
    const val = validateHandoutPayload(body);
    if (!val.valid) return error(val.error || 'اطلاعات نامعتبر است.', 400);

    const hId = `handout-${Date.now()}-${generateRandomToken(4)}`;
    const title = String(body.title).trim();
    const kind = body.kind || 'text';
    const hBody = body.body ? String(body.body).trim() : null;
    const mediaId = body.mediaId ? String(body.mediaId) : null;
    const visibility = body.visibility || 'hidden';
    const revealedAt = (visibility === 'revealed' || visibility === 'selected') ? now : null;
    const tags = JSON.stringify(Array.isArray(body.tags) ? body.tags : []);
    const sortIndex = Number(body.sortIndex || 0);

    await env.DB.prepare(
      `INSERT INTO handouts (
        id, campaign_id, title, kind, body, media_id, visibility,
        revealed_at, tags, sort_index, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      hId, campId, title, kind, hBody, mediaId, visibility,
      revealedAt, tags, sortIndex, actor.id, now, now
    ).run();

    // Insert recipients if selected
    if (visibility === 'selected' && Array.isArray(body.recipients)) {
      for (const pId of body.recipients) {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO handout_recipients (handout_id, participation_id) VALUES (?, ?)'
        ).bind(hId, pId).run();
      }
    }

    // Insert pins if map
    if (kind === 'map' && Array.isArray(body.pins)) {
      for (const p of body.pins) {
        const pinId = `pin-${Date.now()}-${generateRandomToken(3)}`;
        const coords = clampCoordinates(Number(p.x || 0), Number(p.y || 0));
        await env.DB.prepare(
          'INSERT INTO map_pins (id, handout_id, x, y, label, note, revealed) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(pinId, hId, coords.x, coords.y, String(p.label || 'نشانگر'), p.note ? String(p.note) : null, p.revealed === false ? 0 : 1).run();
      }
    }

    if (visibility !== 'hidden') {
      await audit('handout-reveal', hId, { campaignId: campId, title, visibility });
    } else {
      await audit('handout-create', hId, { campaignId: campId, title, kind });
    }

    const createdRow = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.id = ?
    `).bind(hId).first();

    const list = await populateHandoutExtras([createdRow], true);
    return json(list[0], 201);
  }

  // PATCH /api/c/:id/handouts/:hid — Update handout (DM only)
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const campId = parts[2];
    const hid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const existing = await env.DB.prepare('SELECT * FROM handouts WHERE id = ? AND campaign_id = ?').bind(hid, campId).first();
    if (!existing) return error('سند یافت نشد.', 404);

    const body = await request.json() as any;
    const title = body.title !== undefined ? String(body.title).trim() : existing.title;
    const hBody = body.body !== undefined ? String(body.body).trim() : existing.body;
    const mediaId = body.mediaId !== undefined ? (body.mediaId ? String(body.mediaId) : null) : existing.media_id;
    const visibility = body.visibility !== undefined ? body.visibility : existing.visibility;
    const sortIndex = body.sortIndex !== undefined ? Number(body.sortIndex) : existing.sort_index;
    const tags = body.tags !== undefined ? JSON.stringify(body.tags) : existing.tags;

    let revealedAt = existing.revealed_at;
    if (visibility !== existing.visibility && (visibility === 'revealed' || visibility === 'selected')) {
      revealedAt = now;
      await audit('handout-reveal', hid, { campaignId: campId, title, visibility });
    }

    await env.DB.prepare(`
      UPDATE handouts SET
        title = ?, body = ?, media_id = ?, visibility = ?,
        revealed_at = ?, tags = ?, sort_index = ?, updated_at = ?
      WHERE id = ? AND campaign_id = ?
    `).bind(
      title, hBody, mediaId, visibility,
      revealedAt, tags, sortIndex, now,
      hid, campId
    ).run();

    // Replace recipients if provided
    if (body.recipients !== undefined && Array.isArray(body.recipients)) {
      await env.DB.prepare('DELETE FROM handout_recipients WHERE handout_id = ?').bind(hid).run();
      for (const pId of body.recipients) {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO handout_recipients (handout_id, participation_id) VALUES (?, ?)'
        ).bind(hid, pId).run();
      }
    }

    // Replace pins if provided
    if (body.pins !== undefined && Array.isArray(body.pins)) {
      await env.DB.prepare('DELETE FROM map_pins WHERE handout_id = ?').bind(hid).run();
      for (const p of body.pins) {
        const pinId = p.id || `pin-${Date.now()}-${generateRandomToken(3)}`;
        const coords = clampCoordinates(Number(p.x || 0), Number(p.y || 0));
        await env.DB.prepare(
          'INSERT INTO map_pins (id, handout_id, x, y, label, note, revealed) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(pinId, hid, coords.x, coords.y, String(p.label || 'نشانگر'), p.note ? String(p.note) : null, p.revealed === false ? 0 : 1).run();
      }
    }

    await audit('handout-update', hid, { campaignId: campId, title });
    const updatedRow = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.id = ?
    `).bind(hid).first();

    const list = await populateHandoutExtras([updatedRow], true);
    return json(list[0]);
  }

  // DELETE /api/c/:id/handouts/:hid — Delete handout (DM only)
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const campId = parts[2];
    const hid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    await env.DB.prepare('DELETE FROM handouts WHERE id = ? AND campaign_id = ?').bind(hid, campId).run();
    await audit('handout-delete', hid, { campaignId: campId });
    return json({ success: true });
  }

  // POST /api/c/:id/handouts/:hid/reveal — 1-Tap Reveal / Hide (DM only, usable during live encounter)
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+\/reveal$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const hid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const existing = await env.DB.prepare('SELECT * FROM handouts WHERE id = ? AND campaign_id = ?').bind(hid, campId).first();
    if (!existing) return error('سند یافت نشد.', 404);

    const body = await request.json() as any;
    const mode = body.visibility as 'revealed' | 'hidden' | 'selected';
    if (!['revealed', 'hidden', 'selected'].includes(mode)) {
      return error('وضعیت نامعتبر است.', 400);
    }

    const revealedAt = mode !== 'hidden' ? now : existing.revealed_at;
    await env.DB.prepare(
      'UPDATE handouts SET visibility = ?, revealed_at = ?, updated_at = ? WHERE id = ? AND campaign_id = ?'
    ).bind(mode, revealedAt, now, hid, campId).run();

    if (mode === 'selected' && Array.isArray(body.recipients)) {
      await env.DB.prepare('DELETE FROM handout_recipients WHERE handout_id = ?').bind(hid).run();
      for (const pId of body.recipients) {
        await env.DB.prepare(
          'INSERT OR IGNORE INTO handout_recipients (handout_id, participation_id) VALUES (?, ?)'
        ).bind(hid, pId).run();
      }
    }

    await audit('handout-reveal', hid, { campaignId: campId, title: existing.title, visibility: mode });
    const updatedRow = await env.DB.prepare(`
      SELECT h.*, u.display_name AS created_by_name
      FROM handouts h
      LEFT JOIN users u ON h.created_by = u.id
      WHERE h.id = ?
    `).bind(hid).first();

    const list = await populateHandoutExtras([updatedRow], true);
    return json(list[0]);
  }

  // POST /api/c/:id/handouts/:hid/pins — Add map pin (DM only)
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+\/pins$/) && method === 'POST') {
    const parts = path.split('/');
    const campId = parts[2];
    const hid = parts[4];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const body = await request.json() as any;
    const pinId = `pin-${Date.now()}-${generateRandomToken(3)}`;
    const coords = clampCoordinates(Number(body.x || 0), Number(body.y || 0));
    const label = String(body.label || 'نشانگر جدید').trim();
    const note = body.note ? String(body.note).trim() : null;
    const revealed = body.revealed === false || body.revealed === 0 ? 0 : 1;

    await env.DB.prepare(
      'INSERT INTO map_pins (id, handout_id, x, y, label, note, revealed) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(pinId, hid, coords.x, coords.y, label, note, revealed).run();

    return json({
      id: pinId,
      handoutId: hid,
      x: coords.x,
      y: coords.y,
      label,
      note,
      revealed
    }, 201);
  }

  // PATCH /api/c/:id/handouts/:hid/pins/:pid — Update map pin (DM only)
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+\/pins\/[^/]+$/) && method === 'PATCH') {
    const parts = path.split('/');
    const campId = parts[2];
    const hid = parts[4];
    const pid = parts[6];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    const existing = await env.DB.prepare('SELECT * FROM map_pins WHERE id = ? AND handout_id = ?').bind(pid, hid).first();
    if (!existing) return error('نشانگر یافت نشد.', 404);

    const body = await request.json() as any;
    const x = body.x !== undefined ? clampCoordinates(Number(body.x), Number(existing.y)).x : existing.x;
    const y = body.y !== undefined ? clampCoordinates(Number(existing.x), Number(body.y)).y : existing.y;
    const label = body.label !== undefined ? String(body.label).trim() : existing.label;
    const note = body.note !== undefined ? String(body.note).trim() : existing.note;
    const revealed = body.revealed !== undefined ? (body.revealed === false || body.revealed === 0 ? 0 : 1) : existing.revealed;

    await env.DB.prepare(
      'UPDATE map_pins SET x = ?, y = ?, label = ?, note = ?, revealed = ? WHERE id = ? AND handout_id = ?'
    ).bind(x, y, label, note, revealed, pid, hid).run();

    return json({
      id: pid,
      handoutId: hid,
      x,
      y,
      label,
      note,
      revealed
    });
  }

  // DELETE /api/c/:id/handouts/:hid/pins/:pid — Delete map pin (DM only)
  if (path.match(/^\/c\/[^/]+\/handouts\/[^/]+\/pins\/[^/]+$/) && method === 'DELETE') {
    const parts = path.split('/');
    const campId = parts[2];
    const hid = parts[4];
    const pid = parts[6];
    if (!(await requireCampaignDm(campId))) return error('دسترسی مجاز نیست.', 403);

    await env.DB.prepare('DELETE FROM map_pins WHERE id = ? AND handout_id = ?').bind(pid, hid).run();
    return json({ success: true });
  }

  // 404 Fallback
  return error(`مسیری با مشخصات ${method} ${path} یافت نشد.`, 404);
};


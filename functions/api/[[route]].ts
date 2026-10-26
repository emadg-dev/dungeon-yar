/**
 * Cloudflare Pages Functions Backend for Zorvania TTRPG
 * Complete Account & User System with PBKDF2 WebCrypto, session tokens,
 * D1 database storage, CSRF protection, rate limiting, and RBAC authorization.
 */

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
       FROM sessions s
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
          'UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?'
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
        `INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
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
        `INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
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
      await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ?').bind(now, currentSession.id).run();
      await audit('logout', currentUser?.id);
    }
    return json({ message: 'با موفقیت خارج شدید.' }, 200, { 'Set-Cookie': clearSessionCookie() });
  }

  // POST /api/auth/logout-all
  if (path === '/auth/logout-all' && method === 'POST') {
    if (!currentUser) return error('ابتدا وارد شوید.', 401);
    await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ?').bind(now, currentUser.id).run();
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
      await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ?').bind(now, targetUser.id).run();

      // Create new session
      const rawToken = generateRandomToken(32);
      const newSessionTokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;

      await env.DB.prepare(
        `INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
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
      await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND id != ?').bind(now, currentUser.id, currentSession.id).run();
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
      'SELECT id, user_id, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash FROM sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC'
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
      'UPDATE sessions SET revoked_at = ? WHERE id = ? AND user_id = ?'
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
      'SELECT user_id, COUNT(*) as c FROM sessions WHERE revoked_at IS NULL AND expires_at > ? GROUP BY user_id'
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
      await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ?').bind(now, targetUserId).run();
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
    await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ?').bind(now, targetUserId).run();
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
    await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ?').bind(now, targetUserId).run();
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
      'INSERT INTO npcs (id, name, type, is_revealed, location_tag, session_tag, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, newNpc.name, newNpc.type, newNpc.isRevealed ? 1 : 0, newNpc.locationTag || '', newNpc.sessionTag || '', JSON.stringify(newNpc), now).run();
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
      'INSERT INTO items (id, name, category, is_revealed, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, newItem.name, newItem.category, newItem.isRevealed ? 1 : 0, JSON.stringify(newItem), now).run();
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
      `INSERT INTO locations (id, name, region, description, image_url, dm_notes, revealed, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, locName, region, desc, imgUrl, dmNotes, revealed, parentId, t, t).run();

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
         id, name, location_id, status, round, current_participant_id, session_tag,
         settings, version, dm_notes, started_at, ended_at, created_by, created_at, updated_at
       ) VALUES (?, ?, ?, 'draft', 0, NULL, ?, ?, 1, ?, NULL, NULL, ?, ?, ?)`
    ).bind(id, encName, locationId, sessionTag, settings, dmNotes, currentUser?.id || null, t, t).run();

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

  // 404 Fallback
  return error(`مسیری با مشخصات ${method} ${path} یافت نشد.`, 404);
};

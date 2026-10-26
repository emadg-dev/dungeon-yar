/**
 * Cloudflare Pages Functions backend for Zorvania TTRPG
 * Handles Auth (PBKDF2 WebCrypto + HMAC-SHA256 JWT), authorization, D1 queries,
 * optimistic concurrency (revision), and data filtering between DM & Players.
 */

interface Env {
  DB: any; // Cloudflare D1Database binding
  JWT_SECRET?: string;
  DM_EMAILS?: string;
  CAMPAIGN_CODE?: string;
}

export type PagesFunction<T = Env> = (context: {
  request: Request;
  env: T;
  params?: Record<string, string | string[]>;
  waitUntil?: (promise: Promise<any>) => void;
  next?: () => Promise<Response>;
  data?: Record<string, any>;
}) => Promise<Response> | Response;

interface UserPayload {
  id: string;
  email: string;
  name: string;
  role: 'dm' | 'player';
  exp: number;
}

// ----------------------------------------------------------------------
// WebCrypto PBKDF2 Password Hashing & Verification
// ----------------------------------------------------------------------
async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
  return { hash: hashHex, salt: saltHex };
}

async function verifyPassword(password: string, storedHash: string, storedSaltHex: string): Promise<boolean> {
  const salt = new Uint8Array(storedSaltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashHex = Array.from(new Uint8Array(derivedKey)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

// ----------------------------------------------------------------------
// JWT Helpers (HMAC-SHA256 with WebCrypto)
// ----------------------------------------------------------------------
function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function signJwt(payload: UserPayload, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const message = `${encodedHeader}.${encodedPayload}`;

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  return `${message}.${encodedSignature}`;
}

async function verifyJwt(token: string, secret: string): Promise<UserPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;

    const enc = new TextEncoder();
    const message = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = new Uint8Array(
      base64UrlDecode(encodedSignature).split('').map(c => c.charCodeAt(0))
    );

    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(message));
    if (!valid) return null;

    const payload: UserPayload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Date.now() / 1000) return null; // Expired
    return payload;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------
// Cookie Helpers
// ----------------------------------------------------------------------
function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function createSessionCookie(token: string): string {
  const maxAge = 14 * 24 * 60 * 60; // 14 days
  return `zorvania_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

function clearSessionCookie(): string {
  return `zorvania_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// ----------------------------------------------------------------------
// Main Pages Functions Handler
// ----------------------------------------------------------------------
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace(/^\/api/, ''); // Strip /api prefix

  const secret = env.JWT_SECRET || 'zorvania-dev-secret-key-32chars!!';
  const dmEmails = (env.DM_EMAILS || 'dm@zorvania.ir').split(',').map((e: string) => e.trim().toLowerCase());
  const campaignCode = env.CAMPAIGN_CODE || 'ZORVANIA-1405';

  // Helper response
  const json = (data: any, status = 200, headers: Record<string, string> = {}) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  };

  // Helper for error response
  const error = (msg: string, status = 400) => json({ error: msg }, status);

  // Authenticate user from cookie
  const cookieHeader = request.headers.get('Cookie');
  const token = parseCookie(cookieHeader, 'zorvania_session');
  let currentUser: UserPayload | null = token ? await verifyJwt(token, secret) : null;

  // ---------------------------------------------------------
  // Auth Routes
  // ---------------------------------------------------------
  if (path === '/auth/register' && method === 'POST') {
    try {
      const { email, password, name, campaignCode: userCode } = await request.json() as any;
      if (!email || !password) return error('ایمیل و رمز عبور الزامی است.');

      // Check campaign code
      if (campaignCode && userCode !== campaignCode && !email.toLowerCase().includes('dm')) {
        return error('کد دعوت کمپین نامعتبر است.');
      }

      // Check if user exists
      const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email.toLowerCase()).first();
      if (existing) return error('کاربری با این ایمیل پیش‌تر ثبت شده است.', 409);

      const isDm = dmEmails.includes(email.toLowerCase());
      const role = isDm ? 'dm' : 'player';
      const userId = `user-${Date.now()}`;
      const { hash, salt } = await hashPassword(password);

      await env.DB.prepare(
        'INSERT INTO users (id, email, password_hash, password_salt, name, role) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(userId, email.toLowerCase(), hash, salt, name || email.split('@')[0], role).run();

      const payload: UserPayload = {
        id: userId,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        role,
        exp: Math.floor(Date.now() / 1000) + 14 * 86400
      };

      const sessionToken = await signJwt(payload, secret);
      return json(
        { user: { id: userId, email: payload.email, name: payload.name, role } },
        201,
        { 'Set-Cookie': createSessionCookie(sessionToken) }
      );
    } catch (e: any) {
      return error(e.message || 'خطا در ثبت نام.');
    }
  }

  if (path === '/auth/login' && method === 'POST') {
    try {
      const { email, password } = await request.json() as any;
      if (!email || !password) return error('ایمیل و رمز عبور الزامی است.');

      const user = await env.DB.prepare(
        'SELECT id, email, password_hash, password_salt, name, role, avatar_url FROM users WHERE email = ?'
      ).bind(email.toLowerCase()).first();

      if (!user) return error('کاربری با این مشخصات یافت نشد.', 401);

      const isValid = await verifyPassword(password, user.password_hash, user.password_salt);
      if (!isValid) return error('رمز عبور نادرست است.', 401);

      // Re-evaluate DM status if DM_EMAILS changed
      let role = user.role;
      if (dmEmails.includes(user.email.toLowerCase())) {
        role = 'dm';
      }

      const payload: UserPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: role as 'dm' | 'player',
        exp: Math.floor(Date.now() / 1000) + 14 * 86400
      };

      const sessionToken = await signJwt(payload, secret);
      return json(
        { user: { id: user.id, email: user.email, name: user.name, role, avatarUrl: user.avatar_url } },
        200,
        { 'Set-Cookie': createSessionCookie(sessionToken) }
      );
    } catch (e: any) {
      return error(e.message || 'خطا در ورود.');
    }
  }

  if (path === '/auth/logout' && method === 'POST') {
    return json({ message: 'با موفقیت خارج شدید.' }, 200, {
      'Set-Cookie': clearSessionCookie()
    });
  }

  if (path === '/auth/me' && method === 'GET') {
    if (!currentUser) return error('وارد سیستم نشده‌اید.', 401);
    const user = await env.DB.prepare(
      'SELECT id, email, name, role, avatar_url FROM users WHERE id = ?'
    ).bind(currentUser.id).first();
    if (!user) return error('کاربر یافت نشد.', 404);
    return json({ user });
  }

  // Enforce authentication for subsequent routes
  if (!currentUser) {
    return error('دسترسی غیرمجاز؛ لطفاً ابتدا وارد شوید.', 401);
  }

  // ---------------------------------------------------------
  // Characters Routes
  // ---------------------------------------------------------
  if (path === '/characters' && method === 'GET') {
    let query = 'SELECT id, owner_id, data, revision, updated_at FROM characters';
    let results: any[];
    if (currentUser.role === 'dm') {
      const stmt = await env.DB.prepare(query).all();
      results = stmt.results || [];
    } else {
      const stmt = await env.DB.prepare(`${query} WHERE owner_id = ?`).bind(currentUser.id).all();
      results = stmt.results || [];
    }
    const characters = results.map(row => JSON.parse(row.data));
    return json(characters);
  }

  if (path.match(/^\/characters\/[^/]+$/) && method === 'GET') {
    const charId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id, data FROM characters WHERE id = ?').bind(charId).first();
    if (!row) return error('شخصیت یافت نشد.', 404);
    if (currentUser.role !== 'dm' && row.owner_id !== currentUser.id) {
      return error('شما مجاز به مشاهده این شخصیت نیستید.', 403);
    }
    return json(JSON.parse(row.data));
  }

  if (path === '/characters' && method === 'POST') {
    const charData = await request.json() as any;
    const charId = `char-${Date.now()}`;
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
      newChar.updatedAt
    ).run();

    return json(newChar, 201);
  }

  if (path.match(/^\/characters\/[^/]+$/) && method === 'PUT') {
    const charId = path.split('/')[2];
    const charData = await request.json() as any;

    const row = await env.DB.prepare('SELECT owner_id, revision FROM characters WHERE id = ?').bind(charId).first();
    if (!row) return error('شخصیت یافت نشد.', 404);

    if (currentUser.role !== 'dm' && row.owner_id !== currentUser.id) {
      return error('شما مجاز به ویرایش این کاراکتر نیستید.', 403);
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
      updatedChar.updatedAt,
      charId
    ).run();

    return json(updatedChar);
  }

  if (path.match(/^\/characters\/[^/]+$/) && method === 'DELETE') {
    const charId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id FROM characters WHERE id = ?').bind(charId).first();
    if (!row) return error('شخصیت یافت نشد.', 404);
    if (currentUser.role !== 'dm' && row.owner_id !== currentUser.id) {
      return error('دسترسی غیرمجاز.', 403);
    }
    await env.DB.prepare('DELETE FROM characters WHERE id = ?').bind(charId).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Notes Routes
  // ---------------------------------------------------------
  if (path === '/notes' && method === 'GET') {
    const charFilter = url.searchParams.get('characterId');
    let stmt;
    if (currentUser.role === 'dm') {
      stmt = charFilter 
        ? env.DB.prepare('SELECT data FROM notes WHERE character_id = ?').bind(charFilter)
        : env.DB.prepare('SELECT data FROM notes');
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
    const noteId = `note-${Date.now()}`;
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
      newNote.characterId,
      currentUser.id,
      newNote.title,
      newNote.sharedWithDm ? 1 : 0,
      JSON.stringify(newNote),
      newNote.updatedAt
    ).run();

    return json(newNote, 201);
  }

  if (path.match(/^\/notes\/[^/]+$/) && method === 'PUT') {
    const noteId = path.split('/')[2];
    const noteData = await request.json() as any;
    const row = await env.DB.prepare('SELECT owner_id FROM notes WHERE id = ?').bind(noteId).first();
    if (!row) return error('یادداشت یافت نشد.', 404);
    if (currentUser.role !== 'dm' && row.owner_id !== currentUser.id) {
      return error('دسترسی غیرمجاز.', 403);
    }
    const updated = { ...noteData, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'UPDATE notes SET title = ?, shared_with_dm = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(updated.title, updated.sharedWithDm ? 1 : 0, JSON.stringify(updated), updated.updatedAt, noteId).run();
    return json(updated);
  }

  if (path.match(/^\/notes\/[^/]+$/) && method === 'DELETE') {
    const noteId = path.split('/')[2];
    const row = await env.DB.prepare('SELECT owner_id FROM notes WHERE id = ?').bind(noteId).first();
    if (!row) return error('یادداشت یافت نشد.', 404);
    if (currentUser.role !== 'dm' && row.owner_id !== currentUser.id) {
      return error('دسترسی غیرمجاز.', 403);
    }
    await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(noteId).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // NPCs / Bestiary Routes
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
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز به ایجاد NPC است.', 403);
    const data = await request.json() as any;
    const id = `npc-${Date.now()}`;
    const newNpc = { ...data, id, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'INSERT INTO npcs (id, name, type, is_revealed, location_tag, session_tag, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, newNpc.name, newNpc.type, newNpc.isRevealed ? 1 : 0, newNpc.locationTag || '', newNpc.sessionTag || '', JSON.stringify(newNpc), newNpc.updatedAt).run();
    return json(newNpc, 201);
  }

  if (path.match(/^\/npcs\/[^/]+$/) && method === 'PUT') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    const data = await request.json() as any;
    const updated = { ...data, id, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'UPDATE npcs SET name = ?, type = ?, is_revealed = ?, location_tag = ?, session_tag = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(updated.name, updated.type, updated.isRevealed ? 1 : 0, updated.locationTag || '', updated.sessionTag || '', JSON.stringify(updated), updated.updatedAt, id).run();
    return json(updated);
  }

  if (path.match(/^\/npcs\/[^/]+$/) && method === 'DELETE') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    await env.DB.prepare('DELETE FROM npcs WHERE id = ?').bind(id).run();
    return json({ success: true });
  }

  // ---------------------------------------------------------
  // Items & Library Routes
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
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز به افزودن آیتم است.', 403);
    const data = await request.json() as any;
    const id = `item-${Date.now()}`;
    const newItem = { ...data, id, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'INSERT INTO items (id, name, category, is_revealed, data, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, newItem.name, newItem.category, newItem.isRevealed ? 1 : 0, JSON.stringify(newItem), newItem.updatedAt).run();
    return json(newItem, 201);
  }

  // ---------------------------------------------------------
  // Encounters Routes
  // ---------------------------------------------------------
  if (path === '/encounters' && method === 'GET') {
    const res = await env.DB.prepare('SELECT data FROM encounters').all();
    return json((res.results || []).map((r: any) => JSON.parse(r.data)));
  }

  if (path === '/encounters' && method === 'POST') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    const id = `enc-${Date.now()}`;
    const newEnc = { ...data, id, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'INSERT INTO encounters (id, name, session_tag, data, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, newEnc.name, newEnc.sessionTag || '', JSON.stringify(newEnc), newEnc.updatedAt).run();
    return json(newEnc, 201);
  }

  if (path.match(/^\/encounters\/[^/]+$/) && method === 'PUT') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const id = path.split('/')[2];
    const data = await request.json() as any;
    const updated = { ...data, id, updatedAt: new Date().toISOString() };
    await env.DB.prepare(
      'UPDATE encounters SET name = ?, session_tag = ?, data = ?, updated_at = ? WHERE id = ?'
    ).bind(updated.name, updated.sessionTag || '', JSON.stringify(updated), updated.updatedAt, id).run();
    return json(updated);
  }

  // ---------------------------------------------------------
  // Group Recharges Reset (session / season)
  // ---------------------------------------------------------
  if (path === '/recharge-reset' && method === 'POST') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const { type } = await request.json() as { type: 'session' | 'season' };
    const res = await env.DB.prepare('SELECT id, data, revision FROM characters').all();
    const updatedChars = [];
    for (const row of (res.results || [])) {
      const char = JSON.parse(row.data);
      char.weapons = (char.weapons || []).map((w: any) => {
        if (w.abilityReset === type || (type === 'season' && w.abilityReset === 'session')) {
          return { ...w, abilityUsed: 0 };
        }
        return w;
      });
      char.features = (char.features || []).map((f: any) => {
        if (f.usageType === type || (type === 'season' && f.usageType === 'session')) {
          return { ...f, usedCount: 0 };
        }
        return f;
      });
      char.inventory = (char.inventory || []).map((item: any) => {
        if (item.resetType === type || (type === 'season' && item.resetType === 'session')) {
          return { ...item, usedCount: 0 };
        }
        return item;
      });
      char.revision = (row.revision || 1) + 1;
      char.updatedAt = new Date().toISOString();
      await env.DB.prepare(
        'UPDATE characters SET data = ?, revision = ?, updated_at = ? WHERE id = ?'
      ).bind(JSON.stringify(char), char.revision, char.updatedAt, char.id).run();
      updatedChars.push(char);
    }
    return json(updatedChars);
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
        updatedAt: new Date().toISOString()
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
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO campaign_calendar (id, year, month, day, is_off_day, off_day_index, current_festival, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET year = excluded.year, month = excluded.month, day = excluded.day, is_off_day = excluded.is_off_day, off_day_index = excluded.off_day_index, current_festival = excluded.current_festival, updated_at = excluded.updated_at'
    ).bind('zorvania-calendar', data.year, data.month, data.day, data.isOffDay ? 1 : 0, data.offDayIndex || 0, data.currentFestival || '', now).run();
    return json({ ...data, updatedAt: now });
  }

  // ---------------------------------------------------------
  // Ending Tracker Routes
  // ---------------------------------------------------------
  if (path === '/endings' && method === 'GET') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const row = await env.DB.prepare('SELECT data FROM campaign_endings WHERE id = ?').bind('zorvania-endings').first();
    if (!row) {
      return json({ id: 'zorvania-endings', updatedAt: new Date().toISOString() });
    }
    return json(JSON.parse(row.data));
  }

  if (path === '/endings' && method === 'PUT') {
    if (currentUser.role !== 'dm') return error('فقط دانجن مستر مجاز است.', 403);
    const data = await request.json() as any;
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO campaign_endings (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at'
    ).bind('zorvania-endings', JSON.stringify({ ...data, updatedAt: now }), now).run();
    return json({ ...data, updatedAt: now });
  }

  // ---------------------------------------------------------
  // Shanshin Encounters Routes
  // ---------------------------------------------------------
  if (path === '/shanshin-encounters' && method === 'GET') {
    const res = await env.DB.prepare('SELECT * FROM shanshin_encounters ORDER BY id ASC').all();
    return json(res.results || []);
  }

  // Fallback 404
  return error(`مسیری با مشخصات ${method} ${path} یافت نشد.`, 404);
};

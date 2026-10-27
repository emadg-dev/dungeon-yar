var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/[[route]].ts
var COMMON_PASSWORDS = /* @__PURE__ */ new Set([
  "12345678",
  "123456789",
  "1234567890",
  "1234567",
  "password",
  "password1",
  "password123",
  "qwertyui",
  "qwertyuiop",
  "asdfghjk",
  "asdfghjkl",
  "zxcvbnm",
  "11111111",
  "00000000",
  "123123123",
  "admin123",
  "administrator",
  "welcome1",
  "welcome123",
  "iloveyou",
  "sunshine",
  "princess",
  "football",
  "monkey123",
  "shadow123",
  "dragon123",
  "master123",
  "zorvania",
  "zorvania123",
  "letmein1",
  "trustno1",
  "starwars",
  "superman",
  "michael1",
  "jessica1",
  "charlie1",
  "whatever",
  "donald123",
  "killer123",
  "hunter12",
  "batman123",
  "superman1",
  "pass1234",
  "secret12",
  "secret123",
  "computer1",
  "internet1",
  "freedom1",
  "mercedes1",
  "server123",
  "root1234",
  "oracle123",
  "database1",
  "gamemaster",
  "dungeonmaster",
  "dungeon1"
]);
function base64UrlEncode(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(base64UrlEncode, "base64UrlEncode");
function base64ToBytes(b64) {
  const standard = b64.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard + "=".repeat((4 - standard.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
__name(base64ToBytes, "base64ToBytes");
async function sha256Hex(message) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(message));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function hashIp(ip, salt) {
  return sha256Hex(`${ip}::${salt}`);
}
__name(hashIp, "hashIp");
async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
    // 32 bytes
  );
  const saltB64 = base64UrlEncode(salt);
  const hashB64 = base64UrlEncode(derivedBits);
  return `pbkdf2$sha256$100000$${saltB64}$${hashB64}`;
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHashRecord) {
  try {
    const parts = storedHashRecord.split("$");
    if (parts.length !== 5 || parts[0] !== "pbkdf2" || parts[1] !== "sha256") {
      return { valid: false, needsRehash: false };
    }
    const iterations = parseInt(parts[2], 10);
    const salt = base64ToBytes(parts[3]);
    const expectedHashBytes = base64ToBytes(parts[4]);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
      },
      keyMaterial,
      expectedHashBytes.length * 8
    );
    const derivedBytes = new Uint8Array(derivedBits);
    if (derivedBytes.length !== expectedHashBytes.length) {
      return { valid: false, needsRehash: false };
    }
    let diff = 0;
    for (let i = 0; i < derivedBytes.length; i++) {
      diff |= derivedBytes[i] ^ expectedHashBytes[i];
    }
    const valid = diff === 0;
    const needsRehash = valid && iterations !== 1e5;
    return { valid, needsRehash };
  } catch {
    return { valid: false, needsRehash: false };
  }
}
__name(verifyPassword, "verifyPassword");
async function dummyHashWork() {
  try {
    const salt = new Uint8Array(16);
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode("dummy-password"), { name: "PBKDF2" }, false, ["deriveBits"]);
    await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 1e5, hash: "SHA-256" }, keyMaterial, 256);
  } catch {
  }
}
__name(dummyHashWork, "dummyHashWork");
function generateRandomToken(bytesCount = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(bytesCount));
  return base64UrlEncode(bytes);
}
__name(generateRandomToken, "generateRandomToken");
var SESSION_COOKIE_NAME = "__Host-zsession";
var SLIDING_EXPIRY_MS = 14 * 24 * 60 * 60 * 1e3;
var ABSOLUTE_MAX_MS = 60 * 24 * 60 * 60 * 1e3;
var SLIDING_EXTEND_THRESHOLD_MS = 24 * 60 * 60 * 1e3;
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match2 = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
  return match2 ? decodeURIComponent(match2[2]) : null;
}
__name(parseCookie, "parseCookie");
function makeSessionCookie(token, maxAgeSeconds) {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}
__name(makeSessionCookie, "makeSessionCookie");
function clearSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
__name(clearSessionCookie, "clearSessionCookie");
function validatePassword(password, email, displayName) {
  if (!password || password.length < 8) {
    return "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F8 \u0646\u0648\u06CC\u0633\u0647 (\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631) \u0628\u0627\u0634\u062F.";
  }
  if (password.length > 128) {
    return "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0628\u0627\u06CC\u062F \u0628\u06CC\u0634\u062A\u0631 \u0627\u0632 \u06F1\u06F2\u06F8 \u0646\u0648\u06CC\u0633\u0647 \u0628\u0627\u0634\u062F.";
  }
  const cleanPass = password.toLowerCase().trim();
  if (cleanPass === email.toLowerCase().trim()) {
    return "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u0627 \u0627\u06CC\u0645\u06CC\u0644 \u06CC\u06A9\u0633\u0627\u0646 \u0628\u0627\u0634\u062F.";
  }
  if (displayName && cleanPass === displayName.toLowerCase().trim()) {
    return "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0628\u0627 \u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC \u06CC\u06A9\u0633\u0627\u0646 \u0628\u0627\u0634\u062F.";
  }
  if (COMMON_PASSWORDS.has(cleanPass)) {
    return "\u0627\u06CC\u0646 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0633\u06CC\u0627\u0631 \u0631\u0627\u06CC\u062C \u0648 \u0646\u0627\u0627\u0645\u0646 \u0627\u0633\u062A\u061B \u0644\u0637\u0641\u0627\u064B \u0631\u0645\u0632 \u0642\u0648\u06CC\u200C\u062A\u0631\u06CC \u0628\u0631\u06AF\u0632\u06CC\u0646\u06CC\u062F.";
  }
  return null;
}
__name(validatePassword, "validatePassword");
var SECURITY_HEADERS = {
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "default-src 'self'; font-src 'self' data: https:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
  "Cache-Control": "no-store"
};
var onRequest = /* @__PURE__ */ __name(async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  const path = url.pathname.replace(/^\/api/, "");
  const ipHashSalt = env.IP_HASH_SALT || "zorvania-ip-salt-default-secret";
  const clientIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "127.0.0.1";
  const clientIpHash = await hashIp(clientIp, ipHashSalt);
  const userAgent = request.headers.get("User-Agent") || "unknown";
  const rawDmEmails = env.DM_EMAILS || "dm@zorvania.ir";
  const dmEmails = rawDmEmails.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  const registrationMode = env.REGISTRATION_MODE || "invite";
  const json = /* @__PURE__ */ __name((data, status = 200, extraHeaders = {}) => {
    return new Response(JSON.stringify(data), {
      status,
      headers: {
        "Content-Type": "application/json",
        ...SECURITY_HEADERS,
        ...extraHeaders
      }
    });
  }, "json");
  const error = /* @__PURE__ */ __name((msg, status = 400, extraHeaders = {}) => {
    return json({ error: msg }, status, extraHeaders);
  }, "error");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const xRequestedWith = request.headers.get("X-Requested-With");
    if (!xRequestedWith || xRequestedWith.toLowerCase() !== "zorvania") {
      return error("\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A (CSRF Header \u0645\u0641\u0642\u0648\u062F \u0627\u0633\u062A).", 403);
    }
    const origin = request.headers.get("Origin");
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== url.host) {
          return error("\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0627\u0632 \u0645\u0628\u062F\u0623 \u063A\u06CC\u0631\u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
        }
      } catch {
        return error("\u0645\u0628\u062F\u0623 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 403);
      }
    }
  }
  const now = Date.now();
  if (Math.random() < 0.05 && env.DB) {
    context.waitUntil?.(
      (async () => {
        try {
          const oneDayAgo = now - 24 * 60 * 60 * 1e3;
          await env.DB.prepare("DELETE FROM login_attempts WHERE created_at < ?").bind(oneDayAgo).run();
        } catch {
        }
      })()
    );
  }
  const cookieHeader = request.headers.get("Cookie");
  const sessionToken = parseCookie(cookieHeader, SESSION_COOKIE_NAME);
  let currentSession = null;
  let currentUser = null;
  let setCookieHeader = null;
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
      if (now - currentSession.last_seen_at > SLIDING_EXTEND_THRESHOLD_MS) {
        const nextExpires = Math.min(now + SLIDING_EXPIRY_MS, currentSession.absolute_expires_at);
        await env.DB.prepare(
          "UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?"
        ).bind(now, nextExpires, currentSession.id).run();
        const remainingSeconds = Math.max(1, Math.floor((nextExpires - now) / 1e3));
        setCookieHeader = makeSessionCookie(sessionToken, remainingSeconds);
      }
    }
  }
  const audit = /* @__PURE__ */ __name(async (action, targetId = null, meta = null) => {
    if (!env.DB) return;
    try {
      const auditId = `audit-${Date.now()}-${generateRandomToken(4)}`;
      await env.DB.prepare(
        "INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(auditId, currentUser?.id || null, action, targetId, meta ? JSON.stringify(meta) : null, Date.now()).run();
    } catch {
    }
  }, "audit");
  const checkRateLimit = /* @__PURE__ */ __name(async (key, maxAttempts, windowMs) => {
    if (!env.DB) return true;
    const windowStart = Date.now() - windowMs;
    const countRow = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM login_attempts WHERE key = ? AND success = 0 AND created_at > ?"
    ).bind(key, windowStart).first();
    return (countRow?.count || 0) < maxAttempts;
  }, "checkRateLimit");
  const recordAttempt = /* @__PURE__ */ __name(async (key, success) => {
    if (!env.DB) return;
    try {
      await env.DB.prepare(
        "INSERT INTO login_attempts (key, created_at, success) VALUES (?, ?, ?)"
      ).bind(key, Date.now(), success ? 1 : 0).run();
    } catch {
    }
  }, "recordAttempt");
  if (path === "/auth/register" && method === "POST") {
    if (!env.DB) return error("\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A.", 500);
    const canRegister = await checkRateLimit(`reg_ip:${clientIpHash}`, 10, 60 * 60 * 1e3);
    if (!canRegister) {
      return error("\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0627\u0632 \u0627\u06CC\u0646 \u0622\u062F\u0631\u0633 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0633\u0627\u0639\u062A\u06CC \u062F\u06CC\u06AF\u0631 \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646\u06CC\u062F.", 429, { "Retry-After": "3600" });
    }
    try {
      const body = await request.json();
      const rawEmail = String(body.email || "").toLowerCase().trim();
      const rawPassword = String(body.password || "");
      const rawDisplayName = String(body.displayName || "").trim();
      const inviteCode = String(body.inviteCode || "").trim();
      if (!rawEmail || !rawEmail.includes("@")) {
        return error("\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644 \u0645\u0639\u062A\u0628\u0631 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
      }
      if (!rawDisplayName || rawDisplayName.length < 2 || rawDisplayName.length > 40) {
        return error("\u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 \u06F2 \u062A\u0627 \u06F4\u06F0 \u0646\u0648\u06CC\u0633\u0647 \u0628\u0627\u0634\u062F.");
      }
      const passError = validatePassword(rawPassword, rawEmail, rawDisplayName);
      if (passError) return error(passError);
      const isDmEmail = dmEmails.includes(rawEmail);
      let assignedCharacterId = null;
      if (!isDmEmail && registrationMode !== "open") {
        if (!inviteCode) {
          return error("\u0628\u0631\u0627\u06CC \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0628\u0647 \u06A9\u062F \u062F\u0639\u0648\u062A \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0627\u0632 \u0627\u0633\u062A.");
        }
        const inviteHash = await sha256Hex(inviteCode);
        const inviteRow = await env.DB.prepare(
          "SELECT * FROM invites WHERE code_hash = ? AND revoked_at IS NULL"
        ).bind(inviteHash).first();
        if (!inviteRow) {
          return error("\u06A9\u062F \u062F\u0639\u0648\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
        }
        if (inviteRow.expires_at > 0 && inviteRow.expires_at < now) {
          return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.");
        }
        if (inviteRow.used_count >= inviteRow.max_uses) {
          return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0642\u0628\u0644\u0627\u064B \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A.");
        }
        const updateRes = await env.DB.prepare(
          "UPDATE invites SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses AND revoked_at IS NULL"
        ).bind(inviteRow.id).run();
        if (!updateRes.meta?.changes && updateRes.changes === 0) {
          return error("\u06A9\u062F \u062F\u0639\u0648\u062A \u0647\u0645\u200C\u0627\u06A9\u0646\u0648\u0646 \u0628\u0647 \u062D\u062F\u0627\u06A9\u062B\u0631 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0631\u0633\u06CC\u062F\u0647 \u0627\u0633\u062A.");
        }
        if (inviteRow.assign_character_id) {
          assignedCharacterId = inviteRow.assign_character_id;
        }
      }
      const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(rawEmail).first();
      if (existing) {
        return error("\u06A9\u0627\u0631\u0628\u0631\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u0627\u06CC\u0645\u06CC\u0644 \u067E\u06CC\u0634\u200C\u062A\u0631 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u06A9\u0631\u062F\u0647 \u0627\u0633\u062A.", 409);
      }
      const userId = `user-${Date.now()}-${generateRandomToken(4)}`;
      const passwordHash = await hashPassword(rawPassword);
      const userRole = isDmEmail ? "dm" : "player";
      await env.DB.prepare(
        `INSERT INTO users (id, email, display_name, password_hash, role, status, must_change_password, created_at, last_login_at, active_character_id)
         VALUES (?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`
      ).bind(userId, rawEmail, rawDisplayName, passwordHash, userRole, now, now, assignedCharacterId).run();
      if (assignedCharacterId) {
        await env.DB.prepare(
          "UPDATE characters SET owner_id = ? WHERE id = ?"
        ).bind(userId, assignedCharacterId).run();
      }
      const rawToken = generateRandomToken(32);
      const tokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;
      await env.DB.prepare(
        `INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, userId, tokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();
      await audit("register", userId, { email: rawEmail, role: userRole });
      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1e3));
      return json({
        user: {
          id: userId,
          email: rawEmail,
          name: rawDisplayName,
          displayName: rawDisplayName,
          role: userRole,
          status: "active",
          mustChangePassword: false,
          activeCharacterId: assignedCharacterId
        }
      }, 201, { "Set-Cookie": cookieStr });
    } catch (e) {
      return error(e.message || "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0646\u0627\u0645.", 500);
    }
  }
  if (path === "/auth/login" && method === "POST") {
    if (!env.DB) return error("\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A.", 500);
    try {
      const body = await request.json();
      const rawEmail = String(body.email || "").toLowerCase().trim();
      const rawPassword = String(body.password || "");
      const emailKey = `login_email:${await sha256Hex(rawEmail)}`;
      const ipKey = `login_ip:${clientIpHash}`;
      const emailAllowed = await checkRateLimit(emailKey, 5, 15 * 60 * 1e3);
      const ipAllowed = await checkRateLimit(ipKey, 20, 15 * 60 * 1e3);
      if (!emailAllowed || !ipAllowed) {
        return error("\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u06F1\u06F5 \u062F\u0642\u06CC\u0642\u0647 \u062F\u06CC\u06AF\u0631 \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.", 429, { "Retry-After": "900" });
      }
      const userRow = await env.DB.prepare(
        "SELECT * FROM users WHERE email = ? AND deleted_at IS NULL"
      ).bind(rawEmail).first();
      if (!userRow || userRow.status === "disabled") {
        await dummyHashWork();
        await recordAttempt(emailKey, false);
        await recordAttempt(ipKey, false);
        return error("\u0627\u06CC\u0645\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 401);
      }
      const { valid, needsRehash } = await verifyPassword(rawPassword, userRow.password_hash);
      if (!valid) {
        await recordAttempt(emailKey, false);
        await recordAttempt(ipKey, false);
        return error("\u0627\u06CC\u0645\u06CC\u0644 \u06CC\u0627 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 401);
      }
      if (needsRehash) {
        const newHash = await hashPassword(rawPassword);
        await env.DB.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newHash, userRow.id).run();
      }
      await recordAttempt(emailKey, true);
      await recordAttempt(ipKey, true);
      await env.DB.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").bind(now, userRow.id).run();
      const rawToken = generateRandomToken(32);
      const tokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;
      await env.DB.prepare(
        `INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, userRow.id, tokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();
      await audit("login", userRow.id);
      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1e3));
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
      }, 200, { "Set-Cookie": cookieStr });
    } catch (e) {
      return error(e.message || "\u062E\u0637\u0627 \u062F\u0631 \u0648\u0631\u0648\u062F.", 500);
    }
  }
  if (path === "/auth/logout" && method === "POST") {
    if (currentSession && env.DB) {
      await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE id = ?").bind(now, currentSession.id).run();
      await audit("logout", currentUser?.id);
    }
    return json({ message: "\u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062E\u0627\u0631\u062C \u0634\u062F\u06CC\u062F." }, 200, { "Set-Cookie": clearSessionCookie() });
  }
  if (path === "/auth/logout-all" && method === "POST") {
    if (!currentUser) return error("\u0627\u0628\u062A\u062F\u0627 \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F.", 401);
    await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ?").bind(now, currentUser.id).run();
    await audit("logout-all", currentUser.id);
    return json({ message: "\u062A\u0645\u0627\u0645 \u0646\u0634\u0633\u062A\u200C\u0647\u0627\u06CC \u0641\u0639\u0627\u0644 \u0634\u0645\u0627 \u062E\u0627\u062A\u0645\u0647 \u06CC\u0627\u0641\u062A\u0646\u062F." }, 200, { "Set-Cookie": clearSessionCookie() });
  }
  if (path === "/auth/me" && method === "GET") {
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
    }, 200, setCookieHeader ? { "Set-Cookie": setCookieHeader } : {});
  }
  if (path === "/auth/reset" && method === "POST") {
    if (!env.DB) return error("\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A.", 500);
    const canReset = await checkRateLimit(`reset_ip:${clientIpHash}`, 10, 60 * 60 * 1e3);
    if (!canReset) {
      return error("\u062A\u0639\u062F\u0627\u062F \u062A\u0644\u0627\u0634\u200C\u0647\u0627\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0628\u06CC\u0634 \u0627\u0632 \u062D\u062F \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 429, { "Retry-After": "3600" });
    }
    try {
      const body = await request.json();
      const token = String(body.token || "").trim();
      const newPassword = String(body.newPassword || "");
      if (!token) return error("\u062A\u0648\u06A9\u0646 \u0628\u0627\u0632\u0646\u0634\u0627\u0646\u06CC \u0631\u0645\u0632 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
      const tokenHash = await sha256Hex(token);
      const resetRow = await env.DB.prepare(
        "SELECT * FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?"
      ).bind(tokenHash, now).first();
      if (!resetRow) {
        return error("\u0644\u06CC\u0646\u06A9 \u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.", 400);
      }
      const targetUser = await env.DB.prepare(
        "SELECT * FROM users WHERE id = ? AND deleted_at IS NULL"
      ).bind(resetRow.user_id).first();
      if (!targetUser || targetUser.status === "disabled") {
        return error("\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u06CC\u0627 \u062D\u0630\u0641 \u0634\u062F\u0647 \u0627\u0633\u062A.", 400);
      }
      const passErr = validatePassword(newPassword, targetUser.email, targetUser.display_name);
      if (passErr) return error(passErr);
      const newHash = await hashPassword(newPassword);
      await env.DB.prepare("UPDATE password_resets SET used_at = ? WHERE id = ?").bind(now, resetRow.id).run();
      await env.DB.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").bind(newHash, targetUser.id).run();
      await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUser.id).run();
      const rawToken = generateRandomToken(32);
      const newSessionTokenHash = await sha256Hex(rawToken);
      const sessionId = `sess-${Date.now()}-${generateRandomToken(4)}`;
      const expiresAt = now + SLIDING_EXPIRY_MS;
      const absoluteExpiresAt = now + ABSOLUTE_MAX_MS;
      await env.DB.prepare(
        `INSERT INTO sessions (id, user_id, token_hash, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, targetUser.id, newSessionTokenHash, now, now, expiresAt, absoluteExpiresAt, userAgent.substring(0, 200), clientIpHash).run();
      await audit("password-reset", targetUser.id);
      const cookieStr = makeSessionCookie(rawToken, Math.floor(SLIDING_EXPIRY_MS / 1e3));
      return json({
        message: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F.",
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
      }, 200, { "Set-Cookie": cookieStr });
    } catch (e) {
      return error(e.message || "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631.", 500);
    }
  }
  if (!currentUser) {
    return error("\u0646\u0634\u0633\u062A \u0634\u0645\u0627 \u062A\u0645\u0627\u0645 \u0634\u062F\u0647 \u06CC\u0627 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0648\u0627\u0631\u062F \u0634\u0648\u06CC\u062F.", 401);
  }
  const actor = currentUser;
  const parseBlob = /* @__PURE__ */ __name((value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }, "parseBlob");
  const mapCampaignRow = /* @__PURE__ */ __name((r) => ({
    id: r.id,
    name: r.name,
    description: r.description || "",
    coverMediaId: r.cover_media_id || null,
    tone: r.tone || void 0,
    status: r.status,
    ownerId: r.owner_id,
    sourcePackId: r.source_pack_id || null,
    settings: parseBlob(r.settings, {}),
    wizardState: r.wizard_state ? parseBlob(r.wizard_state, null) : null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    myRole: r.my_role || void 0,
    memberCount: r.member_count != null ? Number(r.member_count) : void 0,
    characterCount: r.character_count != null ? Number(r.character_count) : void 0
  }), "mapCampaignRow");
  const getMembershipRole = /* @__PURE__ */ __name(async (campId, userId) => {
    const row = await env.DB.prepare(
      "SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND status = 'active'"
    ).bind(campId, userId).first();
    return row?.role || null;
  }, "getMembershipRole");
  const loadCharacterBlobs = /* @__PURE__ */ __name(async () => {
    const res = actor.role === "dm" ? await env.DB.prepare("SELECT id, data, revision FROM characters").all() : await env.DB.prepare("SELECT id, data, revision FROM characters WHERE owner_id = ?").bind(actor.id).all();
    return res.results || [];
  }, "loadCharacterBlobs");
  const saveCharacterBlob = /* @__PURE__ */ __name(async (id, blob, nextRevision) => {
    blob.revision = nextRevision;
    blob.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await env.DB.prepare("UPDATE characters SET data = ?, revision = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(blob), nextRevision, now, id).run();
    return blob;
  }, "saveCharacterBlob");
  if (path === "/home" && method === "GET") {
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
    const charRes = await env.DB.prepare("SELECT id, data FROM characters WHERE owner_id = ?").bind(actor.id).all();
    const myCharacters = [];
    const charIds = [];
    for (const row of charRes.results || []) {
      const parsed = parseBlob(row.data, null);
      if (parsed && parsed.status !== "archived") {
        myCharacters.push(parsed);
        charIds.push(row.id);
      }
    }
    if (charIds.length > 0) {
      const placeholders = charIds.map(() => "?").join(",");
      const partRes = await env.DB.prepare(
        `SELECT id, character_id, campaign_id, status, level FROM character_participations WHERE character_id IN (${placeholders})`
      ).bind(...charIds).all();
      const byChar = {};
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
    const isGlobalDm = actor.role === "dm";
    const myDmIds = new Set(
      myCampaigns.filter((c) => c.myRole === "owner" || c.myRole === "co_dm").map((c) => c.id)
    );
    const inviteRes = await env.DB.prepare(
      "SELECT * FROM campaign_invites WHERE revoked_at IS NULL ORDER BY created_at DESC"
    ).all();
    const pendingInvites = (inviteRes.results || []).filter((i) => i.expires_at > now && i.used_count < i.max_uses && (isGlobalDm || myDmIds.has(i.campaign_id))).map((i) => ({
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
    const apprRes = await env.DB.prepare(
      `SELECT p.id, p.character_id, p.campaign_id, p.status, p.level, p.class_name, p.pending_level_up, p.joined_at, p.updated_at,
              ch.name AS char_name, ch.data AS char_data, u.display_name AS player_name, c.name AS campaign_name
         FROM character_participations p
         JOIN characters ch ON ch.id = p.character_id
         LEFT JOIN users u ON u.id = ch.owner_id
         JOIN campaigns c ON c.id = p.campaign_id
        WHERE p.status = 'pending_approval' OR (p.pending_level_up IS NOT NULL AND p.pending_level_up != '')`
    ).all();
    const pendingApprovals = [];
    for (const p of apprRes.results || []) {
      if (!isGlobalDm && !myDmIds.has(p.campaign_id)) continue;
      const charBlob = parseBlob(p.char_data, null);
      const levelUp = parseBlob(p.pending_level_up, null);
      if (p.status === "pending_approval") {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: "create",
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || "\u0634\u062E\u0635\u06CC\u062A \u062C\u062F\u06CC\u062F",
          playerName: p.player_name || "\u06A9\u0627\u0631\u0628\u0631",
          level: p.level,
          requestedAt: p.joined_at,
          details: { className: p.class_name, race: charBlob?.race }
        });
      } else if (levelUp) {
        pendingApprovals.push({
          campaignId: p.campaign_id,
          campaignName: p.campaign_name,
          type: "level_up",
          participationId: p.id,
          characterId: p.character_id,
          characterName: p.char_name || charBlob?.name || "\u0634\u062E\u0635\u06CC\u062A",
          playerName: p.player_name || "\u06A9\u0627\u0631\u0628\u0631",
          level: levelUp.targetLevel || p.level,
          requestedAt: levelUp.requestedAt || p.updated_at,
          details: levelUp.diff
        });
      }
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
  if (path === "/campaigns" && method === "GET") {
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
  if (path.match(/^\/c\/[^/]+$/) && method === "GET") {
    const campId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!row) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({
      ...row,
      my_role: myRole || "owner",
      member_count: mc?.n ?? 0,
      character_count: cc?.n ?? 0
    }));
  }
  if (path.match(/^\/c\/[^/]+\/members$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const res = await env.DB.prepare(
      `SELECT m.campaign_id, m.user_id, m.role, m.status, m.joined_at, u.display_name, u.email, u.avatar_url
         FROM campaign_members m
         JOIN users u ON u.id = m.user_id
        WHERE m.campaign_id = ?
        ORDER BY m.joined_at ASC`
    ).bind(campId).all();
    return json((res.results || []).map((r) => ({
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
  if (path.match(/^\/c\/[^/]+\/invites$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== "dm" && myRole !== "owner" && myRole !== "co_dm") {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    }
    const res = await env.DB.prepare(
      "SELECT * FROM campaign_invites WHERE campaign_id = ? AND revoked_at IS NULL ORDER BY created_at DESC"
    ).bind(campId).all();
    return json((res.results || []).map((r) => ({
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
  if (path.match(/^\/c\/[^/]+\/invites$/) && method === "POST") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== "dm" && myRole !== "owner" && myRole !== "co_dm") {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    }
    const body = await request.json();
    const role = ["owner", "co_dm", "player", "spectator"].includes(body.role) ? body.role : "player";
    const label = String(body.label || "\u062F\u0639\u0648\u062A \u062C\u062F\u06CC\u062F").trim();
    const expiresInDays = Math.max(1, Math.min(365, parseInt(String(body.expiresInDays || 30), 10)));
    const maxUses = Math.max(1, parseInt(String(body.maxUses || 1), 10));
    const assignParticipationId = body.assignParticipationId || null;
    const rawCode = `inv-${generateRandomToken(6)}`;
    const codeHash = await sha256Hex(rawCode);
    const inviteId = `cinv-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1e3;
    await env.DB.prepare(
      `INSERT INTO campaign_invites (id, campaign_id, code_hash, role, label, created_by, created_at, expires_at, max_uses, used_count, assign_participation_id, revoked_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NULL)`
    ).bind(inviteId, campId, codeHash, role, label, actor.id, now, expiresAt, maxUses, assignParticipationId).run();
    await audit("campaign-invite-create", inviteId, { campaignId: campId, role, label, maxUses, expiresAt });
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
  if (path.match(/^\/c\/[^/]+\/invites\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const inviteId = parts[4];
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== "dm" && myRole !== "owner" && myRole !== "co_dm") {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    }
    const res = await env.DB.prepare(
      "UPDATE campaign_invites SET revoked_at = ? WHERE id = ? AND campaign_id = ? AND revoked_at IS NULL"
    ).bind(now, inviteId, campId).run();
    const changes = res?.meta?.changes ?? 0;
    if (changes === 0) return error("\u062F\u0639\u0648\u062A\u200C\u0646\u0627\u0645\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await audit("campaign-invite-revoke", inviteId, { campaignId: campId });
    return json({ success: true });
  }
  if (path === "/invites/accept" && method === "POST") {
    const body = await request.json();
    const code = String(body.code || "").trim();
    if (!code) return error("\u06A9\u062F \u062F\u0639\u0648\u062A \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F.");
    const codeHash = await sha256Hex(code);
    const inv = await env.DB.prepare(
      "SELECT * FROM campaign_invites WHERE code_hash = ? OR id = ?"
    ).bind(codeHash, code).first();
    if (!inv || inv.revoked_at) return error("\u06A9\u062F \u062F\u0639\u0648\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u06CC\u0627 \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.", 404);
    if (inv.expires_at > 0 && inv.expires_at < now) return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.");
    if (inv.used_count >= inv.max_uses) return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0642\u0628\u0644\u0627\u064B \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A.");
    if (!inv.campaign_id) return error("\u0627\u06CC\u0646 \u06A9\u062F \u062F\u0639\u0648\u062A \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A.");
    const campId = inv.campaign_id;
    const camp = await env.DB.prepare("SELECT id FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0627\u06CC\u0646 \u062F\u0639\u0648\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const existing = await env.DB.prepare(
      "SELECT status FROM campaign_members WHERE campaign_id = ? AND user_id = ?"
    ).bind(campId, actor.id).first();
    if (existing && existing.status === "active") return error("\u0634\u0645\u0627 \u0647\u0645\u200C\u0627\u06A9\u0646\u0648\u0646 \u0639\u0636\u0648 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u0647\u0633\u062A\u06CC\u062F.");
    const memberRole = ["owner", "co_dm", "player", "spectator"].includes(inv.role) ? inv.role : "player";
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, ?, 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO UPDATE SET role = excluded.role, status = 'active', joined_at = excluded.joined_at`
    ).bind(campId, actor.id, memberRole, now).run();
    await env.DB.prepare(
      "UPDATE campaign_invites SET used_count = used_count + 1 WHERE id = ? AND used_count < max_uses"
    ).bind(inv.id).run();
    await audit("campaign-invite-accept", inv.id, { campaignId: campId, role: memberRole });
    return json({ campaignId: campId, role: memberRole });
  }
  if (path === "/settings/campaign" && method === "GET") {
    const campId = url.searchParams.get("campaignId");
    if (!campId) return json({ allowPlayerCreateCharacter: true });
    const row = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!row) return json({ allowPlayerCreateCharacter: true });
    const settings = parseBlob(row.settings, {});
    return json({ allowPlayerCreateCharacter: settings.allowPlayerCreateCharacter ?? true });
  }
  if (path === "/settings/campaign" && method === "PUT") {
    const body = await request.json();
    const campId = body.campaignId || url.searchParams.get("campaignId");
    if (!campId) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0641\u0639\u0627\u0644 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== "dm" && myRole !== "owner" && myRole !== "co_dm") {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    }
    const row = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!row) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const settings = parseBlob(row.settings, {});
    if (typeof body.allowPlayerCreateCharacter === "boolean") {
      settings.allowPlayerCreateCharacter = body.allowPlayerCreateCharacter;
    }
    await env.DB.prepare("UPDATE campaigns SET settings = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(settings), now, campId).run();
    return json({ allowPlayerCreateCharacter: settings.allowPlayerCreateCharacter ?? true });
  }
  if (path === "/rewards" && method === "GET") {
    const res = await env.DB.prepare("SELECT data FROM rewards").all();
    return json((res.results || []).map((r) => parseBlob(r.data, null)).filter(Boolean));
  }
  if (path === "/weapon-templates" && method === "GET") {
    const res = await env.DB.prepare("SELECT data FROM weapon_templates").all();
    return json((res.results || []).map((r) => parseBlob(r.data, null)).filter(Boolean));
  }
  if (path === "/class-templates" && method === "GET") {
    const res = await env.DB.prepare("SELECT data FROM class_templates").all();
    return json((res.results || []).map((r) => parseBlob(r.data, null)).filter(Boolean));
  }
  if (path === "/campaign-notes" && method === "GET") {
    if (actor.role !== "dm") return json([]);
    const res = await env.DB.prepare("SELECT data FROM campaign_notes").all();
    return json((res.results || []).map((r) => parseBlob(r.data, null)).filter(Boolean));
  }
  if (path === "/characters/group-rest" && method === "POST") {
    const body = await request.json();
    const type = body.type === "long" || body.type === "special" ? body.type : "short";
    const notes = String(body.notes || "");
    const rows = await loadCharacterBlobs();
    const updated = [];
    for (const row of rows) {
      const char = parseBlob(row.data, null);
      if (!char) continue;
      const hp = { current: 0, max: 0, temp: 0, ...char.hp || {} };
      let exhaustion = char.exhaustion || 0;
      const features = (char.features || []).map((f) => {
        if (type === "long") return { ...f, usedCount: 0 };
        if (type === "short" && f.usageType === "short") return { ...f, usedCount: 0 };
        return f;
      });
      const weapons = (char.weapons || []).map((w) => {
        if (type === "long") return { ...w, abilityUsed: 0 };
        if (type === "short" && (w.specialAbility?.restType === "short" || w.abilityReset === "short")) {
          return { ...w, abilityUsed: 0 };
        }
        return w;
      });
      if (type === "long") {
        hp.current = hp.max;
        hp.temp = 0;
        if (exhaustion > 0) exhaustion -= 1;
      } else if (type === "special") {
        hp.current = Math.min(hp.max, hp.current + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + 2);
        if (exhaustion > 0) exhaustion -= 1;
      }
      const restEntry = {
        id: `rest-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: (/* @__PURE__ */ new Date()).toLocaleDateString("fa-IR"),
        type,
        notes: notes || (type === "long" ? "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06A9\u0627\u0645\u0644 \u06AF\u0631\u0648\u0647\u06CC" : type === "short" ? "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u06A9\u0648\u062A\u0627\u0647 \u06AF\u0631\u0648\u0647\u06CC" : "\u0627\u0633\u062A\u0631\u0627\u062D\u062A \u0648\u06CC\u0698\u0647 \u062F\u0631 \u0627\u0631\u062F\u0648\u06AF\u0627\u0647 \u067E\u0631\u06CC\u0627\u0646")
      };
      const nextRevision = Number(row.revision || 0) + 1;
      const saved = await saveCharacterBlob(row.id, {
        ...char,
        hp,
        exhaustion,
        features,
        weapons,
        restLog: [restEntry, ...char.restLog || []]
      }, nextRevision);
      updated.push(saved);
    }
    return json(updated);
  }
  if (path === "/characters/group-resources" && method === "POST") {
    const body = await request.json();
    const rationsDelta = Number(body.rations || 0);
    const oilDelta = Number(body.lanternOil || 0);
    const rows = await loadCharacterBlobs();
    const updated = [];
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
  const requireCampaignDm = /* @__PURE__ */ __name(async (campId) => {
    const myRole = await getMembershipRole(campId, actor.id);
    return actor.role === "dm" || myRole === "owner" || myRole === "co_dm";
  }, "requireCampaignDm");
  if (path === "/campaigns" && method === "POST") {
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) return error("\u0646\u0627\u0645 \u06A9\u0645\u067E\u06CC\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const campId = `camp-${Date.now()}-${generateRandomToken(4)}`;
    const defaultSettings = {
      units: "feet",
      startingLevel: 1,
      maxEntryLevel: 20,
      abilityScoreMethods: ["standard_array", "point_buy", "roll", "manual"],
      approval: { onCreate: false, onLevelUp: false },
      backstoryVisibility: "party",
      diceVisibility: "table",
      allowPlayerRollPrivate: true,
      allowPlayerCreateCharacter: true,
      encounterDefaults: { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true }
    };
    const settings = { ...defaultSettings, ...body.settings || {} };
    const description = String(body.description || "");
    const tone = body.tone ? String(body.tone) : null;
    const sourcePackId = body.packId ? String(body.packId) : null;
    await env.DB.prepare(
      `INSERT INTO campaigns (id, name, description, tone, status, owner_id, source_pack_id, settings, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?)`
    ).bind(campId, name, description, tone, actor.id, sourcePackId, JSON.stringify(settings), now, now).run();
    await env.DB.prepare(
      "INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, 'owner', 'active', ?)"
    ).bind(campId, actor.id, now).run();
    await audit("campaign-create", campId, { name });
    const row = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(campId).first();
    return json(mapCampaignRow({ ...row, my_role: "owner", member_count: 1, character_count: 0 }), 201);
  }
  if (path.match(/^\/c\/[^/]+$/) && method === "PATCH") {
    const campId = path.split("/")[2];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const row = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!row) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const next = {
      name: body.name !== void 0 ? String(body.name) : row.name,
      description: body.description !== void 0 ? String(body.description) : row.description,
      tone: body.tone !== void 0 ? body.tone : row.tone,
      status: body.status !== void 0 && ["draft", "active", "paused", "archived"].includes(body.status) ? body.status : row.status,
      settings: body.settings !== void 0 && body.settings ? body.settings : parseBlob(row.settings, {})
    };
    await env.DB.prepare(
      "UPDATE campaigns SET name = ?, description = ?, tone = ?, status = ?, settings = ?, updated_at = ? WHERE id = ?"
    ).bind(next.name, next.description, next.tone, next.status, JSON.stringify(next.settings), now, campId).run();
    await audit("campaign-update", campId, { fields: Object.keys(body) });
    const updated = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(campId).first();
    const myRole = await getMembershipRole(campId, actor.id);
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({ ...updated, my_role: myRole || "owner", member_count: mc?.n ?? 0, character_count: cc?.n ?? 0 }));
  }
  if (path.match(/^\/c\/[^/]+\/members\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const targetUserId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const member = await env.DB.prepare(
      "SELECT * FROM campaign_members WHERE campaign_id = ? AND user_id = ?"
    ).bind(campId, targetUserId).first();
    if (!member) return error("\u0639\u0636\u0648 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    if (member.role === "owner" && body.role && body.role !== "owner") {
      return error("\u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0646\u0642\u0634 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u062F\u0647\u06CC\u062F.", 400);
    }
    const nextRole = body.role && ["owner", "co_dm", "player", "spectator"].includes(body.role) ? body.role : member.role;
    const nextStatus = body.status && ["invited", "active", "left", "removed"].includes(body.status) ? body.status : member.status;
    await env.DB.prepare("UPDATE campaign_members SET role = ?, status = ? WHERE campaign_id = ? AND user_id = ?").bind(nextRole, nextStatus, campId, targetUserId).run();
    await audit("campaign-member-update", targetUserId, { campaignId: campId, role: nextRole, status: nextStatus });
    const u = await env.DB.prepare("SELECT display_name, email, avatar_url FROM users WHERE id = ?").bind(targetUserId).first();
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
  if (path.match(/^\/c\/[^/]+\/members\/[^/]+$/) && method === "DELETE") {
    const parts = path.split("/");
    const campId = parts[2];
    const targetUserId = parts[4];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const member = await env.DB.prepare(
      "SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?"
    ).bind(campId, targetUserId).first();
    if (!member) return error("\u0639\u0636\u0648 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (member.role === "owner") return error("\u0627\u0645\u06A9\u0627\u0646 \u062D\u0630\u0641 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 400);
    await env.DB.prepare("UPDATE campaign_members SET status = 'removed' WHERE campaign_id = ? AND user_id = ?").bind(campId, targetUserId).run();
    await audit("campaign-member-remove", targetUserId, { campaignId: campId });
    return json({ success: true });
  }
  if (path.match(/^\/c\/[^/]+\/transfer-ownership$/) && method === "POST") {
    const campId = path.split("/")[2];
    const body = await request.json();
    const newOwnerId = String(body.newOwnerId || "");
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== "dm" && myRole !== "owner") {
      return error("\u0641\u0642\u0637 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0645\u0627\u0644\u06A9\u06CC\u062A \u0631\u0627 \u0645\u0646\u062A\u0642\u0644 \u06A9\u0646\u062F.", 403);
    }
    const camp = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const newOwnerMem = await env.DB.prepare(
      "SELECT user_id FROM campaign_members WHERE campaign_id = ? AND user_id = ? AND status = 'active'"
    ).bind(campId, newOwnerId).first();
    if (!newOwnerMem) return error("\u0634\u062E\u0635 \u0627\u0646\u062A\u062E\u0627\u0628\u200C\u0634\u062F\u0647 \u0628\u0627\u06CC\u062F \u0627\u0628\u062A\u062F\u0627 \u0639\u0636\u0648 \u0641\u0639\u0627\u0644 \u06A9\u0645\u067E\u06CC\u0646 \u0628\u0627\u0634\u062F.", 400);
    if (newOwnerId === camp.owner_id) return error("\u0627\u06CC\u0646 \u0634\u062E\u0635 \u0647\u0645\u200C\u0627\u06A9\u0646\u0648\u0646 \u0645\u0627\u0644\u06A9 \u06A9\u0645\u067E\u06CC\u0646 \u0627\u0633\u062A.", 400);
    await env.DB.prepare("UPDATE campaign_members SET role = 'co_dm' WHERE campaign_id = ? AND user_id = ?").bind(campId, camp.owner_id).run();
    await env.DB.prepare("UPDATE campaign_members SET role = 'owner' WHERE campaign_id = ? AND user_id = ?").bind(campId, newOwnerId).run();
    await env.DB.prepare("UPDATE campaigns SET owner_id = ?, updated_at = ? WHERE id = ?").bind(newOwnerId, now, campId).run();
    await audit("campaign-transfer-ownership", campId, { newOwnerId });
    const updated = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(campId).first();
    const mc = await env.DB.prepare("SELECT COUNT(*) AS n FROM campaign_members WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    const cc = await env.DB.prepare("SELECT COUNT(*) AS n FROM character_participations WHERE campaign_id = ? AND status = 'active'").bind(campId).first();
    return json(mapCampaignRow({ ...updated, my_role: await getMembershipRole(campId, actor.id) || void 0, member_count: mc?.n ?? 0, character_count: cc?.n ?? 0 }));
  }
  const mapDiceRoll = /* @__PURE__ */ __name((r) => ({
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
  }), "mapDiceRoll");
  if (path.match(/^\/c\/[^/]+\/dice$/) && method === "GET") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const isCampaignDm = myRole === "owner" || myRole === "co_dm" || actor.role === "dm";
    const res = await env.DB.prepare(
      "SELECT * FROM dice_rolls WHERE campaign_id = ? ORDER BY created_at DESC, id DESC LIMIT 500"
    ).bind(campId).all();
    let rolls = (res.results || []).map(mapDiceRoll);
    if (!isCampaignDm) {
      rolls = rolls.filter((r) => r.visibility === "table" || r.userId === actor.id);
    }
    const after = url.searchParams.get("after");
    if (after) {
      const idx = rolls.findIndex((r) => r.id === after);
      if (idx !== -1) rolls = rolls.slice(0, idx);
    }
    const limit = Math.max(1, Math.min(200, parseInt(url.searchParams.get("limit") || "50", 10)));
    return json(rolls.slice(0, limit));
  }
  if (path.match(/^\/c\/[^/]+\/dice$/) && method === "POST") {
    const campId = path.split("/")[2];
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const camp = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const settings = parseBlob(camp.settings, {});
    const body = await request.json();
    let vis = body.visibility === "dm_only" ? "dm_only" : "table";
    if (actor.role !== "dm" && vis === "dm_only" && !settings.allowPlayerRollPrivate) vis = "table";
    const rollId = `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const details = {
      rolls: Array.isArray(body.results) ? body.results : [Number(body.total || 0) - Number(body.modifier || 0)],
      modifier: Number(body.modifier || 0),
      advantage: body.mode === "normal" ? void 0 : body.mode,
      isCritical: !!body.nat20,
      isFumble: !!body.nat1,
      label: body.label || "\u067E\u0631\u062A\u0627\u0628 \u062A\u0627\u0633"
    };
    await env.DB.prepare(
      `INSERT INTO dice_rolls (id, campaign_id, user_id, character_id, user_name, character_name, roll_type, dice_expression, total, details, visibility, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      rollId,
      campId,
      actor.id,
      actor.active_character_id || null,
      actor.display_name,
      null,
      String(body.label || "dice_roll"),
      String(body.formula || ""),
      Number(body.total || 0),
      JSON.stringify(details),
      vis,
      now
    ).run();
    const row = await env.DB.prepare("SELECT * FROM dice_rolls WHERE id = ?").bind(rollId).first();
    return json(mapDiceRoll(row), 201);
  }
  const decodeBase64 = /* @__PURE__ */ __name((b64) => {
    const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
    const bin = atob(clean);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }, "decodeBase64");
  const encodeBase64 = /* @__PURE__ */ __name((bytes) => {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }, "encodeBase64");
  if (path === "/media" && method === "POST") {
    const body = await request.json();
    const sizeBytes = Number(body.sizeBytes || 0);
    if (!body.mimeType || !body.dataBase64) return error("\u0641\u0627\u06CC\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
    if (sizeBytes > 150 * 1024) {
      return error("\u062D\u062C\u0645 \u062A\u0635\u0648\u06CC\u0631 \u0646\u0628\u0627\u06CC\u062F \u0628\u06CC\u0634 \u0627\u0632 \u06F1\u06F5\u06F0 \u06A9\u06CC\u0644\u0648\u0628\u0627\u06CC\u062A \u0628\u0627\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u0642\u0628\u0644 \u0627\u0632 \u0627\u0631\u0633\u0627\u0644 \u062A\u0635\u0648\u06CC\u0631 \u0631\u0627 \u0641\u0634\u0631\u062F\u0647 \u06A9\u0646\u06CC\u062F.", 413);
    }
    const quota = await env.DB.prepare("SELECT COALESCE(SUM(size_bytes), 0) AS total FROM media WHERE owner_id = ?").bind(actor.id).first();
    if (Number(quota?.total || 0) + sizeBytes > 5 * 1024 * 1024) {
      return error("\u0633\u0647\u0645\u06CC\u0647 \u0630\u062E\u06CC\u0631\u0647\u200C\u0633\u0627\u0632\u06CC \u0634\u0645\u0627 (\u06F5 \u0645\u06AF\u0627\u0628\u0627\u06CC\u062A) \u067E\u0631 \u0627\u0633\u062A.", 400);
    }
    const bytes = decodeBase64(String(body.dataBase64));
    const mediaId = `media-${Date.now()}-${generateRandomToken(3)}`;
    await env.DB.prepare(
      "INSERT INTO media (id, owner_id, mime_type, size_bytes, data, width, height, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(mediaId, actor.id, String(body.mimeType), sizeBytes, bytes, body.width ?? null, body.height ?? null, now).run();
    const urlOut = String(body.dataBase64).startsWith("data:") ? String(body.dataBase64) : `data:${body.mimeType};base64,${body.dataBase64}`;
    return json({ id: mediaId, url: urlOut, sizeBytes }, 201);
  }
  if (path.match(/^\/media\/[^/]+$/) && method === "GET") {
    const mediaId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT * FROM media WHERE id = ?").bind(mediaId).first();
    if (!row) return error("\u0631\u0633\u0627\u0646\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    let bytes;
    const d = row.data;
    if (d instanceof Uint8Array) bytes = d;
    else if (d instanceof ArrayBuffer) bytes = new Uint8Array(d);
    else if (Array.isArray(d)) bytes = Uint8Array.from(d);
    else if (typeof d === "string") bytes = new TextEncoder().encode(d);
    else bytes = new Uint8Array(0);
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
  if (path.match(/^\/media\/[^/]+$/) && method === "DELETE") {
    const mediaId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM media WHERE id = ?").bind(mediaId).first();
    if (!row) return error("\u0631\u0633\u0627\u0646\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (row.owner_id !== actor.id && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    await env.DB.prepare("DELETE FROM media WHERE id = ?").bind(mediaId).run();
    return json({ success: true });
  }
  if (path.match(/^\/characters\/[^/]+$/) && method === "PATCH") {
    const charId = path.split("/")[2];
    const charData = await request.json();
    const row = await env.DB.prepare("SELECT owner_id, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!row || actor.role !== "dm" && row.owner_id !== actor.id) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (charData.revision != null && row.revision !== charData.revision) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u062A\u0648\u0633\u0637 \u0634\u062E\u0635 \u062F\u06CC\u06AF\u0631\u06CC \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F\u0647 \u0627\u0633\u062A\u061B \u0644\u0637\u0641\u0627\u064B \u062F\u0648\u0628\u0627\u0631\u0647 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u06A9\u0646\u06CC\u062F.", 409);
    }
    const nextRevision = row.revision + 1;
    const updatedChar = { ...charData, revision: nextRevision, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE characters SET name = ?, class_name = ?, level = ?, data = ?, revision = ?, updated_at = ? WHERE id = ?"
    ).bind(
      updatedChar.name || "\u0634\u062E\u0635\u06CC\u062A \u0628\u06CC\u200C\u0646\u0627\u0645",
      updatedChar.className || "",
      updatedChar.level || 1,
      JSON.stringify(updatedChar),
      nextRevision,
      now,
      charId
    ).run();
    return json(updatedChar);
  }
  if (path.match(/^\/characters\/[^/]+\/status$/) && method === "POST") {
    const charId = path.split("/")[2];
    const body = await request.json();
    if (!["active", "retired", "dead", "archived"].includes(body.status)) return error("\u0648\u0636\u0639\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
    const row = await env.DB.prepare("SELECT owner_id, data, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!row || actor.role !== "dm" && row.owner_id !== actor.id) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = parseBlob(row.data, null);
    if (!char) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    char.status = body.status;
    if (body.note !== void 0) char.statusNote = body.note;
    const saved = await saveCharacterBlob(charId, char, Number(row.revision || 0) + 1);
    return json(saved);
  }
  if (path.match(/^\/characters\/[^/]+\/history$/) && method === "GET") {
    const charId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
    if (!row || actor.role !== "dm" && row.owner_id !== actor.id) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const res = await env.DB.prepare(
      `SELECT h.*, c.name AS campaign_name
         FROM character_history_events h
         LEFT JOIN campaigns c ON c.id = h.campaign_id
        WHERE h.character_id = ?
        ORDER BY h.timestamp DESC`
    ).bind(charId).all();
    return json((res.results || []).map((r) => ({
      id: r.id,
      characterId: r.character_id,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name || void 0,
      eventType: r.event_type,
      payload: parseBlob(r.payload, {}),
      timestamp: r.timestamp
    })));
  }
  if (path.match(/^\/characters\/[^/]+\/history$/) && method === "POST") {
    const charId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
    if (!row || actor.role !== "dm" && row.owner_id !== actor.id) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const eventTypes = ["joined", "level_up", "death", "major_deed", "retired", "custom"];
    const eventType = eventTypes.includes(body.eventType) ? body.eventType : "custom";
    let campaignId = null;
    if (body.campaignId) {
      const camp = await env.DB.prepare("SELECT id FROM campaigns WHERE id = ?").bind(body.campaignId).first();
      campaignId = camp ? body.campaignId : null;
    }
    const eventId = `hist-${Date.now()}-${generateRandomToken(3)}`;
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(eventId, charId, campaignId, eventType, JSON.stringify(payload), now).run();
    let campaignName;
    if (campaignId) {
      const camp = await env.DB.prepare("SELECT name FROM campaigns WHERE id = ?").bind(campaignId).first();
      campaignName = camp?.name;
    }
    return json({ id: eventId, characterId: charId, campaignId, campaignName, eventType, payload, timestamp: now }, 201);
  }
  if (path.match(/^\/characters\/[^/]+\/give-item$/) && method === "POST") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0634\u06CC\u0621 \u0627\u0647\u062F\u0627 \u06A9\u0646\u062F.", 403);
    const charId = path.split("/")[2];
    const body = await request.json();
    const item = body.item || {};
    const row = await env.DB.prepare("SELECT data, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!row) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = parseBlob(row.data, null);
    if (!char) return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const invItem = {
      id: `inv-${Date.now()}`,
      name: item.name,
      quantity: 1,
      weight: 1,
      description: item.description,
      category: item.category === "artifact" ? "artifact" : item.category === "weapon" ? "weapon" : "treasure",
      equipped: false,
      isQuestItem: item.category === "quest",
      isNewBadge: true,
      mechanicalEffect: item.mechanicalEffect,
      secretNotes: item.secretNotes,
      weaponData: item.weaponData
    };
    char.inventory = [invItem, ...char.inventory || []];
    if (item.category === "weapon" || item.weaponData) {
      const wData = item.weaponData;
      const newWeapon = {
        id: `w-${Date.now()}`,
        templateId: wData?.id,
        name: wData?.name || item.name,
        damageDice: wData?.damageDice || "1d6",
        damageType: wData?.damageType || "\u0633\u0631\u062F",
        range: wData?.range || "\u0646\u0632\u062F\u06CC\u06A9",
        properties: wData?.properties || "\u2014",
        kind: wData?.kind || "special",
        isSpecial: wData?.kind === "special",
        isShowy: wData?.kind === "showy",
        specialAbility: wData?.specialAbility,
        abilityName: wData?.specialAbility?.name,
        abilityDesc: wData?.specialAbility?.description,
        abilityMaxUses: wData?.specialAbility?.usesPerRest,
        abilityUsed: 0,
        abilityReset: wData?.specialAbility?.restType
      };
      char.weapons = [newWeapon, ...char.weapons || []];
    }
    const saved = await saveCharacterBlob(charId, char, Number(row.revision || 0) + 1);
    return json(saved);
  }
  const PART_SELECT = `
    SELECT p.*, c.name AS campaign_name, ch.data AS char_data
      FROM character_participations p
      JOIN campaigns c ON c.id = p.campaign_id
      LEFT JOIN characters ch ON ch.id = p.character_id
  `;
  const mapParticipation = /* @__PURE__ */ __name((r) => {
    const charBlob = parseBlob(r.char_data, null);
    return {
      id: r.id,
      characterId: r.character_id,
      campaignId: r.campaign_id,
      campaignName: r.campaign_name,
      status: r.status,
      classId: r.class_id || null,
      className: r.class_name || "",
      subclassName: r.subclass_name || void 0,
      level: r.level,
      xp: r.xp,
      abilityScores: parseBlob(r.ability_scores, { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
      currentHp: r.current_hp,
      maxHp: r.max_hp,
      tempHp: r.temp_hp,
      hitDice: parseBlob(r.hit_dice, { current: 0, max: 0, die: "d8" }),
      acOverride: r.ac_override ?? null,
      speedOverride: r.speed_override ?? null,
      deathSaves: parseBlob(r.death_saves, { successes: 0, failures: 0 }),
      conditions: parseBlob(r.conditions, []),
      inventory: parseBlob(r.inventory, []),
      weapons: parseBlob(r.weapons, []),
      currency: parseBlob(r.currency, { gold: 0, silver: 0, copper: 0 }),
      customResources: parseBlob(r.custom_resources, []),
      spellsKnownPrepared: parseBlob(r.spells_known_prepared, void 0),
      spellSlots: parseBlob(r.spell_slots, void 0),
      features: parseBlob(r.features, []),
      notes: r.notes || "",
      dmNotes: r.dm_notes || "",
      pendingLevelUp: parseBlob(r.pending_level_up, null),
      joinedAt: r.joined_at,
      updatedAt: r.updated_at,
      characterName: charBlob?.name,
      characterRace: charBlob?.race,
      characterPortraitUrl: charBlob?.portraitUrl
    };
  }, "mapParticipation");
  if (path.match(/^\/c\/[^/]+\/participations$/) && method === "GET") {
    const cid = path.split("/")[2];
    const camp = await env.DB.prepare("SELECT id FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(cid).first();
    if (camp) {
      const myRole = await getMembershipRole(cid, actor.id);
      if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
      const res2 = await env.DB.prepare(`${PART_SELECT} WHERE p.campaign_id = ? ORDER BY p.joined_at DESC`).bind(cid).all();
      return json((res2.results || []).map(mapParticipation));
    }
    const char = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(cid).first();
    if (!char || char.owner_id !== actor.id && actor.role !== "dm") return json([]);
    const res = await env.DB.prepare(`${PART_SELECT} WHERE p.character_id = ? ORDER BY p.joined_at DESC`).bind(cid).all();
    return json((res.results || []).map(mapParticipation));
  }
  if (path.match(/^\/c\/[^/]+\/participations$/) && method === "POST") {
    const campId = path.split("/")[2];
    const body = await request.json();
    const camp = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ? AND deleted_at IS NULL").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u0627\u0628\u062A\u062F\u0627 \u0628\u0627\u06CC\u062F \u0628\u0647 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u0628\u067E\u06CC\u0648\u0646\u062F\u06CC\u062F.", 403);
    if (!body.characterId) return error("\u0634\u062E\u0635\u06CC\u062A \u0631\u0627 \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F.");
    const settings = parseBlob(camp.settings, {});
    const maxLevel = Number(settings.maxEntryLevel || 20);
    let level = 1;
    if (body.entryMode === "campaign_start") {
      level = Number(settings.startingLevel || 1);
    } else if (body.entryMode === "new_level") {
      level = Math.min(Math.max(1, Number(body.entryLevel || 1)), maxLevel);
    } else if (body.entryMode === "same_level") {
      level = Math.min(Number(body.entryLevel || 1), maxLevel);
    }
    const existing = await env.DB.prepare(
      "SELECT id FROM character_participations WHERE campaign_id = ? AND character_id = ?"
    ).bind(campId, body.characterId).first();
    if (existing) return error("\u0627\u06CC\u0646 \u0634\u062E\u0635\u06CC\u062A \u062F\u0631 \u0627\u06CC\u0646 \u06A9\u0645\u067E\u06CC\u0646 \u062D\u0636\u0648\u0631 \u062F\u0627\u0631\u062F.", 400);
    const charRow = await env.DB.prepare("SELECT owner_id, data FROM characters WHERE id = ?").bind(body.characterId).first();
    if (!charRow || actor.role !== "dm" && charRow.owner_id !== actor.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u0645\u0628\u062F\u0623 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const charBlob = parseBlob(charRow.data, null);
    const hp = 10 + (level - 1) * 6;
    const initialStatus = settings.approval?.onCreate ? "pending_approval" : "active";
    const partId = `part-${Date.now()}-${generateRandomToken(3)}`;
    const abilityScores = JSON.stringify({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 });
    const hitDice = JSON.stringify({ current: level, max: level, die: "d8" });
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
      partId,
      body.characterId,
      campId,
      initialStatus,
      "\u0645\u0627\u062C\u0631\u0627\u062C\u0648",
      level,
      abilityScores,
      hp,
      hp,
      hitDice,
      deathSaves,
      currency,
      now,
      now
    ).run();
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at) VALUES (?, ?, 'player', 'active', ?)
       ON CONFLICT(campaign_id, user_id) DO NOTHING`
    ).bind(campId, actor.id, now).run();
    const campName = camp.name;
    await env.DB.prepare(
      "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(
      `hist-${Date.now()}-${generateRandomToken(3)}`,
      body.characterId,
      campId,
      "joined",
      JSON.stringify({
        title: `\u067E\u06CC\u0648\u0633\u062A\u0646 \u0628\u0647 \u06A9\u0645\u067E\u06CC\u0646 ${campName}`,
        description: `\u0648\u0631\u0648\u062F \u062F\u0631 \u062D\u0627\u0644\u062A ${body.entryMode === "campaign_start" ? "\u0634\u0631\u0648\u0639 \u06A9\u0645\u067E\u06CC\u0646" : "\u0633\u0637\u062D " + level} (\u0633\u0637\u062D ${level})`,
        level
      }),
      now
    ).run();
    await audit("participation-create", partId, { campaignId: campId, characterId: body.characterId, status: initialStatus });
    const created = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(created), 201);
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+$/) && method === "PATCH") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const part = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!part) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    const charRow = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(part.character_id).first();
    const isCharOwner = charRow?.owner_id === actor.id;
    if (actor.role !== "dm" && myRole !== "owner" && myRole !== "co_dm" && !isCharOwner) {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    }
    const body = await request.json();
    const colMap = {
      status: "status",
      level: "level",
      xp: "xp",
      className: "class_name",
      subclassName: "subclass_name",
      classId: "class_id",
      currentHp: "current_hp",
      maxHp: "max_hp",
      tempHp: "temp_hp",
      acOverride: "ac_override",
      speedOverride: "speed_override",
      notes: "notes",
      dmNotes: "dm_notes",
      abilityScores: "ability_scores",
      hitDice: "hit_dice",
      deathSaves: "death_saves",
      conditions: "conditions",
      inventory: "inventory",
      weapons: "weapons",
      currency: "currency",
      customResources: "custom_resources",
      spellsKnownPrepared: "spells_known_prepared",
      spellSlots: "spell_slots",
      features: "features",
      pendingLevelUp: "pending_level_up"
    };
    const sets = [];
    const binds = [];
    for (const [key, col] of Object.entries(colMap)) {
      if (body[key] === void 0) continue;
      if (key === "status" && !["pending_approval", "active", "rejected", "retired", "dead"].includes(body[key])) {
        return error("\u0648\u0636\u0639\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
      }
      const value = body[key];
      sets.push(`${col} = ?`);
      binds.push(value !== null && typeof value === "object" ? JSON.stringify(value) : value);
    }
    if (sets.length > 0) {
      sets.push("updated_at = ?");
      binds.push(now);
      binds.push(partId, campId);
      await env.DB.prepare(`UPDATE character_participations SET ${sets.join(", ")} WHERE id = ? AND campaign_id = ?`).bind(...binds).run();
    }
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/(approve|reject|request_changes)$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const action = parts[5];
    if (!await requireCampaignDm(campId)) return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const part = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!part) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json().catch(() => ({}));
    const comment = body?.comment || "";
    const pending = parseBlob(part.pending_level_up, null);
    let nextStatus = part.status;
    let nextLevel = part.level;
    let nextPending = null;
    if (action === "approve") {
      if (pending) {
        nextLevel = Number(pending.targetLevel || part.level);
        nextPending = null;
        const camp = await env.DB.prepare("SELECT name FROM campaigns WHERE id = ?").bind(campId).first();
        await env.DB.prepare(
          "INSERT INTO character_history_events (id, character_id, campaign_id, event_type, payload, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
        ).bind(
          `hist-lvl-${Date.now()}-${generateRandomToken(3)}`,
          part.character_id,
          campId,
          "level_up",
          JSON.stringify({
            title: `\u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u0628\u0647 ${nextLevel} \u062A\u0623\u06CC\u06CC\u062F \u0634\u062F`,
            oldLevel: part.level,
            newLevel: nextLevel,
            description: comment || "\u062A\u0623\u06CC\u06CC\u062F \u0627\u0631\u062A\u0642\u0627\u06CC \u0633\u0637\u062D \u062A\u0648\u0633\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631",
            campaignName: camp?.name
          }),
          now
        ).run();
      } else {
        nextStatus = "active";
      }
    } else if (action === "reject") {
      nextPending = null;
      if (!pending) nextStatus = "rejected";
    }
    await env.DB.prepare(
      "UPDATE character_participations SET status = ?, level = ?, pending_level_up = ?, updated_at = ? WHERE id = ? AND campaign_id = ?"
    ).bind(nextStatus, nextLevel, nextPending ? JSON.stringify(nextPending) : null, now, partId, campId).run();
    await audit(`participation-${action}`, partId, { campaignId: campId, comment });
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/level-up-request$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const part = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!part) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (!myRole && actor.role !== "dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const camp = await env.DB.prepare("SELECT settings FROM campaigns WHERE id = ?").bind(campId).first();
    const settings = parseBlob(camp?.settings, {});
    const body = await request.json();
    const targetLevel = Number(body.targetLevel || part.level + 1);
    if (targetLevel < 1 || targetLevel > Number(settings.maxEntryLevel || 20)) {
      return error("\u0633\u0637\u062D \u0647\u062F\u0641 \u062E\u0627\u0631\u062C \u0627\u0632 \u0645\u062D\u062F\u0648\u062F\u0647 \u0645\u062C\u0627\u0632 \u06A9\u0645\u067E\u06CC\u0646 \u0627\u0633\u062A.");
    }
    if (settings.approval?.onLevelUp) {
      const pending = { targetLevel, diff: body.diff || {}, requestedAt: now };
      await env.DB.prepare("UPDATE character_participations SET pending_level_up = ?, updated_at = ? WHERE id = ? AND campaign_id = ?").bind(JSON.stringify(pending), now, partId, campId).run();
    } else {
      await env.DB.prepare("UPDATE character_participations SET level = ?, updated_at = ? WHERE id = ? AND campaign_id = ?").bind(targetLevel, now, partId, campId).run();
    }
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }
  if (path.match(/^\/c\/[^/]+\/participations\/[^/]+\/status$/) && method === "POST") {
    const parts = path.split("/");
    const campId = parts[2];
    const partId = parts[4];
    const part = await env.DB.prepare("SELECT * FROM character_participations WHERE id = ? AND campaign_id = ?").bind(partId, campId).first();
    if (!part) return error("\u0645\u0634\u0627\u0631\u06A9\u062A \u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const myRole = await getMembershipRole(campId, actor.id);
    if (actor.role !== "dm" && myRole !== "owner" && myRole !== "co_dm") return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A.", 403);
    const body = await request.json();
    if (!["pending_approval", "active", "rejected", "retired", "dead"].includes(body.status)) {
      return error("\u0648\u0636\u0639\u06CC\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
    }
    await env.DB.prepare("UPDATE character_participations SET status = ?, updated_at = ? WHERE id = ? AND campaign_id = ?").bind(body.status, now, partId, campId).run();
    const updated = await env.DB.prepare(`${PART_SELECT} WHERE p.id = ?`).bind(partId).first();
    return json(mapParticipation(updated));
  }
  if (path.match(/^\/items\/[^/]+$/) && method === "PUT") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0646\u062F.", 403);
    const itemId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT id FROM items WHERE id = ?").bind(itemId).first();
    if (!row) return error("\u0634\u06CC\u0621 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const data = await request.json();
    const updated = { ...data, id: itemId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE items SET name = ?, category = ?, is_revealed = ?, data = ?, updated_at = ? WHERE id = ?"
    ).bind(updated.name || "\u0634\u06CC\u0621", updated.category || "general", updated.isRevealed ? 1 : 0, JSON.stringify(updated), now, itemId).run();
    return json(updated);
  }
  if (path.match(/^\/items\/[^/]+$/) && method === "DELETE") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062D\u0630\u0641 \u06A9\u0646\u062F.", 403);
    const itemId = path.split("/")[2];
    const res = await env.DB.prepare("DELETE FROM items WHERE id = ?").bind(itemId).run();
    if ((res?.meta?.changes ?? 0) === 0) return error("\u0634\u06CC\u0621 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await audit("item-delete", itemId, {});
    return json({ success: true });
  }
  if (path === "/rewards" && method === "POST") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u067E\u0627\u062F\u0627\u0634 \u0628\u0633\u0627\u0632\u062F.", 403);
    const body = await request.json();
    const rewardId = `rew-${Date.now()}-${generateRandomToken(3)}`;
    const newRew = {
      ...body,
      id: rewardId,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.DB.prepare(
      "INSERT INTO rewards (id, scope_type, scope_id, created_by, title, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(rewardId, "campaign", "zorvania-c1", actor.id, newRew.title || "\u067E\u0627\u062F\u0627\u0634", JSON.stringify(newRew), now).run();
    return json(newRew, 201);
  }
  if (path.match(/^\/rewards\/[^/]+\/distribute$/) && method === "POST") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u067E\u0627\u062F\u0627\u0634 \u062A\u0648\u0632\u06CC\u0639 \u06A9\u0646\u062F.", 403);
    const rewardId = path.split("/")[2];
    const body = await request.json();
    const charIds = Array.isArray(body.characterIds) ? body.characterIds : [];
    const rewRow = await env.DB.prepare("SELECT data FROM rewards WHERE id = ?").bind(rewardId).first();
    if (!rewRow) return error("\u067E\u0627\u062F\u0627\u0634 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const rew = parseBlob(rewRow.data, {}) || {};
    const rows = await loadCharacterBlobs();
    const updated = [];
    for (const row of rows) {
      const char = parseBlob(row.data, null);
      if (!char) continue;
      if (!charIds.includes(row.id)) {
        updated.push(char);
        continue;
      }
      const currencies = { gold: 0, silver: 0, copper: 0, ...char.currencies || {} };
      currencies.gold = Number(currencies.gold || 0) + Number(rew.gold || 0);
      currencies.silver = Number(currencies.silver || 0) + Number(rew.silver || 0);
      const newItems = (rew.items || []).map((it) => ({
        ...it,
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
      }));
      char.currencies = currencies;
      char.inventory = [...newItems, ...char.inventory || []];
      const saved = await saveCharacterBlob(row.id, char, Number(row.revision || 0) + 1);
      updated.push(saved);
    }
    return json(updated);
  }
  if (path === "/campaign-notes" && method === "POST") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0628\u0646\u0648\u06CC\u0633\u062F.", 403);
    const body = await request.json();
    const noteId = `cn-${Date.now()}-${generateRandomToken(3)}`;
    const newNote = { ...body, id: noteId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "INSERT INTO campaign_notes (id, scope_type, scope_id, title, category, session_number, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(noteId, "campaign", "zorvania-c1", newNote.title || "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A", newNote.category || "session", newNote.sessionNumber || null, JSON.stringify(newNote), now).run();
    return json(newNote, 201);
  }
  if (path.match(/^\/campaign-notes\/[^/]+$/) && method === "PUT") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0646\u062F.", 403);
    const noteId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT id FROM campaign_notes WHERE id = ?").bind(noteId).first();
    if (!row) return error("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const updated = { ...body, id: noteId, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE campaign_notes SET title = ?, category = ?, session_number = ?, data = ?, updated_at = ? WHERE id = ?"
    ).bind(updated.title || "\u06CC\u0627\u062F\u062F\u0627\u0634\u062A", updated.category || "session", updated.sessionNumber || null, JSON.stringify(updated), now, noteId).run();
    return json(updated);
  }
  if (path.match(/^\/campaign-notes\/[^/]+$/) && method === "DELETE") {
    if (actor.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u062F \u062D\u0630\u0641 \u06A9\u0646\u062F.", 403);
    const noteId = path.split("/")[2];
    const res = await env.DB.prepare("DELETE FROM campaign_notes WHERE id = ?").bind(noteId).run();
    if ((res?.meta?.changes ?? 0) === 0) return error("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await audit("campaign-note-delete", noteId, {});
    return json({ success: true });
  }
  if (path === "/me" && method === "PATCH") {
    const body = await request.json();
    const displayName = String(body.displayName || "").trim();
    if (!displayName || displayName.length < 2 || displayName.length > 40) {
      return error("\u0646\u0627\u0645 \u0646\u0645\u0627\u06CC\u0634\u06CC \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 \u06F2 \u062A\u0627 \u06F4\u06F0 \u0646\u0648\u06CC\u0633\u0647 \u0628\u0627\u0634\u062F.");
    }
    await env.DB.prepare("UPDATE users SET display_name = ? WHERE id = ?").bind(displayName, currentUser.id).run();
    await audit("update-profile", currentUser.id, { displayName });
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
  if (path === "/me/password" && method === "POST") {
    const body = await request.json();
    const currentPass = String(body.currentPassword || "");
    const newPass = String(body.newPassword || "");
    const { valid } = await verifyPassword(currentPass, currentUser.password_hash);
    if (!valid) {
      return error("\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0641\u0639\u0644\u06CC \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 400);
    }
    const passErr = validatePassword(newPass, currentUser.email, currentUser.display_name);
    if (passErr) return error(passErr);
    const newHash = await hashPassword(newPass);
    await env.DB.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").bind(newHash, currentUser.id).run();
    if (currentSession) {
      await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND id != ?").bind(now, currentUser.id, currentSession.id).run();
    }
    await audit("password-change", currentUser.id);
    return json({ success: true, message: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A." });
  }
  if (path === "/me/email" && method === "POST") {
    const body = await request.json();
    const currentPass = String(body.currentPassword || "");
    const newEmail = String(body.newEmail || "").toLowerCase().trim();
    if (!newEmail || !newEmail.includes("@")) {
      return error("\u0627\u06CC\u0645\u06CC\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.");
    }
    const { valid } = await verifyPassword(currentPass, currentUser.password_hash);
    if (!valid) {
      return error("\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0641\u0639\u0644\u06CC \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A.", 400);
    }
    const exists = await env.DB.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(newEmail, currentUser.id).first();
    if (exists) {
      return error("\u0627\u06CC\u0646 \u0627\u06CC\u0645\u06CC\u0644 \u062A\u0648\u0633\u0637 \u06A9\u0627\u0631\u0628\u0631 \u062F\u06CC\u06AF\u0631\u06CC \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A.", 409);
    }
    await env.DB.prepare("UPDATE users SET email = ? WHERE id = ?").bind(newEmail, currentUser.id).run();
    await audit("email-change", currentUser.id, { newEmail });
    return json({
      id: currentUser.id,
      email: newEmail,
      name: currentUser.display_name,
      displayName: currentUser.display_name,
      role: currentUser.role
    });
  }
  if (path === "/me/sessions" && method === "GET") {
    const res = await env.DB.prepare(
      "SELECT id, user_id, created_at, last_seen_at, expires_at, absolute_expires_at, user_agent, ip_hash FROM sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY last_seen_at DESC"
    ).bind(currentUser.id, now).all();
    const sessions = (res.results || []).map((s) => ({
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
  if (path.match(/^\/me\/sessions\/[^/]+$/) && method === "DELETE") {
    const targetSessionId = path.split("/")[3];
    await env.DB.prepare(
      "UPDATE sessions SET revoked_at = ? WHERE id = ? AND user_id = ?"
    ).bind(now, targetSessionId, currentUser.id).run();
    if (targetSessionId === currentSession?.id) {
      return json({ message: "\u0646\u0634\u0633\u062A \u0641\u0639\u0644\u06CC \u0644\u063A\u0648 \u0634\u062F." }, 200, { "Set-Cookie": clearSessionCookie() });
    }
    return json({ success: true });
  }
  if (path === "/me/active-character" && method === "PUT") {
    const body = await request.json();
    const charId = body.characterId;
    if (charId) {
      const char = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
      if (!char) return error("\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
      if (currentUser.role !== "dm" && char.owner_id !== currentUser.id) {
        return error("\u0634\u0645\u0627 \u0645\u0627\u0644\u06A9 \u0627\u06CC\u0646 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0646\u06CC\u0633\u062A\u06CC\u062F.", 404);
      }
    }
    await env.DB.prepare("UPDATE users SET active_character_id = ? WHERE id = ?").bind(charId || null, currentUser.id).run();
    return json({ success: true, activeCharacterId: charId });
  }
  if (path === "/me/export" && method === "GET") {
    const charRows = await env.DB.prepare("SELECT data FROM characters WHERE owner_id = ?").bind(currentUser.id).all();
    const noteRows = await env.DB.prepare("SELECT data FROM notes WHERE owner_id = ?").bind(currentUser.id).all();
    const exportData = {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.display_name,
        role: currentUser.role
      },
      characters: (charRows.results || []).map((r) => JSON.parse(r.data)),
      notes: (noteRows.results || []).map((r) => JSON.parse(r.data)),
      exportedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return json(exportData);
  }
  if (path.startsWith("/users") || path.startsWith("/invites") || path.startsWith("/audit")) {
    if (currentUser.role !== "dm") {
      return error("\u062F\u0633\u062A\u0631\u0633\u06CC \u0645\u062C\u0627\u0632 \u0646\u06CC\u0633\u062A\u061B \u0646\u06CC\u0627\u0632\u0645\u0646\u062F \u0646\u0642\u0634 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631.", 403);
    }
  }
  if (path === "/users" && method === "GET") {
    const search = url.searchParams.get("search") || "";
    const roleFilter = url.searchParams.get("role");
    const statusFilter = url.searchParams.get("status");
    let query = "SELECT * FROM users WHERE deleted_at IS NULL";
    const params = [];
    if (roleFilter && (roleFilter === "dm" || roleFilter === "player")) {
      query += " AND role = ?";
      params.push(roleFilter);
    }
    if (statusFilter && (statusFilter === "active" || statusFilter === "disabled")) {
      query += " AND status = ?";
      params.push(statusFilter);
    }
    query += " ORDER BY created_at DESC";
    const usersRes = await env.DB.prepare(query).bind(...params).all();
    let usersList = usersRes.results || [];
    if (search) {
      const s = search.toLowerCase();
      usersList = usersList.filter((u) => u.display_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    const charRes = await env.DB.prepare("SELECT id, owner_id, name FROM characters").all();
    const charsByOwner = {};
    for (const c of charRes.results || []) {
      if (c.owner_id) {
        if (!charsByOwner[c.owner_id]) charsByOwner[c.owner_id] = [];
        charsByOwner[c.owner_id].push(c.name);
      }
    }
    const sessRes = await env.DB.prepare(
      "SELECT user_id, COUNT(*) as c FROM sessions WHERE revoked_at IS NULL AND expires_at > ? GROUP BY user_id"
    ).bind(now).all();
    const sessionCountByUser = {};
    for (const s of sessRes.results || []) {
      sessionCountByUser[s.user_id] = s.c;
    }
    const results = usersList.map((u) => ({
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
  if (path.match(/^\/users\/[^/]+$/) && method === "PATCH") {
    const targetUserId = path.split("/")[2];
    const body = await request.json();
    const targetUser = await env.DB.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUserId).first();
    if (!targetUser) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const isTargetProtectedDm = dmEmails.includes(targetUser.email.toLowerCase());
    if (body.role && body.role !== targetUser.role) {
      if (isTargetProtectedDm && body.role !== "dm") {
        return error("\u0627\u0645\u06A9\u0627\u0646 \u062A\u0646\u0632\u0644 \u0631\u062A\u0628\u0647 \u0627\u06CC\u0645\u06CC\u0644\u200C\u0647\u0627\u06CC \u0627\u0635\u0644\u06CC \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 403);
      }
      if (targetUser.role === "dm" && body.role === "player") {
        const dmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
        if ((dmCount?.c || 0) <= 1) {
          return error("\u062D\u062F\u0627\u0642\u0644 \u06CC\u06A9 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0641\u0639\u0627\u0644 \u0628\u0627\u06CC\u062F \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u0628\u0627\u0642\u06CC \u0628\u0645\u0627\u0646\u062F.", 400);
        }
      }
    }
    if (body.status && body.status !== targetUser.status) {
      if (isTargetProtectedDm && body.status === "disabled") {
        return error("\u0627\u0645\u06A9\u0627\u0646 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u06A9\u0631\u062F\u0646 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0627\u0635\u0644\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 403);
      }
      if (targetUser.role === "dm" && body.status === "disabled") {
        const activeDmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
        if ((activeDmCount?.c || 0) <= 1) {
          return error("\u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646 \u062A\u0646\u0647\u0627 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0641\u0639\u0627\u0644 \u0631\u0627 \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u06A9\u0631\u062F.", 400);
        }
      }
    }
    const nextDisplayName = body.displayName ? String(body.displayName).trim() : targetUser.display_name;
    const nextRole = body.role === "dm" || body.role === "player" ? body.role : targetUser.role;
    const nextStatus = body.status === "active" || body.status === "disabled" ? body.status : targetUser.status;
    await env.DB.prepare(
      "UPDATE users SET display_name = ?, role = ?, status = ? WHERE id = ?"
    ).bind(nextDisplayName, nextRole, nextStatus, targetUserId).run();
    if (nextStatus === "disabled") {
      await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUserId).run();
    }
    await audit("user-update", targetUserId, { displayName: nextDisplayName, role: nextRole, status: nextStatus });
    return json({
      id: targetUserId,
      email: targetUser.email,
      name: nextDisplayName,
      displayName: nextDisplayName,
      role: nextRole,
      status: nextStatus
    });
  }
  if (path.match(/^\/users\/[^/]+\/reset-token$/) && method === "POST") {
    const targetUserId = path.split("/")[2];
    const targetUser = await env.DB.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUserId).first();
    if (!targetUser) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const resetToken = generateRandomToken(32);
    const tokenHash = await sha256Hex(resetToken);
    const resetId = `reset-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + 24 * 60 * 60 * 1e3;
    await env.DB.prepare(
      "INSERT INTO password_resets (id, user_id, token_hash, created_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(resetId, targetUserId, tokenHash, currentUser.id, now, expiresAt).run();
    await audit("create-reset-token", targetUserId);
    const resetLink = `${url.origin}/#reset-password?token=${resetToken}`;
    return json({
      resetToken,
      resetLink,
      expiresAt
    });
  }
  if (path.match(/^\/users\/[^/]+\/revoke-sessions$/) && method === "POST") {
    const targetUserId = path.split("/")[2];
    await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUserId).run();
    await audit("revoke-user-sessions", targetUserId);
    return json({ success: true, message: "\u062A\u0645\u0627\u0645 \u0646\u0634\u0633\u062A\u200C\u0647\u0627\u06CC \u06A9\u0627\u0631\u0628\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0644\u063A\u0648 \u0634\u062F\u0646\u062F." });
  }
  if (path.match(/^\/users\/[^/]+\/assign-character$/) && method === "POST") {
    const targetUserId = path.split("/")[2];
    const body = await request.json();
    const charId = body.characterId;
    const targetUser = await env.DB.prepare("SELECT id, active_character_id FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUserId).first();
    if (!targetUser) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const char = await env.DB.prepare("SELECT id FROM characters WHERE id = ?").bind(charId).first();
    if (!char) return error("\u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    await env.DB.prepare("UPDATE characters SET owner_id = ? WHERE id = ?").bind(targetUserId, charId).run();
    if (!targetUser.active_character_id) {
      await env.DB.prepare("UPDATE users SET active_character_id = ? WHERE id = ?").bind(charId, targetUserId).run();
    }
    await audit("assign-character", targetUserId, { characterId: charId });
    return json({ success: true });
  }
  if (path.match(/^\/users\/[^/]+$/) && method === "DELETE") {
    const targetUserId = path.split("/")[2];
    if (targetUserId === currentUser.id) {
      return error("\u0634\u0645\u0627 \u0646\u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062E\u0648\u062F \u0631\u0627 \u062D\u0630\u0641 \u06A9\u0646\u06CC\u062F.", 400);
    }
    const targetUser = await env.DB.prepare("SELECT * FROM users WHERE id = ? AND deleted_at IS NULL").bind(targetUserId).first();
    if (!targetUser) return error("\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (dmEmails.includes(targetUser.email.toLowerCase())) {
      return error("\u0627\u0645\u06A9\u0627\u0646 \u062D\u0630\u0641 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0627\u0635\u0644\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 403);
    }
    if (targetUser.role === "dm") {
      const dmCount = await env.DB.prepare("SELECT COUNT(*) as c FROM users WHERE role = 'dm' AND status = 'active' AND deleted_at IS NULL").first();
      if ((dmCount?.c || 0) <= 1) {
        return error("\u0627\u0645\u06A9\u0627\u0646 \u062D\u0630\u0641 \u062A\u0646\u0647\u0627 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0641\u0639\u0627\u0644 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.", 400);
      }
    }
    await env.DB.prepare("UPDATE users SET deleted_at = ?, status = ? WHERE id = ?").bind(now, "disabled", targetUserId).run();
    await env.DB.prepare("UPDATE sessions SET revoked_at = ? WHERE user_id = ?").bind(now, targetUserId).run();
    await env.DB.prepare("UPDATE characters SET owner_id = NULL WHERE owner_id = ?").bind(targetUserId).run();
    await audit("user-delete", targetUserId);
    return json({ success: true, message: "\u06A9\u0627\u0631\u0628\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062D\u0630\u0641 \u0634\u062F." });
  }
  if (path === "/invites" && method === "POST") {
    const body = await request.json();
    const label = String(body.label || "\u062F\u0639\u0648\u062A \u062C\u062F\u06CC\u062F").trim();
    const expiresInDays = Math.max(1, Math.min(365, parseInt(body.expiresInDays || 30, 10)));
    const maxUses = Math.max(1, parseInt(body.maxUses || 1, 10));
    const assignCharacterId = body.assignCharacterId || null;
    const rawCode = generateRandomToken(16);
    const codeHash = await sha256Hex(rawCode);
    const inviteId = `inv-${Date.now()}-${generateRandomToken(4)}`;
    const expiresAt = now + expiresInDays * 24 * 60 * 60 * 1e3;
    await env.DB.prepare(
      "INSERT INTO invites (id, code_hash, label, created_by, created_at, expires_at, max_uses, used_count, assign_character_id) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)"
    ).bind(inviteId, codeHash, label, currentUser.id, now, expiresAt, maxUses, assignCharacterId).run();
    await audit("invite-create", inviteId, { label, maxUses, expiresAt, assignCharacterId });
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
  if (path === "/invites" && method === "GET") {
    const res = await env.DB.prepare("SELECT * FROM invites ORDER BY created_at DESC").all();
    const invites = (res.results || []).map((r) => {
      let status = "active";
      if (r.revoked_at) status = "revoked";
      else if (r.expires_at > 0 && r.expires_at < now) status = "expired";
      else if (r.used_count >= r.max_uses) status = "used";
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
  if (path.match(/^\/invites\/[^/]+$/) && method === "DELETE") {
    const inviteId = path.split("/")[2];
    await env.DB.prepare("UPDATE invites SET revoked_at = ? WHERE id = ?").bind(now, inviteId).run();
    await audit("invite-revoke", inviteId);
    return json({ success: true });
  }
  if (path === "/audit" && method === "GET") {
    const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "100", 10)));
    const res = await env.DB.prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT ?").bind(limit).all();
    const items = (res.results || []).map((r) => ({
      id: r.id,
      actorId: r.actor_id,
      action: r.action,
      targetId: r.target_id,
      meta: r.meta ? JSON.parse(r.meta) : null,
      createdAt: r.created_at
    }));
    return json(items);
  }
  if (path === "/characters" && method === "GET") {
    let results = [];
    if (currentUser.role === "dm") {
      const stmt = await env.DB.prepare("SELECT data FROM characters").all();
      results = stmt.results || [];
    } else {
      const stmt = await env.DB.prepare("SELECT data FROM characters WHERE owner_id = ?").bind(currentUser.id).all();
      results = stmt.results || [];
    }
    return json(results.map((row) => JSON.parse(row.data)));
  }
  if (path.match(/^\/characters\/[^/]+$/) && method === "GET") {
    const charId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id, data FROM characters WHERE id = ?").bind(charId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    return json(JSON.parse(row.data));
  }
  if (path === "/characters" && method === "POST") {
    const charData = await request.json();
    const charId = `char-${Date.now()}-${generateRandomToken(4)}`;
    const newChar = {
      ...charData,
      id: charId,
      ownerId: currentUser.id,
      revision: 1,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.DB.prepare(
      "INSERT INTO characters (id, owner_id, name, class_name, level, data, revision, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      charId,
      currentUser.id,
      newChar.name || "\u0634\u062E\u0635\u06CC\u062A \u0646\u0648",
      newChar.className || "",
      newChar.level || 1,
      JSON.stringify(newChar),
      1,
      now
    ).run();
    if (!currentUser.active_character_id) {
      await env.DB.prepare("UPDATE users SET active_character_id = ? WHERE id = ?").bind(charId, currentUser.id).run();
    }
    return json(newChar, 201);
  }
  if (path.match(/^\/characters\/[^/]+$/) && method === "PUT") {
    const charId = path.split("/")[2];
    const charData = await request.json();
    const row = await env.DB.prepare("SELECT owner_id, revision FROM characters WHERE id = ?").bind(charId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    if (row.revision !== charData.revision) {
      return error("\u062A\u0639\u0627\u0631\u0636 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647\u200C\u0633\u0627\u0632\u06CC: \u062F\u0627\u062F\u0647\u200C\u0647\u0627 \u062A\u0648\u0633\u0637 \u06A9\u0627\u0631\u0628\u0631 \u062F\u06CC\u06AF\u0631\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A\u0647\u200C\u0627\u0646\u062F.", 409);
    }
    const nextRevision = row.revision + 1;
    const updatedChar = {
      ...charData,
      revision: nextRevision,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.DB.prepare(
      "UPDATE characters SET name = ?, class_name = ?, level = ?, data = ?, revision = ?, updated_at = ? WHERE id = ?"
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
  if (path.match(/^\/characters\/[^/]+$/) && method === "DELETE") {
    const charId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM characters WHERE id = ?").bind(charId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    await env.DB.prepare("DELETE FROM characters WHERE id = ?").bind(charId).run();
    return json({ success: true });
  }
  if (path === "/notes" && method === "GET") {
    const charFilter = url.searchParams.get("characterId");
    let stmt;
    if (currentUser.role === "dm") {
      stmt = charFilter ? env.DB.prepare("SELECT data FROM notes WHERE character_id = ? AND (shared_with_dm = 1 OR owner_id = ?)").bind(charFilter, currentUser.id) : env.DB.prepare("SELECT data FROM notes WHERE shared_with_dm = 1 OR owner_id = ?").bind(currentUser.id);
    } else {
      stmt = charFilter ? env.DB.prepare("SELECT data FROM notes WHERE owner_id = ? AND character_id = ?").bind(currentUser.id, charFilter) : env.DB.prepare("SELECT data FROM notes WHERE owner_id = ?").bind(currentUser.id);
    }
    const res = await stmt.all();
    return json((res.results || []).map((r) => JSON.parse(r.data)));
  }
  if (path === "/notes" && method === "POST") {
    const noteData = await request.json();
    const noteId = `note-${Date.now()}-${generateRandomToken(4)}`;
    const newNote = {
      ...noteData,
      id: noteId,
      ownerId: currentUser.id,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    await env.DB.prepare(
      "INSERT INTO notes (id, character_id, owner_id, title, shared_with_dm, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
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
  if (path.match(/^\/notes\/[^/]+$/) && method === "PUT") {
    const noteId = path.split("/")[2];
    const noteData = await request.json();
    const row = await env.DB.prepare("SELECT owner_id FROM notes WHERE id = ?").bind(noteId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const updated = { ...noteData, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE notes SET title = ?, shared_with_dm = ?, data = ?, updated_at = ? WHERE id = ?"
    ).bind(updated.title, updated.sharedWithDm ? 1 : 0, JSON.stringify(updated), now, noteId).run();
    return json(updated);
  }
  if (path.match(/^\/notes\/[^/]+$/) && method === "DELETE") {
    const noteId = path.split("/")[2];
    const row = await env.DB.prepare("SELECT owner_id FROM notes WHERE id = ?").bind(noteId).first();
    if (!row || currentUser.role !== "dm" && row.owner_id !== currentUser.id) {
      return error("\u06CC\u0627\u062F\u062F\u0627\u0634\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    await env.DB.prepare("DELETE FROM notes WHERE id = ?").bind(noteId).run();
    return json({ success: true });
  }
  if (path === "/npcs" && method === "GET") {
    let stmt;
    if (currentUser.role === "dm") {
      stmt = env.DB.prepare("SELECT data FROM npcs");
    } else {
      stmt = env.DB.prepare("SELECT data FROM npcs WHERE is_revealed = 1");
    }
    const res = await stmt.all();
    return json((res.results || []).map((r) => JSON.parse(r.data)));
  }
  if (path === "/npcs" && method === "POST") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = `npc-${Date.now()}`;
    const newNpc = { ...data, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "INSERT INTO npcs (id, scope_type, scope_id, name, type, is_revealed, location_tag, session_tag, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, "campaign", "zorvania-c1", newNpc.name, newNpc.type, newNpc.isRevealed ? 1 : 0, newNpc.locationTag || "", newNpc.sessionTag || "", JSON.stringify(newNpc), now).run();
    return json(newNpc, 201);
  }
  if (path.match(/^\/npcs\/[^/]+$/) && method === "PUT") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    const data = await request.json();
    const updated = { ...data, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "UPDATE npcs SET name = ?, type = ?, is_revealed = ?, location_tag = ?, session_tag = ?, data = ?, updated_at = ? WHERE id = ?"
    ).bind(updated.name, updated.type, updated.isRevealed ? 1 : 0, updated.locationTag || "", updated.sessionTag || "", JSON.stringify(updated), now, id).run();
    return json(updated);
  }
  if (path.match(/^\/npcs\/[^/]+$/) && method === "DELETE") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    await env.DB.prepare("DELETE FROM npcs WHERE id = ?").bind(id).run();
    return json({ success: true });
  }
  if (path === "/items" && method === "GET") {
    let stmt;
    if (currentUser.role === "dm") {
      stmt = env.DB.prepare("SELECT data FROM items");
    } else {
      stmt = env.DB.prepare("SELECT data FROM items WHERE is_revealed = 1");
    }
    const res = await stmt.all();
    return json((res.results || []).map((r) => JSON.parse(r.data)));
  }
  if (path === "/items" && method === "POST") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = `item-${Date.now()}`;
    const newItem = { ...data, id, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
    await env.DB.prepare(
      "INSERT INTO items (id, scope_type, scope_id, name, category, is_revealed, data, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, "campaign", "zorvania-c1", newItem.name, newItem.category, newItem.isRevealed ? 1 : 0, JSON.stringify(newItem), now).run();
    return json(newItem, 201);
  }
  if (path === "/live" && method === "GET") {
    if (!env.DB) {
      return json({ activeEncounterId: null, version: 0, serverTime: Date.now() }, 200, {
        "Cache-Control": "no-store, no-cache, must-revalidate"
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
      { "Cache-Control": "no-store, no-cache, must-revalidate" }
    );
  }
  if (path === "/locations" && method === "GET") {
    if (!env.DB) return json([]);
    if (currentUser?.role === "dm") {
      const res = await env.DB.prepare("SELECT * FROM locations ORDER BY created_at ASC").all();
      const list = (res.results || []).map((r) => ({
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
      const res = await env.DB.prepare(
        "SELECT id, name, region, description, image_url, revealed, parent_id, created_at, updated_at FROM locations WHERE revealed = 1 ORDER BY name ASC"
      ).all();
      const list = (res.results || []).map((r) => ({
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
  if (path === "/locations" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = `loc-${Date.now()}-${generateRandomToken(4)}`;
    const locName = String(data.name || "").trim();
    if (!locName) return error("\u0646\u0627\u0645 \u0645\u06A9\u0627\u0646 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const region = data.region || "\u0648\u0631\u0646\u0627";
    const desc = data.description || "";
    const imgUrl = data.imageUrl || "";
    const dmNotes = data.dmNotes || "";
    const revealed = data.revealed ? 1 : 0;
    const parentId = data.parentId || null;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO locations (id, scope_type, scope_id, name, region, description, image_url, dm_notes, revealed, parent_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, "campaign", "zorvania-c1", locName, region, desc, imgUrl, dmNotes, revealed, parentId, t, t).run();
    await audit("create_location", id, { name: locName, region });
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
  if (path.startsWith("/locations/") && method === "PATCH") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const locId = path.replace("/locations/", "");
    const existing = await env.DB.prepare("SELECT * FROM locations WHERE id = ?").bind(locId).first();
    if (!existing) return error("\u0645\u06A9\u0627\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const data = await request.json();
    const locName = data.name !== void 0 ? String(data.name).trim() : existing.name;
    const region = data.region !== void 0 ? data.region : existing.region;
    const desc = data.description !== void 0 ? data.description : existing.description;
    const imgUrl = data.imageUrl !== void 0 ? data.imageUrl : existing.image_url;
    const dmNotes = data.dmNotes !== void 0 ? data.dmNotes : existing.dm_notes;
    const revealed = data.revealed !== void 0 ? data.revealed ? 1 : 0 : existing.revealed;
    const parentId = data.parentId !== void 0 ? data.parentId : existing.parent_id;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE locations SET name = ?, region = ?, description = ?, image_url = ?, dm_notes = ?, revealed = ?, parent_id = ?, updated_at = ? WHERE id = ?`
    ).bind(locName, region, desc, imgUrl, dmNotes, revealed, parentId, t, locId).run();
    await audit("update_location", locId, { name: locName, revealed: revealed === 1 });
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
  if (path.startsWith("/locations/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const locId = path.replace("/locations/", "");
    await env.DB.prepare("DELETE FROM locations WHERE id = ?").bind(locId).run();
    await audit("delete_location", locId);
    return json({ success: true });
  }
  const computeQualitativeHealth = /* @__PURE__ */ __name((hp, maxHp) => {
    if (maxHp <= 0 || hp <= 0) return "\u0631\u0648 \u0628\u0647 \u0645\u0631\u06AF";
    const pct = hp / maxHp * 100;
    if (pct > 75) return "\u0633\u0627\u0644\u0645";
    if (pct >= 25) return "\u0632\u062E\u0645\u06CC";
    return "\u0646\u06CC\u0645\u0647\u200C\u062C\u0627\u0646";
  }, "computeQualitativeHealth");
  const buildPlayerEncounterSnapshot = /* @__PURE__ */ __name(async (encRow) => {
    const encId = encRow.id;
    let settings = { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true };
    try {
      if (typeof encRow.settings === "string") settings = JSON.parse(encRow.settings);
      else if (encRow.settings) settings = encRow.settings;
    } catch {
    }
    let locData = null;
    if (encRow.location_id) {
      const locRow = await env.DB.prepare(
        "SELECT id, name, region, description, image_url, revealed FROM locations WHERE id = ?"
      ).bind(encRow.location_id).first();
      if (locRow) {
        locData = {
          id: locRow.id,
          name: locRow.name,
          region: locRow.region,
          description: locRow.revealed === 1 ? locRow.description : void 0,
          imageUrl: locRow.revealed === 1 ? locRow.image_url : void 0
        };
      }
    }
    const partRows = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? ORDER BY initiative DESC, sort_index ASC"
    ).bind(encId).all();
    const playerParticipants = [];
    for (const p of partRows.results || []) {
      if (p.visibility === "hidden") continue;
      if (p.status === "defeated" && settings.showDefeated === false) continue;
      if (p.visibility === "announced") {
        playerParticipants.push({
          id: p.id,
          kind: p.kind,
          displayNameForPlayers: "\u0645\u0648\u062C\u0648\u062F \u0646\u0627\u0634\u0646\u0627\u062E\u062A\u0647",
          healthStatus: "\u0633\u0627\u0644\u0645",
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
      let currentHp = p.hp;
      let maxHp = p.max_hp;
      if (p.kind === "character" && p.character_id) {
        const charRow = await env.DB.prepare("SELECT data FROM characters WHERE id = ?").bind(p.character_id).first();
        if (charRow?.data) {
          try {
            const charData = JSON.parse(charRow.data);
            if (charData.hp) {
              currentHp = charData.hp.current;
              maxHp = charData.hp.max;
            }
          } catch {
          }
        }
      }
      const healthStatus = computeQualitativeHealth(currentHp, maxHp);
      const isAlly = p.kind === "character";
      const isOwnCharacter = currentUser && p.character_id && currentUser.active_character_id === p.character_id;
      let conditions = void 0;
      if (settings.showConditions !== false) {
        try {
          conditions = typeof p.conditions === "string" ? JSON.parse(p.conditions) : p.conditions || [];
        } catch {
          conditions = [];
        }
      }
      let exactHp = void 0;
      if (settings.showExactHp === true || isAlly || isOwnCharacter) {
        exactHp = { current: currentHp, max: maxHp };
      }
      let exactAc = void 0;
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
      "SELECT * FROM encounter_events WHERE encounter_id = ? AND visible_to_players = 1 ORDER BY created_at ASC"
    ).bind(encId).all();
    const events = (eventRows.results || []).map((e) => ({
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
  }, "buildPlayerEncounterSnapshot");
  const buildDmEncounterSnapshot = /* @__PURE__ */ __name(async (encRow) => {
    const encId = encRow.id;
    let settings = { showExactHp: false, showAc: false, showConditions: true, showDefeated: true, playerInitiativeRolls: true };
    try {
      if (typeof encRow.settings === "string") settings = JSON.parse(encRow.settings);
      else if (encRow.settings) settings = encRow.settings;
    } catch {
    }
    let locData = null;
    if (encRow.location_id) {
      const locRow = await env.DB.prepare("SELECT * FROM locations WHERE id = ?").bind(encRow.location_id).first();
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
      "SELECT * FROM encounter_participants WHERE encounter_id = ? ORDER BY initiative DESC, sort_index ASC"
    ).bind(encId).all();
    const participants = (partRows.results || []).map((p) => ({
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
      conditions: typeof p.conditions === "string" ? JSON.parse(p.conditions) : p.conditions || [],
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
      "SELECT * FROM encounter_events WHERE encounter_id = ? ORDER BY created_at ASC"
    ).bind(encId).all();
    const events = (eventRows.results || []).map((e) => ({
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
  }, "buildDmEncounterSnapshot");
  if (path === "/encounters/active" && method === "GET") {
    if (!env.DB) return error("\u067E\u0627\u06CC\u06AF\u0627\u0647 \u062F\u0627\u062F\u0647 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A.", 500);
    const encRow = await env.DB.prepare(
      "SELECT * FROM encounters WHERE status IN ('active', 'paused') ORDER BY updated_at DESC LIMIT 1"
    ).first();
    if (!encRow) return error("\u0647\u06CC\u0686 \u0645\u0628\u0627\u0631\u0632\u0647 \u0641\u0639\u0627\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const snapshot = await buildPlayerEncounterSnapshot(encRow);
    return json(snapshot);
  }
  if (path.startsWith("/encounters/") && path.includes("/view") && method === "GET") {
    const encId = path.replace("/encounters/", "").replace("/view", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    if (currentUser?.role !== "dm" && encRow.status === "draft") {
      return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    }
    const since = url.searchParams.get("since");
    if (since && Number(since) === Number(encRow.version)) {
      return json({ notModified: true });
    }
    const etag = `W/"enc-${encRow.id}-${encRow.version}"`;
    if (request.headers.get("If-None-Match") === etag) {
      return new Response(null, { status: 304, headers: { ETag: etag, ...SECURITY_HEADERS } });
    }
    if (currentUser?.role === "dm") {
      const dmSnapshot = await buildDmEncounterSnapshot(encRow);
      return json(dmSnapshot, 200, { ETag: etag });
    } else {
      const playerSnapshot = await buildPlayerEncounterSnapshot(encRow);
      return json(playerSnapshot, 200, { ETag: etag });
    }
  }
  if (path.startsWith("/encounters/") && path.endsWith("/initiative") && method === "POST") {
    if (!currentUser) return error("\u0646\u0634\u0633\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A.", 401);
    const encId = path.replace("/encounters/", "").replace("/initiative", "");
    const body = await request.json();
    const { characterId, value } = body;
    if (!characterId) return error("\u0634\u0646\u0627\u0633\u0647 \u0634\u062E\u0635\u06CC\u062A \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 1 || numValue > 40) {
      return error("\u0645\u0642\u062F\u0627\u0631 \u0627\u0628\u062A\u06A9\u0627\u0631 \u0639\u0645\u0644 \u0628\u0627\u06CC\u062F \u0628\u06CC\u0646 \u06F1 \u062A\u0627 \u06F4\u06F0 \u0628\u0627\u0634\u062F.", 400);
    }
    if (currentUser.role !== "dm") {
      const charRow = await env.DB.prepare("SELECT owner_id, name FROM characters WHERE id = ?").bind(characterId).first();
      if (!charRow || charRow.owner_id !== currentUser.id) {
        return error("\u0634\u0645\u0627 \u0641\u0642\u0637 \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0628\u0631\u0627\u06CC \u0634\u062E\u0635\u06CC\u062A \u0645\u062A\u0639\u0644\u0642 \u0628\u0647 \u062E\u0648\u062F \u0627\u0628\u062A\u06A9\u0627\u0631 \u0639\u0645\u0644 \u0628\u06CC\u0646\u062F\u0627\u0632\u06CC\u062F.", 403);
      }
    }
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const participant = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? AND character_id = ?"
    ).bind(encId, characterId).first();
    if (!participant) return error("\u0627\u06CC\u0646 \u0634\u062E\u0635\u06CC\u062A \u062F\u0631 \u0645\u0628\u0627\u0631\u0632\u0647 \u062D\u0636\u0648\u0631 \u0646\u062F\u0627\u0631\u062F.", 404);
    let settings = {};
    try {
      settings = typeof encRow.settings === "string" ? JSON.parse(encRow.settings) : encRow.settings || {};
    } catch {
    }
    const newStatus = settings.playerInitiativeRolls === false ? "set" : "pending";
    const newVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare(
      "UPDATE encounter_participants SET initiative = ?, initiative_status = ?, revision = revision + 1 WHERE id = ?"
    ).bind(numValue, newStatus, participant.id).run();
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(newVersion, t, encId).run();
    const charName = participant.display_name_for_players || participant.instance_name;
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', ?, 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, `${charName} \u0627\u0628\u062A\u06A9\u0627\u0631 \u0639\u0645\u0644 ${numValue} \u0631\u0627 \u062B\u0628\u062A \u06A9\u0631\u062F.`, t).run();
    return json({ success: true, initiative: numValue, initiativeStatus: newStatus });
  }
  if (path === "/encounters" && method === "GET") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const statusFilter = url.searchParams.get("status");
    const locFilter = url.searchParams.get("locationId");
    let query = "SELECT * FROM encounters WHERE 1=1";
    const bindings = [];
    if (statusFilter) {
      query += " AND status = ?";
      bindings.push(statusFilter);
    }
    if (locFilter) {
      query += " AND location_id = ?";
      bindings.push(locFilter);
    }
    query += " ORDER BY updated_at DESC";
    const rows = await env.DB.prepare(query).bind(...bindings).all();
    const results = [];
    for (const r of rows.results || []) {
      const full = await buildDmEncounterSnapshot(r);
      results.push(full);
    }
    return json(results);
  }
  if (path === "/encounters" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const body = await request.json();
    const id = `enc-${Date.now()}-${generateRandomToken(4)}`;
    const encName = String(body.name || "\u0645\u0628\u0627\u0631\u0632\u0647 \u062C\u062F\u06CC\u062F").trim();
    const locationId = body.locationId || null;
    const sessionTag = body.sessionTag || "";
    const dmNotes = body.dmNotes || "";
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
    ).bind(id, "campaign", "zorvania-c1", encName, locationId, sessionTag, settings, dmNotes, currentUser?.id || null, t, t).run();
    const created = await buildDmEncounterSnapshot({
      id,
      name: encName,
      location_id: locationId,
      status: "draft",
      round: 0,
      current_participant_id: null,
      session_tag: sessionTag,
      settings,
      version: 1,
      dm_notes: dmNotes,
      created_by: currentUser?.id,
      created_at: t,
      updated_at: t
    });
    return json(created, 201);
  }
  if (path.startsWith("/encounters/") && method === "GET" && !path.includes("/view") && !path.includes("/participants") && !path.includes("/events")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const full = await buildDmEncounterSnapshot(encRow);
    return json(full);
  }
  if (path.startsWith("/encounters/") && method === "PATCH" && !path.includes("/participants")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const data = await request.json();
    const newName = data.name !== void 0 ? String(data.name).trim() : encRow.name;
    const newLocId = data.locationId !== void 0 ? data.locationId : encRow.location_id;
    const newSessionTag = data.sessionTag !== void 0 ? data.sessionTag : encRow.session_tag;
    const newDmNotes = data.dmNotes !== void 0 ? data.dmNotes : encRow.dm_notes;
    const newSettings = data.settings !== void 0 ? JSON.stringify(data.settings) : encRow.settings;
    const newStatus = data.status !== void 0 ? data.status : encRow.status;
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE encounters SET name = ?, location_id = ?, session_tag = ?, dm_notes = ?, settings = ?, status = ?, version = ?, updated_at = ? WHERE id = ?`
    ).bind(newName, newLocId, newSessionTag, newDmNotes, newSettings, newStatus, nextVersion, t, encId).run();
    const updatedRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    const full = await buildDmEncounterSnapshot(updatedRow);
    return json(full);
  }
  if (path.startsWith("/encounters/") && path.endsWith("/start") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/start", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
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
       VALUES (?, ?, 1, 'start', '\u0645\u0628\u0627\u0631\u0632\u0647 \u0622\u063A\u0627\u0632 \u0634\u062F (\u062F\u0648\u0631 \u06F1)', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, t).run();
    return json({ success: true, status: "active", round: 1, currentParticipantId: partRow?.id || null, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/pause") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/pause", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'paused', version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', '\u0645\u0628\u0627\u0631\u0632\u0647 \u0645\u0648\u0642\u062A\u0627\u064B \u0645\u062A\u0648\u0642\u0641 \u0634\u062F.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();
    return json({ success: true, status: "paused", version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/resume") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/resume", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'active', version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'round', '\u0645\u0628\u0627\u0631\u0632\u0647 \u0645\u062C\u062F\u062F\u0627\u064B \u0627\u0632 \u0633\u0631 \u06AF\u0631\u0641\u062A\u0647 \u0634\u062F.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();
    return json({ success: true, status: "active", version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/end") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/end", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const nextVersion = (encRow.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET status = 'ended', ended_at = ?, version = ?, updated_at = ? WHERE id = ?").bind(t, nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'end', '\u0645\u0628\u0627\u0631\u0632\u0647 \u0628\u0627 \u067E\u06CC\u0631\u0648\u0632\u06CC \u0628\u0647 \u067E\u0627\u06CC\u0627\u0646 \u0631\u0633\u06CC\u062F.', 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, t).run();
    return json({ success: true, status: "ended", version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/next-turn") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/next-turn", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const partRows = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? AND initiative IS NOT NULL ORDER BY initiative DESC, sort_index ASC"
    ).bind(encId).all();
    const activeParts = (partRows.results || []).filter((p) => p.status === "active");
    if (activeParts.length === 0) return error("\u0647\u06CC\u0686 \u0645\u0628\u0627\u0631\u0632 \u0641\u0639\u0627\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
    const currentIndex = activeParts.findIndex((p) => p.id === encRow.current_participant_id);
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
      "UPDATE encounters SET current_participant_id = ?, round = ?, version = ?, updated_at = ? WHERE id = ?"
    ).bind(nextPart.id, nextRound, nextVersion, t, encId).run();
    if (nextRound > (encRow.round || 1)) {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'round', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, nextRound, `\u0622\u063A\u0627\u0632 \u062F\u0648\u0631 ${nextRound}`, t).run();
    }
    const pName = nextPart.display_name_for_players || nextPart.instance_name;
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'turn', ?, 1, ?)`
    ).bind(`evt-${t + 1}-${generateRandomToken(4)}`, encId, nextRound, `\u0646\u0648\u0628\u062A \u0628\u0647 ${pName} \u0631\u0633\u06CC\u062F.`, t + 1).run();
    return json({ success: true, currentParticipantId: nextPart.id, round: nextRound, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/prev-turn") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/prev-turn", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const partRows = await env.DB.prepare(
      "SELECT * FROM encounter_participants WHERE encounter_id = ? AND initiative IS NOT NULL ORDER BY initiative DESC, sort_index ASC"
    ).bind(encId).all();
    const activeParts = (partRows.results || []).filter((p) => p.status === "active");
    if (activeParts.length === 0) return error("\u0647\u06CC\u0686 \u0645\u0628\u0627\u0631\u0632 \u0641\u0639\u0627\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.");
    const currentIndex = activeParts.findIndex((p) => p.id === encRow.current_participant_id);
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
      "UPDATE encounters SET current_participant_id = ?, round = ?, version = ?, updated_at = ? WHERE id = ?"
    ).bind(prevPart.id, nextRound, nextVersion, t, encId).run();
    return json({ success: true, currentParticipantId: prevPart.id, round: nextRound, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/participants") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/participants", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const items = Array.isArray(body.participants) ? body.participants : [body];
    const announceReinforcements = Boolean(body.announceReinforcements);
    const announcementText = body.announcementText || "\u0646\u06CC\u0631\u0648\u0647\u0627\u06CC \u06A9\u0645\u06A9\u06CC \u0627\u0632 \u0631\u0627\u0647 \u0631\u0633\u06CC\u062F\u0646\u062F!";
    const createdList = [];
    const t = Date.now();
    const maxSortRow = await env.DB.prepare("SELECT MAX(sort_index) as m FROM encounter_participants WHERE encounter_id = ?").bind(encId).first();
    let currentSort = (maxSortRow?.m ?? 0) + 1;
    for (const item of items) {
      const pid = `part-${Date.now()}-${generateRandomToken(4)}`;
      const kind = item.kind || "monster";
      const npcTemplateId = item.npcTemplateId || null;
      const characterId = item.characterId || null;
      const instanceName = item.instanceName || "\u0645\u0648\u062C\u0648\u062F";
      const displayNameForPlayers = item.displayNameForPlayers || instanceName;
      const maxHp = Number(item.maxHp || 10);
      const hp = Number(item.hp !== void 0 ? item.hp : maxHp);
      const ac = String(item.ac || "10");
      const acState = item.acState || null;
      const conditions = JSON.stringify(item.conditions || []);
      const initiative = item.initiative !== void 0 && item.initiative !== null ? Number(item.initiative) : null;
      const initiativeStatus = initiative !== null ? "set" : "none";
      const visibility = item.visibility || "revealed";
      const status = item.status || "active";
      const phase = item.phase || null;
      const groupId = item.groupId || null;
      const notes = item.notes || "";
      const addedAtRound = encRow.round || 0;
      await env.DB.prepare(
        `INSERT INTO encounter_participants (
           id, encounter_id, kind, npc_template_id, character_id, instance_name,
           display_name_for_players, max_hp, hp, ac, ac_state, conditions, initiative,
           initiative_status, visibility, status, phase, group_id, sort_index,
           added_at_round, revision, notes, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
      ).bind(
        pid,
        encId,
        kind,
        npcTemplateId,
        characterId,
        instanceName,
        displayNameForPlayers,
        maxHp,
        hp,
        ac,
        acState,
        conditions,
        initiative,
        initiativeStatus,
        visibility,
        status,
        phase,
        groupId,
        currentSort++,
        addedAtRound,
        notes,
        t
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
    if (announceReinforcements) {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'add', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, announcementText, t).run();
    }
    const nextVersion = (encRow.version || 0) + 1;
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    return json({ success: true, created: createdList, version: nextVersion }, 201);
  }
  if (path.startsWith("/encounters/") && path.includes("/participants/") && method === "PATCH") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const parts = path.split("/");
    const encId = parts[2];
    const pid = parts[4];
    const partRow = await env.DB.prepare("SELECT * FROM encounter_participants WHERE id = ? AND encounter_id = ?").bind(pid, encId).first();
    if (!partRow) return error("\u0645\u0628\u0627\u0631\u0632 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const data = await request.json();
    if (data.revision !== void 0 && Number(data.revision) !== Number(partRow.revision)) {
      return error("\u062A\u063A\u06CC\u06CC\u0631\u0627\u062A \u062A\u0648\u0633\u0637 \u062A\u0628 \u06CC\u0627 \u06A9\u0627\u0631\u0628\u0631 \u062F\u06CC\u06AF\u0631\u06CC \u0628\u0647\u200C\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.", 409);
    }
    const newHp = data.hp !== void 0 ? Number(data.hp) : partRow.hp;
    const newMaxHp = data.maxHp !== void 0 ? Number(data.maxHp) : partRow.max_hp;
    const newAc = data.ac !== void 0 ? String(data.ac) : partRow.ac;
    const newAcState = data.acState !== void 0 ? data.acState : partRow.ac_state;
    const newConditions = data.conditions !== void 0 ? JSON.stringify(data.conditions) : partRow.conditions;
    const newInit = data.initiative !== void 0 ? data.initiative === null ? null : Number(data.initiative) : partRow.initiative;
    const newInitStatus = data.initiativeStatus !== void 0 ? data.initiativeStatus : newInit !== null ? "set" : partRow.initiative_status;
    const newVisibility = data.visibility !== void 0 ? data.visibility : partRow.visibility;
    const newStatus = data.status !== void 0 ? data.status : partRow.status;
    const newPhase = data.phase !== void 0 ? data.phase : partRow.phase;
    const newName = data.instanceName !== void 0 ? data.instanceName : partRow.instance_name;
    const newDisplayName = data.displayNameForPlayers !== void 0 ? data.displayNameForPlayers : partRow.display_name_for_players;
    const newNotes = data.notes !== void 0 ? data.notes : partRow.notes;
    const newSortIndex = data.sortIndex !== void 0 ? Number(data.sortIndex) : partRow.sort_index;
    const newRevision = (partRow.revision || 1) + 1;
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE encounter_participants SET 
         hp = ?, max_hp = ?, ac = ?, ac_state = ?, conditions = ?, initiative = ?, 
         initiative_status = ?, visibility = ?, status = ?, phase = ?, instance_name = ?, 
         display_name_for_players = ?, notes = ?, sort_index = ?, revision = ?
       WHERE id = ?`
    ).bind(
      newHp,
      newMaxHp,
      newAc,
      newAcState,
      newConditions,
      newInit,
      newInitStatus,
      newVisibility,
      newStatus,
      newPhase,
      newName,
      newDisplayName,
      newNotes,
      newSortIndex,
      newRevision,
      pid
    ).run();
    if (partRow.kind === "character" && partRow.character_id && data.hp !== void 0) {
      const charRow = await env.DB.prepare("SELECT data FROM characters WHERE id = ?").bind(partRow.character_id).first();
      if (charRow?.data) {
        try {
          const cData = JSON.parse(charRow.data);
          cData.hp = { ...cData.hp, current: newHp, max: newMaxHp };
          await env.DB.prepare("UPDATE characters SET data = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(cData), t, partRow.character_id).run();
        } catch {
        }
      }
    }
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    const nextEncVersion = (encRow?.version || 0) + 1;
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextEncVersion, t, encId).run();
    if (data.status === "defeated" && partRow.status !== "defeated") {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'defeat', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `${partRow.display_name_for_players || partRow.instance_name} \u0634\u06A9\u0633\u062A \u062E\u0648\u0631\u062F.`, t).run();
    } else if (data.visibility === "revealed" && partRow.visibility !== "revealed") {
      await env.DB.prepare(
        `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
         VALUES (?, ?, ?, 'reveal', ?, 1, ?)`
      ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `${newDisplayName || newName} \u0622\u0634\u06A9\u0627\u0631 \u0634\u062F!`, t).run();
    }
    return json({ success: true, revision: newRevision, version: nextEncVersion });
  }
  if (path.startsWith("/encounters/") && path.includes("/participants/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const parts = path.split("/");
    const encId = parts[2];
    const pid = parts[4];
    await env.DB.prepare("DELETE FROM encounter_participants WHERE id = ? AND encounter_id = ?").bind(pid, encId).run();
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    const nextVersion = (encRow?.version || 0) + 1;
    const t = Date.now();
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    return json({ success: true, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/events") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/events", "");
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    if (!encRow) return error("\u0645\u0628\u0627\u0631\u0632\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const body = await request.json();
    const text = String(body.text || "").trim();
    if (!text) return error("\u0645\u062A\u0646 \u0631\u0648\u06CC\u062F\u0627\u062F \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const visible = body.visibleToPlayers !== false ? 1 : 0;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'note', ?, ?, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow.round || 1, text, visible, t).run();
    const nextVersion = (encRow.version || 0) + 1;
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    return json({ success: true, version: nextVersion });
  }
  if (path.startsWith("/encounters/") && path.endsWith("/loot") && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const encId = path.replace("/encounters/", "").replace("/loot", "");
    const body = await request.json();
    const { characterId, item } = body;
    if (!characterId || !item || !item.name) return error("\u0634\u0646\u0627\u0633\u0647 \u0634\u062E\u0635\u06CC\u062A \u0648 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0622\u06CC\u062A\u0645 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A.");
    const charRow = await env.DB.prepare("SELECT * FROM characters WHERE id = ?").bind(characterId).first();
    if (!charRow) return error("\u0634\u062E\u0635\u06CC\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const charData = JSON.parse(charRow.data);
    const newItem = {
      id: `item-${Date.now()}-${generateRandomToken(4)}`,
      name: item.name,
      category: item.category || "loot",
      quantity: item.quantity || 1,
      weight: item.weight || 0.5,
      description: item.description || "",
      mechanicalEffect: item.mechanicalEffect || "",
      secretNotes: item.secretNotes || "",
      isNew: true
    };
    charData.inventory = [...charData.inventory || [], newItem];
    const t = Date.now();
    await env.DB.prepare("UPDATE characters SET data = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(charData), t, characterId).run();
    const encRow = await env.DB.prepare("SELECT * FROM encounters WHERE id = ?").bind(encId).first();
    const nextVersion = (encRow?.version || 0) + 1;
    await env.DB.prepare("UPDATE encounters SET version = ?, updated_at = ? WHERE id = ?").bind(nextVersion, t, encId).run();
    await env.DB.prepare(
      `INSERT INTO encounter_events (id, encounter_id, round, type, text, visible_to_players, created_at)
       VALUES (?, ?, ?, 'note', ?, 1, ?)`
    ).bind(`evt-${t}-${generateRandomToken(4)}`, encId, encRow?.round || 1, `\u063A\u0646\u06CC\u0645\u062A ${item.name} \u0628\u0647 ${charRow.name} \u0627\u0647\u062F\u0627 \u0634\u062F.`, t).run();
    return json({ success: true, version: nextVersion, item: newItem });
  }
  if (path === "/calendar" && method === "GET") {
    const row = await env.DB.prepare("SELECT * FROM campaign_calendar WHERE id = ?").bind("zorvania-calendar").first();
    if (!row) {
      return json({
        id: "zorvania-calendar",
        year: 1500,
        month: 1,
        day: 1,
        isOffDay: false,
        currentFestival: "\u062C\u0634\u0646 \u0641\u0631\u0647\u06AF\u0627\u0646",
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
  if (path === "/calendar" && method === "PUT") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    await env.DB.prepare(
      "INSERT INTO campaign_calendar (id, year, month, day, is_off_day, off_day_index, current_festival, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET year = excluded.year, month = excluded.month, day = excluded.day, is_off_day = excluded.is_off_day, off_day_index = excluded.off_day_index, current_festival = excluded.current_festival, updated_at = excluded.updated_at"
    ).bind("zorvania-calendar", data.year, data.month, data.day, data.isOffDay ? 1 : 0, data.offDayIndex || 0, data.currentFestival || "", now).run();
    return json({ ...data, updatedAt: now });
  }
  if (path === "/endings" && method === "GET") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const row = await env.DB.prepare("SELECT data FROM campaign_endings WHERE id = ?").bind("zorvania-endings").first();
    if (!row) {
      return json({ id: "zorvania-endings", updatedAt: now });
    }
    return json(JSON.parse(row.data));
  }
  if (path === "/endings" && method === "PUT") {
    if (currentUser.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    await env.DB.prepare(
      "INSERT INTO campaign_endings (id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at"
    ).bind("zorvania-endings", JSON.stringify({ ...data, updatedAt: now }), now).run();
    return json({ ...data, updatedAt: now });
  }
  if (path === "/shanshin-encounters" && method === "GET") {
    const res = await env.DB.prepare("SELECT * FROM shanshin_encounters ORDER BY id ASC").all();
    return json(res.results || []);
  }
  if (path === "/library" && method === "GET") {
    const source = url.searchParams.get("source") || "current_campaign";
    const type = url.searchParams.get("type") || "";
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const tag = url.searchParams.get("tag") || "";
    const region = url.searchParams.get("region") || "";
    const sort = url.searchParams.get("sort") || "newest";
    let scopeType = "campaign";
    let scopeId = "zorvania-c1";
    if (source === "my_library") {
      const libRow = await env.DB.prepare("SELECT id FROM content_packs WHERE owner_id = ? AND is_default_library = 1").bind(currentUser.id).first();
      scopeType = "pack";
      scopeId = libRow?.id || "pack-zorvania";
    } else if (source.startsWith("pack-") || source.startsWith("pack_")) {
      scopeType = "pack";
      scopeId = source;
    } else if (source.startsWith("camp-") || source === "zorvania-c1") {
      scopeType = "campaign";
      scopeId = source;
    }
    const itemsList = [];
    if (!type || type === "location") {
      const rows = await env.DB.prepare("SELECT * FROM locations WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "location", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "npc") {
      const rows = await env.DB.prepare("SELECT * FROM npcs WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "npc", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "item") {
      const rows = await env.DB.prepare("SELECT * FROM items WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "item", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "encounter") {
      const rows = await env.DB.prepare("SELECT * FROM encounters WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "encounter", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "faction") {
      const rows = await env.DB.prepare("SELECT * FROM factions WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({ ...r, itemType: "faction", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "class_template") {
      const rows = await env.DB.prepare("SELECT * FROM class_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        let parsed = {};
        try {
          parsed = JSON.parse(r.data);
        } catch {
        }
        itemsList.push({ ...parsed, ...r, itemType: "class_template", name: r.name, tags: JSON.parse(r.tags || "[]") });
      }
    }
    if (!type || type === "lineage_template") {
      const rows = await env.DB.prepare("SELECT * FROM lineage_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({
          ...r,
          itemType: "lineage_template",
          name: r.name,
          tags: JSON.parse(r.tags || "[]"),
          abilityBonuses: JSON.parse(r.ability_bonuses || "{}"),
          traits: JSON.parse(r.traits || "[]"),
          languages: JSON.parse(r.languages || "[]"),
          proficiencies: JSON.parse(r.proficiencies || "{}"),
          resistances: JSON.parse(r.resistances || "[]"),
          senses: JSON.parse(r.senses || "{}"),
          sublineages: JSON.parse(r.sublineages || "[]"),
          nameSuggestions: JSON.parse(r.name_suggestions || "[]"),
          backstoryPrompts: JSON.parse(r.backstory_prompts || "[]")
        });
      }
    }
    if (!type || type === "background_template") {
      const rows = await env.DB.prepare("SELECT * FROM background_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
      for (const r of rows.results || []) {
        itemsList.push({
          ...r,
          itemType: "background_template",
          name: r.name,
          tags: JSON.parse(r.tags || "[]"),
          skillProficiencies: JSON.parse(r.skill_proficiencies || "[]"),
          toolProficiencies: JSON.parse(r.tool_proficiencies || "[]"),
          languages: JSON.parse(r.languages || "[]"),
          startingEquipment: JSON.parse(r.starting_equipment || "[]"),
          personalityTables: JSON.parse(r.personality_tables || "{}")
        });
      }
    }
    let filtered = itemsList;
    if (q) {
      filtered = filtered.filter((i) => i.name && i.name.toLowerCase().includes(q) || i.description && i.description.toLowerCase().includes(q));
    }
    if (tag) {
      filtered = filtered.filter((i) => i.tags && i.tags.includes(tag));
    }
    if (region) {
      filtered = filtered.filter((i) => i.region === region);
    }
    return json({ items: filtered, total: filtered.length });
  }
  if (path === "/packs" && method === "GET") {
    const kind = url.searchParams.get("kind");
    let q = 'SELECT * FROM content_packs WHERE visibility = "instance" OR owner_id = ?';
    const params = [currentUser.id];
    if (kind) {
      q += " AND kind = ?";
      params.push(kind);
    }
    const res = await env.DB.prepare(q).bind(...params).all();
    return json(res.results || []);
  }
  if (path === "/packs" && method === "POST") {
    const data = await request.json();
    const packId = `pack-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO content_packs (id, owner_id, name, description, version, visibility, kind, tags, is_default_library, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
    ).bind(packId, currentUser.id, data.name, data.description || "", "1.0.0", data.visibility || "private", data.kind || "pack", JSON.stringify(data.tags || []), t, t).run();
    return json({ id: packId, name: data.name, kind: data.kind || "pack", createdAt: t }, 201);
  }
  if (path === "/favorites" && method === "GET") {
    const res = await env.DB.prepare("SELECT * FROM favorites WHERE user_id = ?").bind(currentUser.id).all();
    return json(res.results || []);
  }
  if (path === "/favorites" && method === "PUT") {
    const data = await request.json();
    const existing = await env.DB.prepare("SELECT * FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?").bind(currentUser.id, data.entityType, data.entityId).first();
    let isFavorite = false;
    if (existing) {
      await env.DB.prepare("DELETE FROM favorites WHERE user_id = ? AND entity_type = ? AND entity_id = ?").bind(currentUser.id, data.entityType, data.entityId).run();
      isFavorite = false;
    } else {
      await env.DB.prepare("INSERT INTO favorites (user_id, entity_type, entity_id, created_at) VALUES (?, ?, ?, ?)").bind(currentUser.id, data.entityType, data.entityId, Date.now()).run();
      isFavorite = true;
    }
    return json({ isFavorite });
  }
  if (path === "/campaigns/draft" && method === "POST") {
    const data = await request.json();
    const campId = `camp-draft-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    const defaultSettings = JSON.stringify({
      units: "feet",
      startingLevel: 1,
      maxEntryLevel: 20,
      abilityScoreMethods: ["standard_array", "point_buy", "roll", "manual"],
      approval: { onCreate: false, onLevelUp: false },
      backstoryVisibility: "party",
      diceVisibility: "table",
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
      startMode: data.startMode || "empty",
      sourceId: data.sourceId || null,
      answers: { name: "\u06A9\u0645\u067E\u06CC\u0646 \u062C\u062F\u06CC\u062F" }
    });
    await env.DB.prepare(
      `INSERT INTO campaigns (id, name, description, status, owner_id, settings, wizard_state, created_at, updated_at)
       VALUES (?, '\u06A9\u0645\u067E\u06CC\u0646 \u062C\u062F\u06CC\u062F', '', 'draft', ?, ?, ?, ?, ?)`
    ).bind(campId, currentUser.id, defaultSettings, initWizard, t, t).run();
    await env.DB.prepare(
      `INSERT INTO campaign_members (campaign_id, user_id, role, status, joined_at)
       VALUES (?, ?, 'owner', 'active', ?)`
    ).bind(campId, currentUser.id, t).run();
    return json({ id: campId, name: "\u06A9\u0645\u067E\u06CC\u0646 \u062C\u062F\u06CC\u062F", status: "draft", wizardState: JSON.parse(initWizard) }, 201);
  }
  if (path.match(/^\/campaigns\/[^/]+\/wizard$/) && method === "PATCH") {
    const campId = path.split("/")[2];
    const data = await request.json();
    const camp = await env.DB.prepare("SELECT * FROM campaigns WHERE id = ?").bind(campId).first();
    if (!camp) return error("\u06A9\u0645\u067E\u06CC\u0646 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    const currentWiz = camp.wizard_state ? JSON.parse(camp.wizard_state) : { step: 1, answers: {} };
    const mergedWiz = {
      ...currentWiz,
      ...data,
      answers: {
        ...currentWiz.answers || {},
        ...data.answers || {}
      }
    };
    const newName = mergedWiz.answers.name || camp.name;
    const newDesc = mergedWiz.answers.description || camp.description;
    const t = Date.now();
    await env.DB.prepare(
      "UPDATE campaigns SET name = ?, description = ?, wizard_state = ?, updated_at = ? WHERE id = ?"
    ).bind(newName, newDesc, JSON.stringify(mergedWiz), t, campId).run();
    return json({ id: campId, name: newName, description: newDesc, wizardState: mergedWiz });
  }
  if (path.match(/^\/campaigns\/[^/]+\/launch$/) && method === "POST") {
    const campId = path.split("/")[2];
    const t = Date.now();
    await env.DB.prepare("UPDATE campaigns SET status = 'active', updated_at = ? WHERE id = ?").bind(t, campId).run();
    return json({ success: true, id: campId, status: "active" });
  }
  if (path.match(/^\/c\/[^/]+\/factions$/) && method === "GET") {
    const cId = path.split("/")[2];
    const rows = await env.DB.prepare('SELECT * FROM factions WHERE scope_type = "campaign" AND scope_id = ?').bind(cId).all();
    const list = (rows.results || []).map((r) => ({
      ...r,
      revealed: r.revealed === 1,
      tags: JSON.parse(r.tags || "[]")
    }));
    return json(list);
  }
  if (path.match(/^\/c\/[^/]+\/factions$/) && method === "POST") {
    const cId = path.split("/")[2];
    const data = await request.json();
    const fId = `fac-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO factions (id, scope_type, scope_id, name, description, attitude, region, revealed, dm_notes, tags, source_mode, created_at, updated_at)
       VALUES (?, 'campaign', ?, ?, ?, ?, ?, ?, ?, ?, 'copy', ?, ?)`
    ).bind(fId, cId, data.name, data.description || "", data.attitude || "", data.region || "", data.revealed ? 1 : 0, data.dmNotes || "", JSON.stringify(data.tags || []), t, t).run();
    return json({ id: fId, name: data.name, ...data, createdAt: t, updatedAt: t }, 201);
  }
  if (path.match(/^\/c\/[^/]+\/docs$/) && method === "GET") {
    const cId = path.split("/")[2];
    const rows = await env.DB.prepare("SELECT * FROM campaign_docs WHERE campaign_id = ? ORDER BY sort_index ASC").bind(cId).all();
    return json(rows.results || []);
  }
  if (path.match(/^\/c\/[^/]+\/docs$/) && method === "POST") {
    const cId = path.split("/")[2];
    const data = await request.json();
    const dId = `cdoc-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO campaign_docs (id, campaign_id, kind, title, body, visibility, sort_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(dId, cId, data.kind || "session_zero", data.title, data.body || "", data.visibility || "party", data.sortIndex || 0, t, t).run();
    return json({ id: dId, ...data, createdAt: t, updatedAt: t }, 201);
  }
  if (path === "/generic-calendar" && method === "GET") {
    const row = await env.DB.prepare("SELECT * FROM calendars ORDER BY updated_at DESC LIMIT 1").first();
    if (!row) {
      return json({
        id: "cal-zorvania",
        name: "\u06AF\u0627\u0647\u200C\u0634\u0645\u0627\u0631 \u0634\u0627\u0647\u200C\u0631\u0648\u0632\u0627\u0646 (\u0632\u0631\u0648\u0627\u0646\u06CC\u0627)",
        eraLabel: "\u067E.\u0631.\u0646",
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
      months: JSON.parse(row.months || "[]"),
      festivals: [],
      offDays: JSON.parse(row.off_days || "[]"),
      weekdays: JSON.parse(row.weekdays || "[]")
    });
  }
  if (path === "/class-templates" && method === "GET") {
    const scopeType = url.searchParams.get("scopeType") || "campaign";
    const scopeId = url.searchParams.get("scopeId") || "zorvania-c1";
    const rows = await env.DB.prepare("SELECT * FROM class_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r) => {
      let parsed = {};
      try {
        parsed = JSON.parse(r.data);
      } catch {
      }
      return { ...parsed, ...r, tags: JSON.parse(r.tags || "[]") };
    });
    return json(list);
  }
  if (path === "/class-templates" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = data.id || `class-${Date.now()}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO class_templates (id, scope_type, scope_id, name, data, tags, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, data.scopeType || "campaign", data.scopeId || "zorvania-c1", data.name, JSON.stringify(data), JSON.stringify(data.tags || []), t).run();
    return json({ ...data, id, updatedAt: t }, 201);
  }
  if (path.startsWith("/class-templates/") && (method === "PUT" || method === "PATCH")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    const data = await request.json();
    const t = Date.now();
    await env.DB.prepare(
      "UPDATE class_templates SET name = ?, data = ?, tags = ?, updated_at = ? WHERE id = ?"
    ).bind(data.name, JSON.stringify(data), JSON.stringify(data.tags || []), t, id).run();
    return json({ ...data, id, updatedAt: t });
  }
  if (path.startsWith("/class-templates/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    await env.DB.prepare("DELETE FROM class_templates WHERE id = ?").bind(id).run();
    return json({ success: true });
  }
  if (path === "/lineage-templates" && method === "GET") {
    const scopeType = url.searchParams.get("scopeType") || "campaign";
    const scopeId = url.searchParams.get("scopeId") || "zorvania-c1";
    const rows = await env.DB.prepare("SELECT * FROM lineage_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      abilityBonuses: JSON.parse(r.ability_bonuses || "{}"),
      traits: JSON.parse(r.traits || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      proficiencies: JSON.parse(r.proficiencies || "{}"),
      resistances: JSON.parse(r.resistances || "[]"),
      senses: JSON.parse(r.senses || "{}"),
      sublineages: JSON.parse(r.sublineages || "[]"),
      nameSuggestions: JSON.parse(r.name_suggestions || "[]"),
      backstoryPrompts: JSON.parse(r.backstory_prompts || "[]")
    }));
    return json(list);
  }
  if (path.startsWith("/lineage-templates/") && method === "GET") {
    const id = path.split("/")[2];
    const r = await env.DB.prepare("SELECT * FROM lineage_templates WHERE id = ?").bind(id).first();
    if (!r) return error("\u0646\u0698\u0627\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    return json({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      abilityBonuses: JSON.parse(r.ability_bonuses || "{}"),
      traits: JSON.parse(r.traits || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      proficiencies: JSON.parse(r.proficiencies || "{}"),
      resistances: JSON.parse(r.resistances || "[]"),
      senses: JSON.parse(r.senses || "{}"),
      sublineages: JSON.parse(r.sublineages || "[]"),
      nameSuggestions: JSON.parse(r.name_suggestions || "[]"),
      backstoryPrompts: JSON.parse(r.backstory_prompts || "[]")
    });
  }
  if (path === "/lineage-templates" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = data.id || `lin-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO lineage_templates (
        id, scope_type, scope_id, source_id, source_mode, tags, name, description,
        size, speed, ability_bonuses, traits, languages, proficiencies, resistances,
        senses, sublineages, name_suggestions, backstory_prompts, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.scopeType || "campaign",
      data.scopeId || "zorvania-c1",
      data.sourceId || null,
      data.sourceMode || "copy",
      JSON.stringify(data.tags || []),
      data.name,
      data.description || "",
      data.size || "\u0645\u062A\u0648\u0633\u0637 (Medium)",
      data.speed || 30,
      JSON.stringify(data.abilityBonuses || {}),
      JSON.stringify(data.traits || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.proficiencies || {}),
      JSON.stringify(data.resistances || []),
      JSON.stringify(data.senses || {}),
      JSON.stringify(data.sublineages || []),
      JSON.stringify(data.nameSuggestions || []),
      JSON.stringify(data.backstoryPrompts || []),
      t,
      t
    ).run();
    return json({ ...data, id, createdAt: t, updatedAt: t }, 201);
  }
  if (path.startsWith("/lineage-templates/") && (method === "PUT" || method === "PATCH")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    const data = await request.json();
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE lineage_templates SET
        name = ?, description = ?, size = ?, speed = ?, ability_bonuses = ?,
        traits = ?, languages = ?, proficiencies = ?, resistances = ?, senses = ?,
        sublineages = ?, name_suggestions = ?, backstory_prompts = ?, tags = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      data.name,
      data.description || "",
      data.size || "\u0645\u062A\u0648\u0633\u0637 (Medium)",
      data.speed || 30,
      JSON.stringify(data.abilityBonuses || {}),
      JSON.stringify(data.traits || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.proficiencies || {}),
      JSON.stringify(data.resistances || []),
      JSON.stringify(data.senses || {}),
      JSON.stringify(data.sublineages || []),
      JSON.stringify(data.nameSuggestions || []),
      JSON.stringify(data.backstoryPrompts || []),
      JSON.stringify(data.tags || []),
      t,
      id
    ).run();
    return json({ ...data, id, updatedAt: t });
  }
  if (path.startsWith("/lineage-templates/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    await env.DB.prepare("DELETE FROM lineage_templates WHERE id = ?").bind(id).run();
    return json({ success: true });
  }
  if (path === "/background-templates" && method === "GET") {
    const scopeType = url.searchParams.get("scopeType") || "campaign";
    const scopeId = url.searchParams.get("scopeId") || "zorvania-c1";
    const rows = await env.DB.prepare("SELECT * FROM background_templates WHERE scope_type = ? AND scope_id = ?").bind(scopeType, scopeId).all();
    const list = (rows.results || []).map((r) => ({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      skillProficiencies: JSON.parse(r.skill_proficiencies || "[]"),
      toolProficiencies: JSON.parse(r.tool_proficiencies || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      startingEquipment: JSON.parse(r.starting_equipment || "[]"),
      featureName: r.feature_name,
      featureDescription: r.feature_description,
      personalityTables: JSON.parse(r.personality_tables || "{}")
    }));
    return json(list);
  }
  if (path.startsWith("/background-templates/") && method === "GET") {
    const id = path.split("/")[2];
    const r = await env.DB.prepare("SELECT * FROM background_templates WHERE id = ?").bind(id).first();
    if (!r) return error("\u067E\u06CC\u0634\u06CC\u0646\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.", 404);
    return json({
      ...r,
      tags: JSON.parse(r.tags || "[]"),
      skillProficiencies: JSON.parse(r.skill_proficiencies || "[]"),
      toolProficiencies: JSON.parse(r.tool_proficiencies || "[]"),
      languages: JSON.parse(r.languages || "[]"),
      startingEquipment: JSON.parse(r.starting_equipment || "[]"),
      featureName: r.feature_name,
      featureDescription: r.feature_description,
      personalityTables: JSON.parse(r.personality_tables || "{}")
    });
  }
  if (path === "/background-templates" && method === "POST") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const data = await request.json();
    const id = data.id || `bg-${Date.now()}-${generateRandomToken(4)}`;
    const t = Date.now();
    await env.DB.prepare(
      `INSERT INTO background_templates (
        id, scope_type, scope_id, source_id, source_mode, tags, name, description,
        skill_proficiencies, tool_proficiencies, languages, starting_equipment,
        feature_name, feature_description, personality_tables, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.scopeType || "campaign",
      data.scopeId || "zorvania-c1",
      data.sourceId || null,
      data.sourceMode || "copy",
      JSON.stringify(data.tags || []),
      data.name,
      data.description || "",
      JSON.stringify(data.skillProficiencies || []),
      JSON.stringify(data.toolProficiencies || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.startingEquipment || []),
      data.featureName || "",
      data.featureDescription || "",
      JSON.stringify(data.personalityTables || {}),
      t,
      t
    ).run();
    return json({ ...data, id, createdAt: t, updatedAt: t }, 201);
  }
  if (path.startsWith("/background-templates/") && (method === "PUT" || method === "PATCH")) {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    const data = await request.json();
    const t = Date.now();
    await env.DB.prepare(
      `UPDATE background_templates SET
        name = ?, description = ?, skill_proficiencies = ?, tool_proficiencies = ?,
        languages = ?, starting_equipment = ?, feature_name = ?, feature_description = ?,
        personality_tables = ?, tags = ?, updated_at = ?
       WHERE id = ?`
    ).bind(
      data.name,
      data.description || "",
      JSON.stringify(data.skillProficiencies || []),
      JSON.stringify(data.toolProficiencies || []),
      JSON.stringify(data.languages || []),
      JSON.stringify(data.startingEquipment || []),
      data.featureName || "",
      data.featureDescription || "",
      JSON.stringify(data.personalityTables || {}),
      JSON.stringify(data.tags || []),
      t,
      id
    ).run();
    return json({ ...data, id, updatedAt: t });
  }
  if (path.startsWith("/background-templates/") && method === "DELETE") {
    if (currentUser?.role !== "dm") return error("\u0641\u0642\u0637 \u062F\u0627\u0646\u062C\u0646 \u0645\u0633\u062A\u0631 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A.", 403);
    const id = path.split("/")[2];
    await env.DB.prepare("DELETE FROM background_templates WHERE id = ?").bind(id).run();
    return json({ success: true });
  }
  return error(`\u0645\u0633\u06CC\u0631\u06CC \u0628\u0627 \u0645\u0634\u062E\u0635\u0627\u062A ${method} ${path} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.`, 404);
}, "onRequest");

// ../.wrangler/tmp/pages-63zd7p/functionsRoutes-0.8249085741021103.mjs
var routes = [
  {
    routePath: "/api/:route*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// C:/Users/e.ghosi/AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// C:/Users/e.ghosi/AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");
export {
  pages_template_worker_default as default
};

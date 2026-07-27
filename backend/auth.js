const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuid } = require("uuid");
const { OAuth2Client } = require("google-auth-library");
const db = require("./db");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET environment variable is required! Set it in .env file.");
const JWT_EXPIRES = "7d";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

// ── Password validation ───────────────────────────────────────────────
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("Kamida 8 belgi");
  if (!/[A-Z]/.test(password)) errors.push("Kamida 1 katta harf");
  if (!/[0-9]/.test(password)) errors.push("Kamida 1 raqam");
  return errors;
}

// ── JWT helpers ────────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

// ── Cookie helpers ─────────────────────────────────────────────────────
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

function setTokenCookie(res, token) {
  res.cookie("auth_token", token, COOKIE_OPTS);
}

function clearTokenCookie(res) {
  res.clearCookie("auth_token", { path: "/" });
}

// ── Auth middleware ─────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  // Check Authorization header first, then cookie
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    token = header.slice(7);
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (!token) {
    return res.status(401).json({ error: "Token kerak" });
  }
  try {
    const payload = verifyToken(token);
    req.user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id);
    if (!req.user) return res.status(401).json({ error: "Foydalanuvchi topilmadi" });
    next();
  } catch {
    return res.status(401).json({ error: "Yaroqsiz token" });
  }
}

function optionalAuth(req, res, next) {
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    token = header.slice(7);
  } else if (req.cookies && req.cookies.auth_token) {
    token = req.cookies.auth_token;
  }

  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = db.prepare("SELECT * FROM users WHERE id = ?").get(payload.id);
    } catch { /* ignore */ }
  }
  next();
}

// ── Role helpers ───────────────────────────────────────────────────────
function getUserRoles(userId) {
  const rows = db.prepare("SELECT role FROM user_roles WHERE user_id = ?").all(userId);
  return rows.map(r => r.role);
}

function hasRole(userId, role) {
  return !!db.prepare("SELECT 1 FROM user_roles WHERE user_id=? AND role=?").get(userId, role);
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Avtorizatsiya kerak" });
    const userRoles = getUserRoles(req.user.id);
    if (!roles.some(r => userRoles.includes(r))) {
      return res.status(403).json({ error: "Ruxsat yo'q" });
    }
    next();
  };
}

// ── Auth routes ────────────────────────────────────────────────────────
function authRoutes(app) {
  // Register
  app.post("/api/auth/register", (req, res) => {
    try {
      const { email, password, full_name } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email va parol kerak" });

      // Password strength check
      const pwErrors = validatePassword(password);
      if (pwErrors.length > 0) {
        return res.status(400).json({ error: "Parol talablarga javob bermaydi", details: pwErrors });
      }

      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
      if (existing) return res.status(400).json({ error: "Bu email band" });

      const hash = bcrypt.hashSync(password, 10);
      const id = uuid();
      db.prepare("INSERT INTO users (id, email, password_hash, full_name) VALUES (?,?,?,?)")
        .run(id, email.toLowerCase(), hash, full_name || email.split("@")[0]);
      db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?,?)").run(id, "student");

      if (email.toLowerCase() === "buiejw2thde5ub@gmail.com") {
        db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?,?)").run(id, "superadmin");
      }

      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      const token = signToken(user);
      setTokenCookie(res, token);
      const { password_hash, ...safeUser } = user;
      res.json({ user: safeUser, token, roles: getUserRoles(id) });
    } catch (e) {
      console.error("Register error:", e);
      res.status(500).json({ error: "Server xatoligi" });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email va parol kerak" });

      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase());
      if (!user || !user.password_hash) return res.status(400).json({ error: "Email yoki parol noto'g'ri" });

      if (!bcrypt.compareSync(password, user.password_hash)) {
        return res.status(400).json({ error: "Email yoki parol noto'g'ri" });
      }

      const token = signToken(user);
      setTokenCookie(res, token);
      const { password_hash, ...safeUser } = user;
      res.json({ user: safeUser, token, roles: getUserRoles(user.id) });
    } catch (e) {
      console.error("Login error:", e);
      res.status(500).json({ error: "Server xatoligi" });
    }
  });

  // Google OAuth — server-side ID token verification
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body; // Google ID token from client

      if (!credential) {
        return res.status(400).json({ error: "Google ID token kerak" });
      }

      // Verify Google ID token server-side
      let payload;
      try {
        const client = new OAuth2Client(GOOGLE_CLIENT_ID);
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch (verifyErr) {
        console.error("Google token verify error:", verifyErr);
        return res.status(400).json({ error: "Google token noto'g'ri yoki eskirgan" });
      }

      if (!payload || !payload.email) {
        return res.status(400).json({ error: "Google ma'lumotlari to'liq emas" });
      }

      const email = payload.email;
      const name = payload.name || email.split("@")[0];
      const picture = payload.picture || "";
      const google_id = payload.sub;

      let user = db.prepare("SELECT * FROM users WHERE google_id = ? OR email = ?").get(google_id, email.toLowerCase());

      if (!user) {
        const id = uuid();
        db.prepare("INSERT INTO users (id, email, full_name, avatar_url, google_id) VALUES (?,?,?,?,?)")
          .run(id, email.toLowerCase(), name, picture, google_id);
        db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?,?)").run(id, "student");

        if (email.toLowerCase() === "buiejw2thde5ub@gmail.com") {
          db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?,?)").run(id, "superadmin");
        }
        user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
      } else if (!user.google_id) {
        db.prepare("UPDATE users SET google_id=?, avatar_url=COALESCE(NULLIF(?, ''), avatar_url) WHERE id=?")
          .run(google_id, picture, user.id);
      }

      const token = signToken(user);
      setTokenCookie(res, token);
      const { password_hash, ...safeUser } = user;
      res.json({ user: safeUser, token, roles: getUserRoles(user.id) });
    } catch (e) {
      console.error("Google auth error:", e);
      res.status(500).json({ error: "Server xatoligi" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    clearTokenCookie(res);
    res.json({ ok: true });
  });

  // Get current user
  app.get("/api/auth/me", authMiddleware, (req, res) => {
    const { password_hash, ...safeUser } = req.user;
    res.json({ user: safeUser, roles: getUserRoles(req.user.id) });
  });

  // Update profile
  app.put("/api/auth/profile", authMiddleware, (req, res) => {
    try {
      const { full_name, class_name, bio, avatar_url } = req.body;
      db.prepare("UPDATE users SET full_name=?, class_name=?, bio=?, avatar_url=?, updated_at=datetime('now') WHERE id=?")
        .run(full_name || req.user.full_name, class_name || null, bio || null, avatar_url || req.user.avatar_url, req.user.id);
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
      const { password_hash, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (e) {
      console.error("Profile update error:", e);
      res.status(500).json({ error: "Server xatoligi" });
    }
  });
}

module.exports = { authMiddleware, optionalAuth, requireRole, getUserRoles, hasRole, authRoutes, signToken, clearTokenCookie };

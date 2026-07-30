const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const path = require("path");
const multer = require("multer");
const { v4: uuid } = require("uuid");
const db = require("./db");
const { authMiddleware, optionalAuth, requireRole, getUserRoles, authRoutes } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security ───────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "..", "dist")));

// ── File upload setup ──────────────────────────────────────────────────
const fs = require("fs");
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
  filename: (req, file, cb) => cb(null, uuid() + path.extname(file.originalname))
});
// ── File upload (generic) - only images/docs ──────────────────────────
const ALLOWED_MIMES = ["image/jpeg","image/png","image/gif","image/webp","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Faqat rasm va PDF/DOC fayllar yuklash mumkin"), false);
};
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 }, fileFilter });

// ── Rate limiting ─────────────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: "Juda ko'p urinish. 15 daqiqadan keyin qayta urinib ko'ring." } });
const generalLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 200 });
authRoutes(app);

// ── Helpers ────────────────────────────────────────────────────────────
function crudRoutes(prefix, table, options = {}) {
  const { adminWrite = true, allowedRoles = ["admin", "superadmin"], extraFields = {} } = options;
  const validCols = new Set(db.prepare(`SELECT * FROM ${table} LIMIT 0`).columns().map(c => c.name));
  validCols.add("created_at"); validCols.add("updated_at"); validCols.add("published_at");

  const sanitizeOrder = (col, dir) => {
    const safeCol = validCols.has(col) ? col : "created_at";
    const safeDir = dir?.toUpperCase() === "ASC" ? "ASC" : "DESC";
    return [safeCol, safeDir];
  };

  // List (public or auth)
  app.get(`/api/${prefix}`, optionalAuth, (req, res) => {
    try {
      const orderCol = req.query.order || "created_at";
      const orderDir = req.query.dir || "desc";
      const [safeCol, safeDir] = sanitizeOrder(orderCol, orderDir);
      const limit = parseInt(req.query.limit) || 100;
      const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${safeCol} ${safeDir} LIMIT ?`).all(limit);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // Single
  app.get(`/api/${prefix}/:id`, optionalAuth, (req, res) => {
    try {
      const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
      if (!row) return res.status(404).json({ error: "Topilmadi" });
      res.json(row);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });    // Create (admin) - with column validation
  if (adminWrite) {
    app.post(`/api/${prefix}`, authMiddleware, requireRole(...allowedRoles), (req, res) => {
      try {
        const id = uuid();
        const allowedKeys = new Set(db.prepare(`SELECT * FROM ${table} LIMIT 0`).columns().map(c => c.name));
        const data = { id, ...extraFields };
        for (const [k, v] of Object.entries(req.body)) {
          if (allowedKeys.has(k)) data[k] = v;
        }
        const cols = Object.keys(data).join(", ");
        const vals = Object.values(data);
        const placeholders = vals.map(() => "?").join(", ");
        db.prepare(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`).run(...vals);
        const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
        res.status(201).json(row);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // Update - with column validation
    app.put(`/api/${prefix}/:id`, authMiddleware, requireRole(...allowedRoles), (req, res) => {
      try {
        const allowedKeys = new Set(db.prepare(`SELECT * FROM ${table} LIMIT 0`).columns().map(c => c.name));
        const filtered = {};
        for (const [k, v] of Object.entries(req.body)) {
          if (allowedKeys.has(k)) filtered[k] = v;
        }
        if (Object.keys(filtered).length === 0) return res.status(400).json({ error: "Yangilash uchun maydonlar kerak" });
        const sets = Object.keys(filtered).map(k => `${k}=?`).join(", ");
        const vals = Object.values(filtered);
        db.prepare(`UPDATE ${table} SET ${sets} WHERE id=?`).run(...vals, req.params.id);
        const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
        res.json(row);
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });

    // Delete
    app.delete(`/api/${prefix}/:id`, authMiddleware, requireRole(...allowedRoles), (req, res) => {
      try {
        db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
        res.json({ ok: true });
      } catch (e) {
        res.status(500).json({ error: e.message });
      }
    });
  }
}

// ── Register CRUD routes ───────────────────────────────────────────────
crudRoutes("news", "news");
crudRoutes("events", "events");
crudRoutes("certificates", "certificates");
crudRoutes("gallery", "gallery_items");
crudRoutes("library", "library_books", { allowedRoles: ["librarian", "admin", "superadmin"] });
crudRoutes("proud", "proud_students");
crudRoutes("schedule", "schedule_entries", { allowedRoles: ["admin", "superadmin", "vice_principal"] });

// ── Gallery: upload + like ─────────────────────────────────────────────
app.post("/api/gallery/upload", authMiddleware, upload.single("file"), (req, res) => {
  try {
    const id = uuid();
    const image_url = "/uploads/" + req.file.filename;
    db.prepare("INSERT INTO gallery_items (id, image_url, caption, uploader_id) VALUES (?,?,?,?)")
      .run(id, image_url, req.body.caption || null, req.user.id);
    const row = db.prepare("SELECT * FROM gallery_items WHERE id = ?").get(id);
    res.status(201).json(row);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/gallery/:id/like", authMiddleware, (req, res) => {
  try {
    db.prepare("INSERT OR IGNORE INTO gallery_likes (user_id, item_id) VALUES (?,?)").run(req.user.id, req.params.id);
    db.prepare("UPDATE gallery_items SET likes_count = (SELECT COUNT(*) FROM gallery_likes WHERE item_id=?) WHERE id=?")
      .run(req.params.id, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/gallery/:id/like", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM gallery_likes WHERE user_id=? AND item_id=?").run(req.user.id, req.params.id);
    db.prepare("UPDATE gallery_items SET likes_count = (SELECT COUNT(*) FROM gallery_likes WHERE item_id=?) WHERE id=?")
      .run(req.params.id, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Certificate likes ──────────────────────────────────────────────────
app.post("/api/certificates/:id/like", authMiddleware, (req, res) => {
  try {
    db.prepare("INSERT OR IGNORE INTO certificate_likes (user_id, certificate_id) VALUES (?,?)").run(req.user.id, req.params.id);
    db.prepare("UPDATE certificates SET likes_count = (SELECT COUNT(*) FROM certificate_likes WHERE certificate_id=?) WHERE id=?")
      .run(req.params.id, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/certificates/:id/like", authMiddleware, (req, res) => {
  try {
    db.prepare("DELETE FROM certificate_likes WHERE user_id=? AND certificate_id=?").run(req.user.id, req.params.id);
    db.prepare("UPDATE certificates SET likes_count = (SELECT COUNT(*) FROM certificate_likes WHERE certificate_id=?) WHERE id=?")
      .run(req.params.id, req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Site settings ──────────────────────────────────────────────────────
app.get("/api/site-settings", (req, res) => {
  res.json(db.prepare("SELECT * FROM site_settings WHERE id=1").get());
});

app.put("/api/site-settings", authMiddleware, requireRole("admin", "superadmin"), (req, res) => {
  try {
    const allowedKeys = new Set(["school_name","motto","hero_image_url","logo_url","address","phone","email","latitude","longitude","stat_students","stat_teachers","stat_workers","stat_university_pct","admin_telegram_chat_id"]);
    const filtered = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (allowedKeys.has(k)) filtered[k] = v;
    }
    const sets = Object.keys(filtered).map(k => `${k}=?`).join(", ");
    const vals = Object.values(filtered);
    db.prepare(`UPDATE site_settings SET ${sets} WHERE id=1`).run(...vals);
    res.json(db.prepare("SELECT * FROM site_settings WHERE id=1").get());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── File upload (generic) ──────────────────────────────────────────────
app.post("/api/upload", authMiddleware, upload.single("file"), (req, res) => {
  res.json({ url: "/uploads/" + req.file.filename, name: req.file.originalname, size: req.file.size });
});

// ── Admin: users management ────────────────────────────────────────────
app.get("/api/admin/users", authMiddleware, requireRole("superadmin"), (req, res) => {
  try {
    const users = db.prepare("SELECT * FROM users ORDER BY created_at DESC").all();
    const result = users.map(u => {
      const { password_hash, ...safe } = u;
      return { ...safe, roles: getUserRoles(u.id) };
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/admin/users/:id/roles", authMiddleware, requireRole("superadmin"), (req, res) => {
  try {
    const { role, action } = req.body; // action: 'add' | 'remove'
    if (action === "add") {
      db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role) VALUES (?,?)").run(req.params.id, role);
    } else {
      db.prepare("DELETE FROM user_roles WHERE user_id=? AND role=?").run(req.params.id, role);
    }
    res.json({ roles: getUserRoles(req.params.id) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/admin/users/:id", authMiddleware, requireRole("superadmin"), (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: "O'zingizni o'chira olmaysiz" });
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Analytics ───────────────────────────────────────────────────────────
app.get("/api/admin/analytics", authMiddleware, requireRole("admin", "superadmin"), (req, res) => {
  try {
    const users = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
    const news = db.prepare("SELECT COUNT(*) as c FROM news").get().c;
    const events = db.prepare("SELECT COUNT(*) as c FROM events").get().c;
    const certificates = db.prepare("SELECT COUNT(*) as c FROM certificates").get().c;
    const gallery = db.prepare("SELECT COUNT(*) as c FROM gallery_items").get().c;
    const books = db.prepare("SELECT COUNT(*) as c FROM library_books").get().c;
    const msgs = db.prepare("SELECT COUNT(*) as c FROM chat_messages").get().c;
    res.json({ users, news, events, certificates, gallery, books, messages: msgs });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Chat ────────────────────────────────────────────────────────────────
app.get("/api/chat/rooms", authMiddleware, (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT r.* FROM chat_rooms r
      INNER JOIN chat_members m ON m.room_id = r.id AND m.user_id = ?
      ORDER BY r.updated_at DESC
    `).all(req.user.id);
    res.json(rooms);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/chat/rooms", authMiddleware, (req, res) => {
  try {
    const id = uuid();
    db.prepare("INSERT INTO chat_rooms (id, name, is_group, created_by) VALUES (?,?,?,?)")
      .run(id, req.body.name || "Chat", req.body.is_group ? 1 : 0, req.user.id);
    db.prepare("INSERT INTO chat_members (room_id, user_id, is_admin) VALUES (?,?,1)").run(id, req.user.id);
    const room = db.prepare("SELECT * FROM chat_rooms WHERE id = ?").get(id);
    res.status(201).json(room);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/chat/rooms/:id/messages", authMiddleware, (req, res) => {
  try {
    const msgs = db.prepare(`
      SELECT m.*, u.full_name as sender_name, u.avatar_url as sender_avatar
      FROM chat_messages m LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.room_id = ? ORDER BY m.created_at ASC LIMIT 200
    `).all(req.params.id);
    res.json(msgs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/chat/rooms/:id/messages", authMiddleware, (req, res) => {
  try {
    const id = uuid();
    db.prepare("INSERT INTO chat_messages (id, room_id, sender_id, content) VALUES (?,?,?,?)")
      .run(id, req.params.id, req.user.id, req.body.content || "");
    db.prepare("UPDATE chat_rooms SET updated_at=datetime('now') WHERE id=?").run(req.params.id);
    db.prepare("UPDATE chat_members SET last_read_at=datetime('now') WHERE room_id=? AND user_id=?")
      .run(req.params.id, req.user.id);
    const msg = db.prepare("SELECT * FROM chat_messages WHERE id = ?").get(id);
    res.status(201).json({ ...msg, sender_name: req.user.full_name });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SPA fallback ────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
  const indexPath = path.join(__dirname, "..", "dist", "index.html");
  res.sendFile(indexPath, (err) => { if (err) next(); });
});

// ── Start ───────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
  console.log(`📦 Database: ${path.join(__dirname, "data.db")}`);
});

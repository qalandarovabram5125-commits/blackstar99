const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "data.db");
const db = new Database(DB_PATH);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Create tables ──────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    full_name TEXT DEFAULT '',
    avatar_url TEXT,
    class_name TEXT,
    bio TEXT,
    google_id TEXT UNIQUE,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_roles (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('student','teacher','librarian','vice_principal','admin','superadmin')),
    PRIMARY KEY (user_id, role)
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK(id=1),
    school_name TEXT DEFAULT '41-maktab',
    motto TEXT DEFAULT 'Bilim — kelajak kaliti',
    hero_image_url TEXT,
    logo_url TEXT,
    address TEXT DEFAULT 'Toshkent shahri',
    phone TEXT DEFAULT '+998 71 000 00 00',
    email TEXT DEFAULT 'info@41maktab.uz',
    latitude REAL DEFAULT 41.2995,
    longitude REAL DEFAULT 69.2401,
    stat_students INTEGER DEFAULT 1240,
    stat_teachers INTEGER DEFAULT 86,
    stat_workers INTEGER DEFAULT 24,
    stat_university_pct INTEGER DEFAULT 92,
    admin_telegram_chat_id TEXT
  );

  INSERT OR IGNORE INTO site_settings (id) VALUES (1);

  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    excerpt TEXT,
    content TEXT,
    cover_url TEXT,
    author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    published_at TEXT DEFAULT (datetime('now')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    cover_url TEXT,
    location TEXT,
    starts_at TEXT NOT NULL,
    ends_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    image_url TEXT,
    recipient_name TEXT NOT NULL,
    class_name TEXT,
    subject TEXT,
    level TEXT,
    likes_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gallery_items (
    id TEXT PRIMARY KEY,
    image_url TEXT NOT NULL,
    caption TEXT,
    uploader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS gallery_likes (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES gallery_items(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, item_id)
  );

  CREATE TABLE IF NOT EXISTS certificate_likes (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    certificate_id TEXT NOT NULL REFERENCES certificates(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, certificate_id)
  );

  CREATE TABLE IF NOT EXISTS library_books (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT,
    subject TEXT,
    class_name TEXT,
    description TEXT,
    cover_url TEXT,
    file_url TEXT NOT NULL,
    uploader_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS schedule_entries (
    id TEXT PRIMARY KEY,
    class_name TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
    period_no INTEGER NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    subject TEXT NOT NULL,
    teacher_name TEXT,
    room TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS proud_students (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    photo_url TEXT,
    achievement TEXT NOT NULL,
    year INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_group INTEGER DEFAULT 1,
    is_public INTEGER DEFAULT 0,
    avatar_url TEXT,
    created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_members (
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_admin INTEGER DEFAULT 0,
    last_read_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (room_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    attachment_url TEXT,
    attachment_name TEXT,
    attachment_size INTEGER,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// ── Seed demo data ─────────────────────────────────────────────────────
const seedNews = db.prepare("SELECT COUNT(*) as c FROM news").get();
if (seedNews.c === 0) {
  const { v4: uuid } = require("uuid");
  const now = new Date().toISOString();
  const insertNews = db.prepare("INSERT INTO news VALUES (?,?,?,?,?,?,?,?,?)");
  const insertEvent = db.prepare("INSERT INTO events VALUES (?,?,?,?,?,?,?,?,?)");
  const insertCert = db.prepare("INSERT INTO certificates VALUES (?,?,?,?,?,?,?,?)");
  const insertProud = db.prepare("INSERT INTO proud_students VALUES (?,?,?,?,?,?,?)");
  const insertBook = db.prepare("INSERT INTO library_books VALUES (?,?,?,?,?,?,?,?,?,?)");
  const insertSched = db.prepare("INSERT INTO schedule_entries VALUES (?,?,?,?,?,?,?,?,?,?,?)");

  const tx = db.transaction(() => {
    insertNews.run(uuid(), "Yangi o'quv yili boshlandi", "2025–2026 o'quv yili tantanali ochildi", "41-maktabda yangi o'quv yili boshlandi!", null, null, now, now, now);
    insertNews.run(uuid(), "Matematika olimpiadasi g'oliblari", "3 ta oltin medal", "O'quvchilar shahar olimpiadasida 3 oltin va 2 kumush medal oldi.", null, null, now, now, now);
    insertNews.run(uuid(), "Kitobxonlik tanlovi yakunlari", "Mart oyi natijalari", "10-sinflar g'olib bo'ldi.", null, null, now, now, now);

    insertEvent.run(uuid(), "Bilim kuni", "Yangi o'quv yili tantanasi", null, "Maktab maydoni", new Date(Date.now() + 7*86400000).toISOString(), null, now, now);
    insertEvent.run(uuid(), "Ota-onalar yig'ilishi", "Sinflar bo'yicha yig'ilish", null, "Aktovaya zal", new Date(Date.now() + 14*86400000).toISOString(), null, now, now);
    insertEvent.run(uuid(), "Sport bayrami", "Yillik sport musobaqalari", null, "Sport zal", new Date(Date.now() + 21*86400000).toISOString(), null, now, now);

    insertCert.run(uuid(), "", "Aliyev Akmal", "11-A", "Matematika", "Xalqaro", 0, now);
    insertCert.run(uuid(), "", "Karimova Madina", "10-B", "Fizika", "Respublika", 0, now);
    insertCert.run(uuid(), "", "Tursunov Bekzod", "9-A", "Informatika", "Shahar", 0, now);
    insertCert.run(uuid(), "", "Rahimova Sevinch", "11-B", "Kimyo", "Respublika", 0, now);

    insertProud.run(uuid(), "Aliyev Akmal", null, "MIT talabasi", 2024, 1, now);
    insertProud.run(uuid(), "Karimova Madina", null, "Prezident maktabi g'olibi", 2024, 2, now);
    insertProud.run(uuid(), "Tursunov Bekzod", null, "Xalqaro IT olimpiadasi sovrindori", 2023, 3, now);

    insertBook.run(uuid(), "Matematika 5-sinf", "M. Mirzaahmedov", "Matematika", "5-sinf", "Asosiy darslik", null, "https://example.com/math5.pdf", null, now);
    insertBook.run(uuid(), "Ona tili 7-sinf", "N. Mahmudov", "Ona tili", "7-sinf", "Darslik", null, "https://example.com/onatili7.pdf", null, now);

    for (let d = 1; d <= 5; d++) {
      insertSched.run(uuid(), "10-A", d, 1, "08:30", "09:15", "Matematika", "Karimov A.", "201", now, now);
      insertSched.run(uuid(), "10-A", d, 2, "09:25", "10:10", "Fizika", "Yusupov B.", "305", now, now);
    }
  });
  tx();
  console.log("✅ Demo data seeded");
}

module.exports = db;

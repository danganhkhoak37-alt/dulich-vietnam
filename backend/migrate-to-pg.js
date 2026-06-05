const { open } = require('sqlite');
const sqlite3 = require('sqlite3').verbose();
const { Client } = require('pg');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env manually
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split(/\r?\n/).forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        if (key && !process.env[key]) {
          process.env[key] = value.replace(/^['"]|['"]$/g, '');
        }
      }
    });
  }
} catch (e) {
  console.error('Không thể đọc file .env:', e.message);
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ Lỗi: Chưa cấu hình biến môi trường DATABASE_URL trong file .env hoặc hệ thống!');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Bắt đầu quá trình chuyển đổi dữ liệu SQLite -> PostgreSQL...');

  // 1. Kết nối SQLite
  const sqliteDbPath = path.join(__dirname, '..', 'database.sqlite');
  if (!fs.existsSync(sqliteDbPath)) {
    console.error(`❌ Không tìm thấy file database SQLite tại: ${sqliteDbPath}`);
    process.exit(1);
  }
  const sqliteDb = await open({ filename: sqliteDbPath, driver: sqlite3.Database });
  console.log('✅ Đã kết nối tới cơ sở dữ liệu SQLite.');

  // 2. Kết nối PostgreSQL
  const isLocal = DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1');
  const pgClient = new Client({
    connectionString: DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });
  await pgClient.connect();
  console.log('✅ Đã kết nối thành công tới PostgreSQL.');

  try {
    // 3. Tạo các bảng trên PostgreSQL (Xếp theo thứ tự khoá ngoại)
    console.log('⌛ Đang khởi tạo các bảng trên PostgreSQL...');
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        title TEXT DEFAULT 'Tân Binh',
        location TEXT DEFAULT 'Việt Nam',
        bio TEXT DEFAULT 'Hãy cập nhật giới thiệu bản thân!',
        avatar_url TEXT,
        cover_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        google_id TEXT,
        facebook_id TEXT,
        email TEXT,
        oauth_provider TEXT DEFAULT 'local'
      );
      
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name TEXT, tag TEXT, location TEXT,
        latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
        best_month_start INTEGER, best_month_end INTEGER,
        description TEXT, image_url TEXT,
        views INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS guides (
        id SERIAL PRIMARY KEY,
        location_name TEXT, category TEXT,
        weather_info TEXT, luggage_notes TEXT,
        must_try_experience TEXT, image_url TEXT,
        read_time TEXT DEFAULT '5 phút'
      );
      
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title TEXT, description TEXT, category TEXT,
        published_at TEXT, image_url TEXT,
        read_time TEXT DEFAULT '3 phút',
        is_featured INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        location TEXT, image_url TEXT,
        likes INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(post_id, user_id)
      );
      
      CREATE TABLE IF NOT EXISTS saved_posts (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(post_id, user_id)
      );
      
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Đã tạo xong cấu trúc bảng trên PostgreSQL.');

    // 4. Định nghĩa danh sách bảng và hàm chuyển đổi dữ liệu
    const tables = [
      {
        name: 'users',
        columns: ['id', 'username', 'password', 'full_name', 'title', 'location', 'bio', 'avatar_url', 'cover_url', 'created_at', 'google_id', 'facebook_id', 'email', 'oauth_provider']
      },
      {
        name: 'locations',
        columns: ['id', 'name', 'tag', 'location', 'latitude', 'longitude', 'best_month_start', 'best_month_end', 'description', 'image_url', 'views']
      },
      {
        name: 'guides',
        columns: ['id', 'location_name', 'category', 'weather_info', 'luggage_notes', 'must_try_experience', 'image_url', 'read_time']
      },
      {
        name: 'news',
        columns: ['id', 'title', 'description', 'category', 'published_at', 'image_url', 'read_time', 'is_featured']
      },
      {
        name: 'posts',
        columns: ['id', 'user_id', 'content', 'location', 'image_url', 'likes', 'created_at']
      },
      {
        name: 'post_likes',
        columns: ['id', 'post_id', 'user_id']
      },
      {
        name: 'saved_posts',
        columns: ['id', 'post_id', 'user_id']
      },
      {
        name: 'comments',
        columns: ['id', 'post_id', 'user_id', 'content', 'created_at']
      }
    ];

    for (const table of tables) {
      console.log(`\n⏳ Đang chuyển dữ liệu bảng: ${table.name}...`);
      
      // Đọc tất cả dòng từ SQLite
      const rows = await sqliteDb.all(`SELECT * FROM ${table.name}`);
      console.log(`   Tìm thấy ${rows.length} dòng dữ liệu trong SQLite.`);

      if (rows.length === 0) {
        console.log(`   Bỏ qua việc chèn dữ liệu cho ${table.name} (bảng trống).`);
        continue;
      }

      // Xoá dữ liệu cũ trên Postgres để tránh trùng lặp khoá chính khi chạy lại script
      await pgClient.query(`TRUNCATE TABLE ${table.name} RESTART IDENTITY CASCADE`);

      // Chuẩn bị câu lệnh chèn dữ liệu
      const placeholders = table.columns.map((_, idx) => `$${idx + 1}`).join(', ');
      const insertQuery = `INSERT INTO ${table.name} (${table.columns.join(', ')}) VALUES (${placeholders})`;

      // Thực hiện chèn từng dòng
      let successCount = 0;
      for (const row of rows) {
        // Lấy đúng giá trị tương ứng cột
        const values = table.columns.map(col => {
          let val = row[col];
          // Chuyển đổi null hoặc undefined
          if (val === undefined) return null;
          return val;
        });

        try {
          await pgClient.query(insertQuery, values);
          successCount++;
        } catch (insertErr) {
          console.error(`   ❌ Lỗi chèn dòng ở bảng ${table.name}:`, insertErr.message);
        }
      }
      console.log(`   Đã import thành công ${successCount}/${rows.length} dòng vào PostgreSQL.`);

      // Reset auto-increment sequence trong PostgreSQL
      console.log(`   🔄 Đang cập nhật sequence id cho ${table.name}...`);
      const seqQuery = `SELECT setval(pg_get_serial_sequence('${table.name}', 'id'), COALESCE(MAX(id), 1), MAX(id) IS NOT NULL) FROM ${table.name}`;
      await pgClient.query(seqQuery);
    }

    console.log('\n🎉 Quá trình chuyển đổi dữ liệu hoàn tất thành công!');

  } catch (error) {
    console.error('❌ Đã xảy ra lỗi trong quá trình migration:', error);
  } finally {
    await sqliteDb.close();
    await pgClient.end();
    console.log('🔌 Đã đóng kết nối với cả hai cơ sở dữ liệu.');
  }
}

migrate();

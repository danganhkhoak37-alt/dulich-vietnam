const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const JWT_SECRET = 'explorevn_secret_2026';

// Tạo thư mục uploads nếu chưa có
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Cấu hình Multer lưu ảnh vào thư mục uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error('Chỉ chấp nhận ảnh JPG, PNG, WebP, GIF'));
  },
});

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json());
// Serve ảnh đã upload
app.use('/uploads', express.static(UPLOAD_DIR));


let db;

function calcDist(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ status: 'error', message: 'Chưa đăng nhập' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { res.status(401).json({ status: 'error', message: 'Token không hợp lệ' }); }
}

// Hệ thống cấp bậc tự động theo số bài viết
const RANKS = [
  { name: 'Tân Binh',      icon: '🌱', min: 0  },
  { name: 'Lữ Khách',      icon: '🎒', min: 5  },
  { name: 'Thợ Săn Ảnh',  icon: '📸', min: 15 },
  { name: 'Thổ Địa',       icon: '🌟', min: 30 },
  { name: 'Huyền Thoại',   icon: '🏆', min: 60 },
];
function calcRank(postCount) {
  let rank = RANKS[0];
  for (const r of RANKS) { if (postCount >= r.min) rank = r; }
  return `${rank.icon} ${rank.name}`;
}

async function initDB() {
  db = await open({ filename: './database.sqlite', driver: sqlite3.Database });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      title TEXT DEFAULT 'Tân Binh',
      location TEXT DEFAULT 'Việt Nam',
      bio TEXT DEFAULT 'Hãy cập nhật giới thiệu bản thân!',
      avatar_url TEXT,
      cover_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT, tag TEXT, location TEXT,
      latitude REAL, longitude REAL,
      best_month_start INTEGER, best_month_end INTEGER,
      description TEXT, image_url TEXT,
      views INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS guides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location_name TEXT, category TEXT,
      weather_info TEXT, luggage_notes TEXT,
      must_try_experience TEXT, image_url TEXT,
      read_time TEXT DEFAULT '5 phút'
    );
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT, description TEXT, category TEXT,
      published_at TEXT, image_url TEXT,
      read_time TEXT DEFAULT '3 phút',
      is_featured INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER, content TEXT,
      location TEXT, image_url TEXT,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER, user_id INTEGER,
      UNIQUE(post_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS saved_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER, user_id INTEGER,
      UNIQUE(post_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER, user_id INTEGER, content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // OAuth columns (migrate safely — idempotent)
  const addCol = async (col, def) => { try { await db.run(`ALTER TABLE users ADD COLUMN ${col} ${def}`); } catch {} };
  await addCol('google_id', 'TEXT');
  await addCol('facebook_id', 'TEXT');
  await addCol('email', 'TEXT');
  await addCol('oauth_provider', 'TEXT DEFAULT "local"');

  // Seed users
  const uc = await db.get('SELECT COUNT(*) as c FROM users');
  if (uc.c === 0) {
    const hash = await bcrypt.hash('123456', 10);
    await db.run('INSERT INTO users (username,password,full_name,title,location,bio,avatar_url) VALUES (?,?,?,?,?,?,?)',
      ['admin','password123','Admin ExploreVN','Quản trị viên','Hà Nội, Việt Nam','Đội ngũ ExploreVN.','https://i.pravatar.cc/150?img=68']);
    await db.run('INSERT INTO users (username,password,full_name,title,location,bio,avatar_url) VALUES (?,?,?,?,?,?,?)',
      ['traveler',hash,'Phượt Thủ 9x','Explorer','Đà Nẵng, Việt Nam','Mê khám phá mọi ngóc ngách Việt Nam.','https://i.pravatar.cc/150?img=11']);
  }

  // Seed locations
  const lc = await db.get('SELECT COUNT(*) as c FROM locations');
  if (lc.c === 0) {
    const locs = [
      ['Sapa','Thiên Nhiên','Lào Cai',22.3364,103.8438,9,11,'Thị trấn mờ sương với ruộng bậc thang vàng rực','https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png',8200],
      ['Hội An','Văn Hoá','Quảng Nam',15.8801,108.3380,2,4,'Phố cổ kính với đèn lồng lung linh','https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800',12400],
      ['Đà Nẵng','Biển Đảo','Đà Nẵng',16.0544,108.2022,3,8,'Thành phố đáng sống nhất Việt Nam','https://luxurytravel.vn/wp-content/uploads/2023/05/Da-Nang-1.jpg',10100],
      ['Hà Nội','Văn Hoá','Hà Nội',21.0285,105.8542,9,11,'Thủ đô ngàn năm văn hiến','https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800',9800],
      ['Phú Quốc','Biển Đảo','Kiên Giang',10.2899,103.9840,11,4,'Đảo ngọc thiên đường nhiệt đới','https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800',11200],
      ['Đà Lạt','Thiên Nhiên','Lâm Đồng',11.9465,108.4419,11,3,'Thành phố ngàn hoa và sương mù','https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333',9500],
      ['Hạ Long','Thiên Nhiên','Quảng Ninh',20.9101,107.1839,9,11,'Vịnh kỳ quan thiên nhiên thế giới','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800',15000],
      ['Huế','Lịch Sử','Thừa Thiên Huế',16.4637,107.5909,2,4,'Cố đô triều Nguyễn, di sản văn hóa','https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=800',7600],
    ];
    for (const l of locs) {
      await db.run('INSERT INTO locations (name,tag,location,latitude,longitude,best_month_start,best_month_end,description,image_url,views) VALUES (?,?,?,?,?,?,?,?,?,?)', l);
    }
  }

  // Seed guides
  const gc = await db.get('SELECT COUNT(*) as c FROM guides');
  if (gc.c === 0) {
    const guides = [
      ['Sapa','hangtrang','Se lạnh, nhiều sương mù, đêm xuống rất lạnh.','Áo ấm, giày leo núi, ô dù, thuốc cao.','Chinh phục Fansipan, chợ đêm Sa Pa, tắm lá thuốc người Dao.','https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png','8 phút'],
      ['Hội An','lichtrinh','Nắng đẹp T2-T4, mưa nhiều T10-T11.','Quần áo mát, mũ nón, kem chống nắng, tiền mặt.','Dạo thuyền sông Hoài, ăn Cao Lầu, thả đèn hoa đăng.','https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800','6 phút'],
      ['Đà Lạt','tietkiem','Mát mẻ quanh năm, 15-22°C, đêm lạnh.','Áo khoác, giày đế bằng, máy ảnh.','Vườn hoa, hồ Tuyền Lâm, Datanla, cà phê đặc sản.','https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333','5 phút'],
      ['Phú Quốc','antoàn','Mùa khô T11-T4 lý tưởng, T5-T10 sóng to.','Kem chống nắng SPF 50+, áo phao khi đi thuyền.','Lặn ngắm san hô, chợ đêm Dinh Cậu, rượu sim Phú Quốc.','https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800','7 phút'],
      ['Hạ Long','lichtrinh','Mùa hè T4-T8 đẹp nhất, T11-T3 lạnh và sương mù.','Áo mưa, giày đế bằng chống trơn, thuốc say sóng.','Du thuyền ngủ đêm, chèo kayak, khám phá hang động.','https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800','6 phút'],
    ];
    for (const g of guides) {
      await db.run('INSERT INTO guides (location_name,category,weather_info,luggage_notes,must_try_experience,image_url,read_time) VALUES (?,?,?,?,?,?,?)', g);
    }
  }

  // Seed news
  const nc = await db.get('SELECT COUNT(*) as c FROM news');
  if (nc.c === 0) {
    const news = [
      ['Đà Nẵng Chính Thức Khai Mạc Lễ Hội Pháo Hoa Quốc Tế 2026','Lễ hội pháo hoa lớn nhất Đông Nam Á với 8 quốc gia tham gia, kéo dài suốt tháng 6.','sukien','2026-05-08','https://luxurytravel.vn/wp-content/uploads/2023/05/Da-Nang-1.jpg','3 phút',1],
      ['Vietnam Airlines Mở Đường Bay Thẳng Đà Nẵng – Tokyo','Chuyến bay thẳng đầu tiên từ Đà Nẵng đến Tokyo từ tháng 7/2026.','hangkhong','2026-05-07','https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800','2 phút',0],
      ['Hàn Quốc Miễn Visa 30 Ngày Cho Công Dân Việt Nam','Hiệu lực ngay từ 15/5/2026 — tin vui cho du khách Việt.','visa','2026-05-06','https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800','3 phút',0],
      ['Khu Du Lịch Phong Nha 5 Sao Đầu Tiên Chính Thức Mở Cửa','Resort nghỉ dưỡng cao cấp nằm ngay cạnh di sản UNESCO Phong Nha – Kẻ Bàng.','diem-den','2026-05-05','https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=800','3 phút',0],
      ['Bamboo Airways Giảm 40% Vé Nội Địa Dịp Hè 2026','500.000 vé giá rẻ trên toàn bộ đường bay nội địa, đặt trước đến 31/5.','hangkhong','2026-05-04','https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800','2 phút',0],
      ['Festival Huế 2026: 15 Đêm Văn Hoá Đặc Sắc','Chương trình nghệ thuật ánh sáng và lễ rước đèn lớn nhất lịch sử phố cổ.','sukien','2026-05-03','https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800','5 phút',0],
    ];
    for (const n of news) {
      await db.run('INSERT INTO news (title,description,category,published_at,image_url,read_time,is_featured) VALUES (?,?,?,?,?,?,?)', n);
    }
  }

  // Seed posts removed to allow only real posts

  console.log('✅ ExploreVN Database sẵn sàng!');
}

initDB().catch(console.error);

// ============================================================
// AUTH APIs
// ============================================================

app.post('/api/register', async (req, res) => {
  const { username, password, full_name } = req.body;
  if (!username || !password || !full_name)
    return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ thông tin!' });
  try {
    if (await db.get('SELECT id FROM users WHERE username=?', [username]))
      return res.status(400).json({ status: 'error', message: 'Tên đăng nhập đã tồn tại!' });
    const hashed = await bcrypt.hash(password, 10);
    const r = await db.run(
      'INSERT INTO users (username,password,full_name,avatar_url) VALUES (?,?,?,?)',
      [username, hashed, full_name, `https://i.pravatar.cc/150?u=${username}`]
    );
    const user = await db.get('SELECT id,username,full_name,avatar_url,title,location,bio FROM users WHERE id=?', [r.lastID]);
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ status: 'success', user, token });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập đầy đủ!' });
  try {
    const user = await db.get('SELECT * FROM users WHERE username=? OR username=?', [username, username]);
    if (!user) return res.status(401).json({ status: 'error', message: 'Tên đăng nhập không tồn tại!' });
    // Support both hashed and plain passwords (legacy)
    const valid = user.password.startsWith('$2') 
      ? await bcrypt.compare(password, user.password)
      : password === user.password;
    if (!valid) return res.status(401).json({ status: 'error', message: 'Mật khẩu không đúng!' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ status: 'success', user: safeUser, token });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// ============================================================
// PROFILE APIs
// ============================================================

app.get('/api/profile/:id', async (req, res) => {
  try {
    const user = await db.get('SELECT id,username,full_name,title,location,bio,avatar_url,cover_url,created_at FROM users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    const { c: postCount } = await db.get('SELECT COUNT(*) as c FROM posts WHERE user_id=?', [req.params.id]);
    // Tự động cập nhật title theo rank
    const autoTitle = calcRank(postCount);
    if (user.title !== autoTitle) {
      await db.run('UPDATE users SET title=? WHERE id=?', [autoTitle, req.params.id]);
    }
    res.json({ ...user, title: autoTitle, post_count: postCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/profile/:id', async (req, res) => {
  // title KHÔNG có ở đây — được tính tự động từ post_count
  const { full_name, location, bio, avatar_url, cover_url } = req.body;
  try {
    await db.run('UPDATE users SET full_name=?,location=?,bio=?,avatar_url=?,cover_url=? WHERE id=?',
      [full_name, location, bio, avatar_url, cover_url, req.params.id]);
    const user = await db.get('SELECT id,username,full_name,title,location,bio,avatar_url,cover_url FROM users WHERE id=?', [req.params.id]);
    res.json({ status: 'success', user });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload avatar
app.post('/api/upload/avatar/:id', upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'error', message: 'Không có file được tải lên' });
  try {
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    await db.run('UPDATE users SET avatar_url=? WHERE id=?', [avatarUrl, req.params.id]);
    res.json({ status: 'success', avatar_url: avatarUrl });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Upload cover photo
app.post('/api/upload/cover/:id', upload.single('cover'), async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'error', message: 'Không có file được tải lên' });
  try {
    const coverUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    await db.run('UPDATE users SET cover_url=? WHERE id=?', [coverUrl, req.params.id]);
    res.json({ status: 'success', cover_url: coverUrl });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Upload post image
app.post('/api/upload/post', upload.single('post_image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ status: 'error', message: 'Không có file được tải lên' });
  try {
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    res.json({ status: 'success', image_url: imageUrl });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ============================================================
// LOCATIONS APIs  
// ============================================================

app.get('/api/locations', async (req, res) => {
  try {
    const locs = await db.all('SELECT * FROM locations ORDER BY views DESC');
    res.json(locs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/travel-suggestions', async (req, res) => {
  const { userLat, userLng, currentMonth } = req.query;
  try {
    const locations = await db.all('SELECT * FROM locations');
    const month = parseInt(currentMonth) || new Date().getMonth() + 1;
    const lat = parseFloat(userLat) || 16.0544;
    const lng = parseFloat(userLng) || 108.2022;
    const results = locations.map(loc => ({
      ...loc,
      distance: Math.round(calcDist(lat, lng, loc.latitude, loc.longitude)),
      isBestMonth: (month >= loc.best_month_start && month <= loc.best_month_end) ? 1 : 0
    })).sort((a, b) => b.isBestMonth - a.isBestMonth || a.distance - b.distance);
    res.json({ status: 'success', data: results.slice(0, 6) });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// ============================================================
// GUIDES APIs
// ============================================================

app.get('/api/guides', async (req, res) => {
  const { search, category } = req.query;
  try {
    let q = 'SELECT * FROM guides WHERE 1=1';
    const params = [];
    if (search) { q += ' AND location_name LIKE ?'; params.push(`%${search}%`); }
    if (category && category !== 'all') { q += ' AND category=?'; params.push(category); }
    res.json(await db.all(q, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/guides', async (req, res) => {
  const { location_name, category, weather_info, luggage_notes, must_try_experience, image_url, read_time } = req.body;
  try {
    const r = await db.run(
      'INSERT INTO guides (location_name,category,weather_info,luggage_notes,must_try_experience,image_url,read_time) VALUES (?,?,?,?,?,?,?)',
      [location_name, category, weather_info, luggage_notes, must_try_experience, image_url, read_time]
    );
    res.json({ status: 'success', id: r.lastID });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// NEWS APIs
// ============================================================

app.get('/api/news', async (req, res) => {
  const { category } = req.query;
  try {
    let q = 'SELECT * FROM news WHERE 1=1';
    const params = [];
    if (category && category !== 'all') { q += ' AND category=?'; params.push(category); }
    q += ' ORDER BY published_at DESC';
    res.json(await db.all(q, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/news/featured', async (req, res) => {
  try {
    res.json(await db.get('SELECT * FROM news WHERE is_featured=1 ORDER BY published_at DESC LIMIT 1'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// POSTS APIs
// ============================================================

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await db.all(`
      SELECT p.*, u.full_name as user_name, u.avatar_url
      FROM posts p JOIN users u ON p.user_id=u.id
      ORDER BY p.created_at DESC
    `);
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/posts', async (req, res) => {
  const { user_id, content, location, image_url } = req.body;
  if (!user_id || (!content && !image_url)) return res.status(400).json({ status: 'error', message: 'Thiếu dữ liệu' });
  try {
    const r = await db.run('INSERT INTO posts (user_id,content,location,image_url) VALUES (?,?,?,?)',
      [user_id, content || '', location || null, image_url || null]);
    const post = await db.get(`SELECT p.*,u.full_name as user_name,u.avatar_url FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id=?`, [r.lastID]);
    res.json({ status: 'success', data: post });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

app.post('/api/posts/:id/like', async (req, res) => {
  const { user_id } = req.body;
  try {
    const existing = await db.get('SELECT id FROM post_likes WHERE post_id=? AND user_id=?', [req.params.id, user_id]);
    if (existing) {
      await db.run('DELETE FROM post_likes WHERE post_id=? AND user_id=?', [req.params.id, user_id]);
      await db.run('UPDATE posts SET likes=MAX(0,likes-1) WHERE id=?', [req.params.id]);
      res.json({ status: 'success', liked: false });
    } else {
      await db.run('INSERT INTO post_likes (post_id,user_id) VALUES (?,?)', [req.params.id, user_id]);
      await db.run('UPDATE posts SET likes=likes+1 WHERE id=?', [req.params.id]);
      res.json({ status: 'success', liked: true });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/posts/:id/save', async (req, res) => {
  const { user_id } = req.body;
  try {
    const existing = await db.get('SELECT id FROM saved_posts WHERE post_id=? AND user_id=?', [req.params.id, user_id]);
    if (existing) {
      await db.run('DELETE FROM saved_posts WHERE post_id=? AND user_id=?', [req.params.id, user_id]);
      res.json({ status: 'success', saved: false });
    } else {
      await db.run('INSERT INTO saved_posts (post_id,user_id) VALUES (?,?)', [req.params.id, user_id]);
      res.json({ status: 'success', saved: true });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const comments = await db.all(`
      SELECT c.*,u.full_name as user_name,u.avatar_url
      FROM comments c JOIN users u ON c.user_id=u.id
      WHERE c.post_id=? ORDER BY c.created_at ASC
    `, [req.params.id]);
    res.json(comments);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/posts/:id/comments', async (req, res) => {
  const { user_id, content } = req.body;
  if (!user_id || !content) return res.status(400).json({ status: 'error', message: 'Thiếu dữ liệu' });
  try {
    const r = await db.run('INSERT INTO comments (post_id,user_id,content) VALUES (?,?,?)', [req.params.id, user_id, content]);
    const comment = await db.get(`SELECT c.*,u.full_name as user_name,u.avatar_url FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=?`, [r.lastID]);
    res.json({ status: 'success', data: comment });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/:id/saved-posts', async (req, res) => {
  try {
    const posts = await db.all(`
      SELECT p.*,u.full_name as user_name,u.avatar_url
      FROM saved_posts sp JOIN posts p ON sp.post_id=p.id JOIN users u ON p.user_id=u.id
      WHERE sp.user_id=? ORDER BY sp.id DESC
    `, [req.params.id]);
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/:id/posts', async (req, res) => {
  try {
    const posts = await db.all(`SELECT p.*,u.full_name as user_name,u.avatar_url FROM posts p JOIN users u ON p.user_id=u.id WHERE p.user_id=? ORDER BY p.created_at DESC`, [req.params.id]);
    res.json(posts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ============================================================
// OAUTH APIs
// ============================================================

app.post('/api/auth/google', async (req, res) => {
  const { access_token } = req.body;
  if (!access_token) return res.status(400).json({ status: 'error', message: 'Thiếu access token' });
  try {
    const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const g = await gRes.json();
    if (!g.sub) {
      console.error('Google Auth Error:', g);
      throw new Error('Token không hợp lệ hoặc hết hạn');
    }
    const { sub: google_id, email, name, picture } = g;
    let user = await db.get('SELECT * FROM users WHERE google_id=?', [google_id]);
    if (!user && email) user = await db.get('SELECT * FROM users WHERE email=?', [email]);
    if (!user) {
      const username = email || `google_${google_id}`;
      const r = await db.run(
        'INSERT INTO users (username,password,full_name,email,google_id,oauth_provider,avatar_url) VALUES (?,?,?,?,?,?,?)',
        [username, '', name || null, email || null, google_id, 'google', picture || null]
      );
      user = await db.get('SELECT * FROM users WHERE id=?', [r.lastID]);
    } else {
      await db.run('UPDATE users SET google_id=?,email=?,oauth_provider=?,avatar_url=? WHERE id=?',
        [google_id, email || user.email || null, 'google', picture || user.avatar_url || null, user.id]);
      user = await db.get('SELECT * FROM users WHERE id=?', [user.id]);
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ status: 'success', user: safeUser, token });
  } catch (err) {
    console.error('Google Backend Error:', err);
    res.status(401).json({ status: 'error', message: 'Xác thực Google thất bại: ' + err.message });
  }
});

app.post('/api/auth/facebook', async (req, res) => {
  const { accessToken, userID } = req.body;
  if (!accessToken || !userID) return res.status(400).json({ status: 'error', message: 'Thiếu token Facebook' });
  try {
    const fbRes = await fetch(`https://graph.facebook.com/${userID}?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
    const fb = await fbRes.json();
    if (fb.error) throw new Error(fb.error.message);
    const { id: facebook_id, name, email } = fb;
    const avatarUrl = fb.picture?.data?.url;
    let user = await db.get('SELECT * FROM users WHERE facebook_id=?', [facebook_id]);
    if (!user && email) user = await db.get('SELECT * FROM users WHERE email=?', [email]);
    if (!user) {
      const username = email || `fb_${facebook_id}`;
      const r = await db.run(
        'INSERT INTO users (username,password,full_name,email,facebook_id,oauth_provider,avatar_url) VALUES (?,?,?,?,?,?,?)',
        [username, '', name, email || null, facebook_id, 'facebook', avatarUrl]
      );
      user = await db.get('SELECT * FROM users WHERE id=?', [r.lastID]);
    } else {
      await db.run('UPDATE users SET facebook_id=?,email=?,oauth_provider=?,avatar_url=? WHERE id=?',
        [facebook_id, email || user.email, 'facebook', avatarUrl || user.avatar_url, user.id]);
      user = await db.get('SELECT * FROM users WHERE id=?', [user.id]);
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ status: 'success', user: safeUser, token });
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Xác thực Facebook thất bại: ' + err.message });
  }
});

// ============================================================
// TRAVEL SUGGESTIONS API (DISTANCE BASED)
// ============================================================

const DESTINATIONS = [
  { id: 1, name: 'Hội An', location: 'Quảng Nam', lat: 15.8801, lon: 108.3380, tag: 'Văn Hoá', best_month_start: 2, best_month_end: 4, image_url: 'https://hoiancreativecity.com/uploads/images/thang%202-2023/hoi-an-gd659f3b8f_1920-1280x853.jpg' },
  { id: 2, name: 'Bà Nà Hills', location: 'Đà Nẵng', lat: 15.9972, lon: 107.9880, tag: 'Check-in', best_month_start: 3, best_month_end: 8, image_url: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800' },
  { id: 3, name: 'Mỹ Sơn', location: 'Quảng Nam', lat: 15.7645, lon: 108.1219, tag: 'Lịch Sử', best_month_start: 2, best_month_end: 5, image_url: 'https://ik.imagekit.io/tvlk/blog/2023/09/thanh-dia-my-son-32.jpg?tr=q-70,c-at_max,w-800,h-600' },
  { id: 4, name: 'Sapa', location: 'Lào Cai', lat: 22.3364, lon: 103.8438, tag: 'Khám Phá', best_month_start: 9, best_month_end: 11, image_url: 'https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png' },
  { id: 5, name: 'Vịnh Hạ Long', location: 'Quảng Ninh', lat: 20.8449, lon: 107.1362, tag: 'Biển Đảo', best_month_start: 9, best_month_end: 11, image_url: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop' },
  { id: 6, name: 'Tràng An', location: 'Ninh Bình', lat: 20.2520, lon: 105.9080, tag: 'Thiên Nhiên', best_month_start: 1, best_month_end: 3, image_url: 'https://images.vietnamtourism.gov.vn/vn/images/2021/trang_an.jpg' },
  { id: 7, name: 'Phú Quốc', location: 'Kiên Giang', lat: 10.2899, lon: 103.9840, tag: 'Nghỉ Dưỡng', best_month_start: 11, best_month_end: 4, image_url: 'https://mtcs.1cdn.vn/2023/03/23/quan-dao-an-thoi-phu-quoc.jpg' },
  { id: 8, name: 'Đà Lạt', location: 'Lâm Đồng', lat: 11.9404, lon: 108.4583, tag: 'Chữa Lành', best_month_start: 11, best_month_end: 3, image_url: 'https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg' },
  { id: 9, name: 'Cố đô Huế', location: 'Thừa Thiên Huế', lat: 16.4637, lon: 107.5909, tag: 'Di Sản', best_month_start: 2, best_month_end: 4, image_url: 'https://kinhtevadubao.vn/stores/news_dataimages/kinhtevadubaovn/092018/18/14/1537170510-news-1243820210326195207.3736490.jpg' },
  { id: 10, name: 'Tà Xùa', location: 'Hà Giang', lat: 22.8233, lon: 104.9836, tag: 'Phượt', best_month_start: 9, best_month_end: 11, image_url: 'https://datviettour.com.vn/uploads/images/mien-bac/ha-giang/hinh-danh-thang/cot-co-lung-cu.jpg' },
  { id: 11, name: 'Mũi Né', location: 'Bình Thuận', lat: 10.9329, lon: 108.2882, tag: 'Biển Cát', best_month_start: 12, best_month_end: 4, image_url: 'https://lalago.vn/wp-content/uploads/2025/05/image7-5.jpg' },
  { id: 12, name: 'Cát Bà', location: 'Hải Phòng', lat: 20.7259, lon: 106.9934, tag: 'Biển Đảo', best_month_start: 4, best_month_end: 8, image_url: 'https://pystravel.vn/_next/image?url=https%3A%2F%2Fbooking.pystravel.vn%2Fuploads%2Fposts%2Falbums%2F6274%2Fe073a7e3cd255785f32421c891f3c02f.jpg&w=1920&q=75' },
  { id: 13, name: 'Phong Nha - Kẻ Bàng', location: 'Quảng Bình', lat: 17.5815, lon: 106.2829, tag: 'Hang Động', best_month_start: 3, best_month_end: 8, image_url: 'https://ecotour.com.vn/wp-content/uploads/2025/05/du-lich-dong-phong-nha-ke-bang-quang-binh.jpeg' },
  { id: 14, name: 'Gành Đá Đĩa', location: 'Phú Yên', lat: 13.3444, lon: 109.2994, tag: 'Kỳ Quan', best_month_start: 3, best_month_end: 8, image_url: 'https://statics.vinpearl.com/ganh-da-dia-phu-yen_1751078702.jpg' },
  { id: 15, name: 'Cù Lao Chàm', location: 'Quảng Nam', lat: 15.9614, lon: 108.5134, tag: 'Biển Đảo', best_month_start: 3, best_month_end: 8, image_url: 'https://drt.danang.vn/content/images/2024/06/cu-lao-cham-o-dau-1.jpg' }
];

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

app.get('/api/travel-suggestions', (req, res) => {
  const { userLat, userLng } = req.query;
  
  if (!userLat || !userLng || userLat === 'undefined' || userLng === 'undefined') {
    return res.status(400).json({ status: 'error', message: 'Thiếu toạ độ người dùng' });
  }

  const uLat = parseFloat(userLat);
  const uLng = parseFloat(userLng);

  let results = DESTINATIONS.map(dest => {
    const distance = calculateDistance(uLat, uLng, dest.lat, dest.lon);
    // Estimated travel time in minutes based on average speed of 60km/h
    const travel_time = Math.round((distance / 60) * 60); 
    return { ...dest, distance, travel_time };
  });

  // Sort by closest distance
  results.sort((a, b) => a.distance - b.distance);

  res.json({ status: 'success', data: results });
});

app.use((req, res) => res.status(404).json({ message: 'Route không tồn tại' }));

app.listen(5000, () => console.log('🚀 ExploreVN Backend đang chạy tại http://localhost:5000'));
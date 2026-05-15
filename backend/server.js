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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
// Serve ảnh đã upload
app.use('/uploads', express.static(UPLOAD_DIR));
// Serve frontend build (production)
const DIST_DIR = path.join(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
}

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
      ['Hội An','Văn Hoá','Quảng Nam',15.8801,108.3380,2,4,'Phố cổ kính với đèn lồng lung linh','https://i1-e.pinimg.com/736x/f3/42/23/f34223ed6dfb6b61b306696f08333475.jpg',12400],
      ['Đà Nẵng','Biển Đảo','Đà Nẵng',16.0544,108.2022,3,8,'Thành phố đáng sống nhất Việt Nam','https://luxurytravel.vn/wp-content/uploads/2023/05/Da-Nang-1.jpg',10100],
      ['Hà Nội','Văn Hoá','Hà Nội',21.0285,105.8542,9,11,'Thủ đô ngàn năm văn hiến','https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800',9800],
      ['Phú Quốc','Biển Đảo','Kiên Giang',10.2899,103.9840,11,4,'Đảo ngọc thiên đường nhiệt đới','https://mtcs.1cdn.vn/2023/03/23/quan-dao-an-thoi-phu-quoc.jpg',11200],
      ['Đà Lạt','Thiên Nhiên','Lâm Đồng',11.9465,108.4419,11,3,'Thành phố ngàn hoa và sương mù','https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333',9500],
      ['Hạ Long','Thiên Nhiên','Quảng Ninh',20.9101,107.1839,9,11,'Vịnh kỳ quan thiên nhiên thế giới','https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop',15000],
      ['Huế','Lịch Sử','Thừa Thiên Huế',16.4637,107.5909,2,4,'Cố đô triều Nguyễn, di sản văn hóa','https://kinhtevadubao.vn/stores/news_dataimages/kinhtevadubaovn/092018/18/14/1537170510-news-1243820210326195207.3736490.jpg?randTime=1777256014',7600],
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
      ['Hội An','lichtrinh','Nắng đẹp T2-T4, mưa nhiều T10-T11.','Quần áo mát, mũ nón, kem chống nắng, tiền mặt.','Dạo thuyền sông Hoài, ăn Cao Lầu, thả đèn hoa đăng.','https://hoiancreativecity.com/uploads/images/thang%202-2023/hoi-an-gd659f3b8f_1920-1280x853.jpg','6 phút'],
      ['Đà Lạt','tietkiem','Mát mẻ quanh năm, 15-22°C, đêm lạnh.','Áo khoác, giày đế bằng, máy ảnh.','Vườn hoa, hồ Tuyền Lâm, Datanla, cà phê đặc sản.','https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333','5 phút'],
      ['Phú Quốc','antoàn','Mùa khô T11-T4 lý tưởng, T5-T10 sóng to.','Kem chống nắng SPF 50+, áo phao khi đi thuyền.','Lặn ngắm san hô, chợ đêm Dinh Cậu, rượu sim Phú Quốc.','https://mtcs.1cdn.vn/2023/03/23/quan-dao-an-thoi-phu-quoc.jpg','7 phút'],
      ['Hạ Long','lichtrinh','Mùa hè T4-T8 đẹp nhất, T11-T3 lạnh và sương mù.','Áo mưa, giày đế bằng chống trơn, thuốc say sóng.','Du thuyền ngủ đêm, chèo kayak, khám phá hang động.','https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop','6 phút'],
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
      ['Khai Trương Tuyến Xe Điện Du Lịch Quanh Bờ Hồ Hoàn Kiếm','Tuyến xe điện mới giúp du khách dễ dàng tham quan các di tích lịch sử quanh hồ.','sukien','2026-05-07','https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=800','2 phút',0],
      ['Sapa Đón Lượng Khách Kỷ Lục Dịp Nghỉ Lễ 30/4','Hơn 100.000 lượt khách đã đến với thị trấn mờ sương trong 4 ngày nghỉ lễ.','diem-den','2026-05-06','https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png','3 phút',0],
      ['Khu Du Lịch Phong Nha 5 Sao Đầu Tiên Chính Thức Mở Cửa','Resort nghỉ dưỡng cao cấp nằm ngay cạnh di sản UNESCO Phong Nha – Kẻ Bàng.','diem-den','2026-05-05','https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?q=80&w=800','https://i.pinimg.com/736x/8e/34/1f/8e341f467483e623f689803cd4eade33.jpg',0],
      ['Bamboo Airways Giảm 40% Vé Nội Địa Dịp Hè 2026','500.000 vé giá rẻ trên toàn bộ đường bay nội địa, đặt trước đến 31/5.','hangkhong','2026-05-04','https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?q=80&w=800','2 phút',0],
      ['Festival Huế 2026: 15 Đêm Văn Hoá Đặc Sắc','Chương trình nghệ thuật ánh sáng và lễ rước đèn lớn nhất lịch sử phố cổ.','sukien','2026-05-03','https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=800','https://i1-e.pinimg.com/736x/f3/42/23/f34223ed6dfb6b61b306696f08333475.jpg',0],
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
    const avatarUrl = `/uploads/${req.file.filename}`;
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
    const coverUrl = `/uploads/${req.file.filename}`;
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
    const imageUrl = `/uploads/${req.file.filename}`;
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

  if (!userLat || !userLng || userLat === 'undefined' || userLng === 'undefined') {
    return res.status(400).json({ status: 'error', message: 'Thiếu toạ độ người dùng' });
  }

  const lat = parseFloat(userLat);
  const lng = parseFloat(userLng);
  const month = parseInt(currentMonth) || new Date().getMonth() + 1;

  try {
    // 1. Lấy dữ liệu từ DB (locations đã seed)
    const dbLocations = await db.all('SELECT * FROM locations');
    const dbResults = dbLocations.map(loc => ({
      id: loc.id,
      name: loc.name,
      location: loc.location,
      lat: loc.latitude,
      lon: loc.longitude,
      tag: loc.tag,
      best_month_start: loc.best_month_start,
      best_month_end: loc.best_month_end,
      image_url: loc.image_url,
      distance: Math.round(calcDist(lat, lng, loc.latitude, loc.longitude)),
      travel_time: Math.round((calcDist(lat, lng, loc.latitude, loc.longitude) / 60) * 60),
      source: 'db'
    }));

    // 2. Lấy từ mảng DESTINATIONS tĩnh, loại trùng tên với DB
    const dbNames = new Set(dbResults.map(r => r.name.toLowerCase()));
    const staticResults = DESTINATIONS
      .filter(dest => !dbNames.has(dest.name.toLowerCase()))
      .map(dest => {
        const distance = calculateDistance(lat, lng, dest.lat, dest.lon);
        return {
          ...dest,
          distance,
          travel_time: Math.round((distance / 60) * 60),
          source: 'static'
        };
      });

    // 3. Gộp, ưu tiên tháng đẹp, sau đó sắp xếp theo khoảng cách
    const combined = [...dbResults, ...staticResults].map(item => ({
      ...item,
      isBestMonth: (
        item.best_month_start <= item.best_month_end
          ? (month >= item.best_month_start && month <= item.best_month_end)
          : (month >= item.best_month_start || month <= item.best_month_end)
      ) ? 1 : 0
    }));

    combined.sort((a, b) => b.isBestMonth - a.isBestMonth || a.distance - b.distance);

    // 4. Lọc khoảng cách < 350km (Mặc định cho mọi tìm kiếm có tọa độ)
    const finalResults = combined.filter(item => item.distance < 350);

    res.json({ status: 'success', data: finalResults });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
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

const axios = require('axios');
const cheerio = require('cheerio');

app.get('/api/guides/vnexpress', async (req, res) => {
  try {
    const response = await axios.get('https://vnexpress.net/du-lich/cam-nang', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const guideItems = [];
    const seenTitles = new Set();

    $('article.item-news').each((i, el) => {
      if (guideItems.length >= 15) return;
      
      let title = $(el).find('.title-news h3').text().trim() || $(el).find('h3.title-news a').text().trim() || $(el).find('.title-news').text().trim();
      let link = $(el).find('a').attr('href');
      let excerpt = $(el).find('p.description').text().trim() || 'Khám phá chi tiết cẩm nang du lịch, những trải nghiệm chân thực và mẹo vặt hữu ích từ cộng đồng đam mê xê dịch.';
      let image = $(el).find('picture img').attr('src') || $(el).find('div.thumb-art img').attr('data-src') || $(el).find('div.thumb-art img').attr('src') || $(el).find('img').attr('src');
      let categoryLabel = $(el).find('span.location-stamp').text().trim() || 'Cẩm nang';

      if (title && link && !seenTitles.has(title)) {
        seenTitles.add(title);
        guideItems.push({
          id: `vn-guide-${guideItems.length}`,
          title,
          link,
          excerpt,
          image_url: image || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800',
          category: categoryLabel,
          read_time: '5 phút'
        });
      }
    });

    res.json(guideItems);
  } catch (err) {
    console.error('VnExpress Guide Scrape Error:', err);
    res.status(500).json({ status: 'error', message: 'Không thể tải cẩm nang từ VnExpress' });
  }
});

app.get('/api/news/vnexpress', async (req, res) => {
  const { category } = req.query;
  let url = 'https://vnexpress.net/du-lich';
  
  if (category === 'am-thuc') url = 'https://vnexpress.net/du-lich/am-thuc';
  else if (category === 'diem-den') url = 'https://vnexpress.net/du-lich/diem-den/trong-nuoc';
  else if (category === 'tu-van') url = 'https://vnexpress.net/du-lich/tu-van';

  try {
    // 1. Lấy tin tức từ Database trước (Tin tức trong nước đã seed)
    let dbNews = [];
    try {
      let q = 'SELECT * FROM news WHERE 1=1';
      const params = [];
      if (category && category !== 'all') { q += ' AND category=?'; params.push(category); }
      q += ' ORDER BY published_at DESC LIMIT 10';
      dbNews = await db.all(q, params);
    } catch (dbErr) {
      console.error('DB News Fetch Error:', dbErr);
    }

    // 2. Scrape từ VnExpress
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const newsItems = [];
    const seenTitles = new Set();
    
    // Keywords to exclude international news (Very Aggressive)
    const internationalKeywords = [
      'nhật bản', 'hàn quốc', 'trung quốc', 'thái lan', 'singapore', 'mỹ', 'châu âu', 'bali', 'tokyo', 'seoul', 'bangkok', 
      'nước ngoài', 'quốc tế', 'visa', 'hộ chiếu', 'pháp', 'đức', 'anh', 'nga', 'úc', 'australia', 'campuchia', 'lào', 
      'malaysia', 'indonesia', 'philippines', 'đài loan', 'hong kong', 'châu á', 'thế giới', 'toàn cầu', 'ngoại quốc', 
      'milan', 'everest', 'nepal', 'world cup', 'côn minh', 'argentina', 'hantavirus', 'ý', 'italia', 'tây ban nha', 
      'bồ đào nha', 'ấn độ', 'thụy sĩ', 'thụy điển', 'na uy', 'đan mạch', 'phần lan', 'brazil', 'mexico', 'canada', 'peru', 'bolivia', '?n d?', '?n d?', 'india'
    ];

    $('article.item-news').each((i, el) => {
      if (newsItems.length >= 25) return;
      
      const title = $(el).find('h3.title-news a').text().trim();
      const link = $(el).find('h3.title-news a').attr('href');
      const excerpt = $(el).find('p.description').text().trim();
      let image = $(el).find('div.thumb-art img').attr('data-src') || $(el).find('div.thumb-art img').attr('src');
      const categoryLabel = $(el).find('span.location-stamp').text().trim() || 'Trong nước';
      
      // Strict Domestic check
      const isInternational = internationalKeywords.some(kw => 
        title.toLowerCase().includes(kw) || 
        excerpt.toLowerCase().includes(kw) || 
        categoryLabel.toLowerCase().includes(kw)
      );

      // If categoryLabel is "Châu Á", "Châu Âu", "Châu Mỹ", etc. it's international
      const isExplicitlyInternational = ['châu á', 'châu âu', 'châu mỹ', 'châu úc', 'nước ngoài', 'quốc tế'].includes(categoryLabel.toLowerCase());

      if (title && link && !seenTitles.has(title) && !isInternational && !isExplicitlyInternational) {
        seenTitles.add(title);
        newsItems.push({
          id: `vn-${newsItems.length}`,
          title,
          link,
          excerpt,
          image_url: image || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800',
          time_ago: 'Vừa xong',
          category: categoryLabel,
          read_time: '3 phút'
        });
      }
    });

    // 3. Gộp Database News và Scraped News
    const formattedDbNews = dbNews.map(n => ({
      id: `db-${n.id}`,
      title: n.title,
      link: '#', 
      excerpt: n.description,
      image_url: n.image_url,
      time_ago: n.published_at,
      category: n.category === 'sukien' ? 'Sự kiện' : (n.category === 'diem-den' ? 'Điểm đến' : 'Tin tức'),
      read_time: n.read_time
    }));

    res.json([...formattedDbNews, ...newsItems]);
  } catch (err) {
    console.error('VnExpress Scrape Error:', err);
    res.status(500).json({ status: 'error', message: 'Không thể tải tin tức từ VnExpress' });
  }
});

// ============================================================
// POSTS APIs
// ============================================================

app.get('/api/posts', async (req, res) => {
  const current_user_id = req.query.user_id;
  try {
    const posts = await db.all(`
      SELECT p.*, u.full_name as user_name, u.avatar_url,
      (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count
      ${current_user_id ? `, (SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ${current_user_id}) as has_liked` : ''}
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

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ status: 'error', message: 'Thiếu user_id' });
  try {
    const post = await db.get('SELECT user_id FROM posts WHERE id=?', [req.params.id]);
    if (!post) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    if (post.user_id != user_id) return res.status(403).json({ status: 'error', message: 'Không có quyền xóa bài viết này' });

    await db.run('DELETE FROM post_likes WHERE post_id=?', [req.params.id]);
    await db.run('DELETE FROM saved_posts WHERE post_id=?', [req.params.id]);
    await db.run('DELETE FROM comments WHERE post_id=?', [req.params.id]);
    await db.run('DELETE FROM posts WHERE id=?', [req.params.id]);

    res.json({ status: 'success', message: 'Đã xóa bài viết' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
  const { user_id, content, location, image_url } = req.body;
  if (!user_id) return res.status(400).json({ status: 'error', message: 'Thiếu user_id' });
  try {
    const post = await db.get('SELECT user_id FROM posts WHERE id=?', [req.params.id]);
    if (!post) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    if (post.user_id != user_id) return res.status(403).json({ status: 'error', message: 'Không có quyền chỉnh sửa bài viết này' });

    await db.run('UPDATE posts SET content=?, location=?, image_url=? WHERE id=?', 
      [content || '', location || null, image_url || null, req.params.id]);

    const updatedPost = await db.get(`SELECT p.*,u.full_name as user_name,u.avatar_url FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id=?`, [req.params.id]);
    res.json({ status: 'success', data: updatedPost });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});


// Delete post
app.delete('/api/posts/:id', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ status: 'error', message: 'Thiếu user_id' });
  try {
    const post = await db.get('SELECT user_id FROM posts WHERE id=?', [req.params.id]);
    if (!post) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    if (post.user_id != user_id) return res.status(403).json({ status: 'error', message: 'Không có quyền xóa bài viết này' });

    await db.run('DELETE FROM post_likes WHERE post_id=?', [req.params.id]);
    await db.run('DELETE FROM saved_posts WHERE post_id=?', [req.params.id]);
    await db.run('DELETE FROM comments WHERE post_id=?', [req.params.id]);
    await db.run('DELETE FROM posts WHERE id=?', [req.params.id]);

    res.json({ status: 'success', message: 'Đã xóa bài viết' });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
});

// Update post
app.put('/api/posts/:id', async (req, res) => {
  const { user_id, content, location, image_url } = req.body;
  if (!user_id) return res.status(400).json({ status: 'error', message: 'Thiếu user_id' });
  try {
    const post = await db.get('SELECT user_id FROM posts WHERE id=?', [req.params.id]);
    if (!post) return res.status(404).json({ status: 'error', message: 'Không tìm thấy bài viết' });
    if (post.user_id != user_id) return res.status(403).json({ status: 'error', message: 'Không có quyền chỉnh sửa bài viết này' });

    await db.run('UPDATE posts SET content=?, location=?, image_url=? WHERE id=?', 
      [content || '', location || null, image_url || null, req.params.id]);

    const updatedPost = await db.get(`SELECT p.*,u.full_name as user_name,u.avatar_url FROM posts p JOIN users u ON p.user_id=u.id WHERE p.id=?`, [req.params.id]);
    res.json({ status: 'success', data: updatedPost });
  } catch (err) { res.status(500).json({ status: 'error', message: err.message }); }
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
    let facebook_id, name, email, avatarUrl;

    // Xử lý Chế độ Demo từ Frontend
    if (userID.endsWith('_demo')) {
      facebook_id = userID;
      name = 'Người dùng Demo (Facebook)';
      email = 'demo_fb@wanderly.vn';
      avatarUrl = 'https://i.pravatar.cc/150?img=12';
    } else {
      const fbRes = await fetch(`https://graph.facebook.com/${userID}?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
      const fb = await fbRes.json();
      if (fb.error) throw new Error(fb.error.message);
      facebook_id = fb.id;
      name = fb.name;
      email = fb.email;
      avatarUrl = fb.picture?.data?.url;
    }
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
  {
    id: 1,
    name: "Hội An",
    location: "Quảng Nam",
    lat: 15.8801,
    lon: 108.338,
    tag: "Văn Hoá",
    best_month_start: 2,
    best_month_end: 4,
    image_url: "https://hoiancreativecity.com/uploads/images/thang%202-2023/hoi-an-gd659f3b8f_1920-1280x853.jpg"
  },
  {
    id: 2,
    name: "Bà Nà Hills",
    location: "Đà Nẵng",
    lat: 15.9972,
    lon: 107.988,
    tag: "Check-in",
    best_month_start: 2,
    best_month_end: 4,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/2/28/Panoramic_View.jpg"
  },
  {
    id: 3,
    name: "Mỹ Sơn",
    location: "Quảng Nam",
    lat: 15.7645,
    lon: 108.1219,
    tag: "Lịch Sử",
    best_month_start: 2,
    best_month_end: 4,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/09/thanh-dia-my-son-32.jpg?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 4,
    name: "Sapa",
    location: "Lào Cai",
    lat: 22.3364,
    lon: 103.8438,
    tag: "Khám Phá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://media.vietravel.com/images/Content/dia-diem-du-lich-sapa-1.png"
  },
  {
    id: 5,
    name: "Vịnh Hạ Long",
    location: "Quảng Ninh",
    lat: 20.8449,
    lon: 107.1362,
    tag: "Biển Đảo",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 6,
    name: "Tràng An",
    location: "Ninh Bình",
    lat: 20.252,
    lon: 105.908,
    tag: "Thiên Nhiên",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://images.vietnamtourism.gov.vn/vn/images/2021/trang_an.jpg"
  },
  {
    id: 7,
    name: "Phú Quốc",
    location: "Kiên Giang",
    lat: 10.2899,
    lon: 103.984,
    tag: "Nghỉ Dưỡng",
    best_month_start: 11,
    best_month_end: 4,
    image_url: "https://mtcs.1cdn.vn/2023/03/23/quan-dao-an-thoi-phu-quoc.jpg"
  },
  {
    id: 8,
    name: "Đà Lạt",
    location: "Lâm Đồng",
    lat: 11.9404,
    lon: 108.4583,
    tag: "Chữa Lành",
    best_month_start: 11,
    best_month_end: 3,
    image_url: "https://bizweb.dktcdn.net/thumb/1024x1024/100/093/257/products/thung-lung-ngan-hoa.jpg?v=1731570795333"
  },
  {
    id: 9,
    name: "Cố đô Huế",
    location: "Thừa Thiên Huế",
    lat: 16.4637,
    lon: 107.5909,
    tag: "Di Sản",
    best_month_start: 2,
    best_month_end: 4,
    image_url: "https://kinhtevadubao.vn/stores/news_dataimages/kinhtevadubaovn/092018/18/14/1537170510-news-1243820210326195207.3736490.jpg?randTime=1777256014"
  },
  {
    id: 10,
    name: "Tà Xùa",
    location: "Hà Giang",
    lat: 22.8233,
    lon: 104.9836,
    tag: "Phượt",
    best_month_start: 9,
    best_month_end: 11,
    image_url: "https://datviettour.com.vn/uploads/images/mien-bac/ha-giang/hinh-danh-thang/cot-co-lung-cu.jpg"
  },
  {
    id: 11,
    name: "Mũi Né",
    location: "Bình Thuận",
    lat: 10.9329,
    lon: 108.2882,
    tag: "Biển Cát",
    best_month_start: 12,
    best_month_end: 2,
    image_url: "https://lalago.vn/wp-content/uploads/2025/05/image7-5.jpg"
  },
  {
    id: 12,
    name: "Cát Bà",
    location: "Hải Phòng",
    lat: 20.7259,
    lon: 106.9934,
    tag: "Biển Đảo",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://pystravel.vn/_next/image?url=https%3A%2F%2Fbooking.pystravel.vn%2Fuploads%2Fposts%2Falbums%2F6274%2Fe073a7e3cd255785f32421c891f3c02f.jpg&w=1920&q=75"
  },
  {
    id: 13,
    name: "Phong Nha - Kẻ Bàng",
    location: "Quảng Bình",
    lat: 17.5815,
    lon: 106.2829,
    tag: "Hang Động",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://ecotour.com.vn/wp-content/uploads/2025/05/du-lich-dong-phong-nha-ke-bang-quang-binh.jpeg"
  },
  {
    id: 14,
    name: "Gành Đá Đĩa",
    location: "Phú Yên",
    lat: 13.3444,
    lon: 109.2994,
    tag: "Kỳ Quan",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://statics.vinpearl.com/ganh-da-dia-phu-yen_1751078702.jpg"
  },
  {
    id: 15,
    name: "Cù Lao Chàm",
    location: "Quảng Nam",
    lat: 15.9614,
    lon: 108.5134,
    tag: "Biển Đảo",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://drt.danang.vn/content/images/2024/06/cu-lao-cham-o-dau-1.jpg"
  },
  {
    id: 16,
    name: "Nhà thờ Đức Bà",
    location: "TP.HCM",
    lat: 10.8231,
    lon: 106.6297,
    tag: "Kiến Trúc",
    best_month_start: 12,
    best_month_end: 4,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/01/nha-tho-duc-ba-1.jpg?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 17,
    name: "Chợ Bến Thành",
    location: "TP.HCM",
    lat: 10.8231,
    lon: 106.6297,
    tag: "Văn Hoá",
    best_month_start: 12,
    best_month_end: 4,
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRxVaCEI0E5YHHJUCmhFtoAODeGb6OomDtRtw&s"
  },
  {
    id: 18,
    name: "Landmark 81",
    location: "TP.HCM",
    lat: 10.8231,
    lon: 106.6297,
    tag: "Check-in",
    best_month_start: 12,
    best_month_end: 4,
    image_url: "https://ik.imagekit.io/tvlk/blog/2024/01/landmark-81-cover.jpg"
  },
  {
    id: 19,
    name: "Phố đi bộ Nguyễn Huệ",
    location: "TP.HCM",
    lat: 10.8231,
    lon: 106.6297,
    tag: "Check-in",
    best_month_start: 12,
    best_month_end: 4,
    image_url: "https://www.themystdongkhoihotel.com/wp-content/uploads/2025/07/nguyen-hue-walking-street.jpg"
  },
  {
    id: 20,
    name: "Chợ nổi Cái Răng",
    location: "Cần Thơ",
    lat: 10.0452,
    lon: 105.7469,
    tag: "Văn Hoá",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://phetravel.com/thumbnails/products/large/uploads/cho-noi-cai-rang-10-1.jpg.webp"
  },
  {
    id: 21,
    name: "Bến Ninh Kiều",
    location: "Cần Thơ",
    lat: 10.0452,
    lon: 105.7469,
    tag: "Tham Quan",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/7/70/Ninhkieuquay.jpg"
  },
  {
    id: 22,
    name: "Nhà cổ Bình Thủy",
    location: "Cần Thơ",
    lat: 10.0452,
    lon: 105.7469,
    tag: "Lịch Sử",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://media.gody.vn/images/can-tho/nha-co-binh-thuy/4-2017/20170420091911-nha-co-binh-thuy-gody(1).jpg"
  },
  {
    id: 23,
    name: "Miếu Bà Chúa Xứ",
    location: "An Giang",
    lat: 10.5367,
    lon: 105.1093,
    tag: "Tâm Linh",
    best_month_start: 9,
    best_month_end: 11,
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQC-B063nVkPEXKVZWpxpXpQ4jXaN76-uXNLw&s"
  },
  {
    id: 24,
    name: "Rừng tràm Trà Sư",
    location: "An Giang",
    lat: 10.5367,
    lon: 105.1093,
    tag: "Thiên Nhiên",
    best_month_start: 9,
    best_month_end: 11,
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR76z9rv6sMhGBL18WL3XlzRC1M_KH1k7Ae8Q&s"
  },
  {
    id: 25,
    name: "Núi Cấm",
    location: "An Giang",
    lat: 10.5367,
    lon: 105.1093,
    tag: "Thiên Nhiên",
    best_month_start: 9,
    best_month_end: 11,
    image_url: "https://image.vietgoing.com/article/large/cam-nang-du-lich-nui-cam-an-giang-tu-a-den-z-moi-nhat-2021.jpg"
  },
  {
    id: 26,
    name: "Cù lao Thới Sơn",
    location: "Tiền Giang",
    lat: 10.4287,
    lon: 106.3533,
    tag: "Tham Quan",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://motogo.vn/wp-content/uploads/2020/02/319-NguyenMinh-du-lich-song-nuoc-Thoi-Son-Tien-Giang1-20.jpg"
  },
  {
    id: 27,
    name: "Chùa Vĩnh Tràng",
    location: "Tiền Giang",
    lat: 10.4287,
    lon: 106.3533,
    tag: "Tâm Linh",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://images.vietnamtourism.gov.vn/vn/images/2015/chuavinhtrang.jpg"
  },
  {
    id: 28,
    name: "Làng nổi Tân Lập",
    location: "Long An",
    lat: 10.6868,
    lon: 106.1843,
    tag: "Thiên Nhiên",
    best_month_start: 12,
    best_month_end: 4,
    image_url: "https://saobientourist.com.vn/wp-content/uploads/2024/09/Khu-du-lich-sinh-thai-Lang-Noi-Tan-Lap-o-Long-An.jpg.webp"
  },
  {
    id: 29,
    name: "Nhà công tử Bạc Liêu",
    location: "Bạc Liêu",
    lat: 9.2941,
    lon: 105.7278,
    tag: "Lịch Sử",
    best_month_start: 12,
    best_month_end: 4,
    image_url: "https://thamhiemmekong.com/wp-content/uploads/2020/04/nhacongtubaclieu-01-1.jpg"
  },
  {
    id: 30,
    name: "Cánh đồng điện gió",
    location: "Bạc Liêu",
    lat: 9.2941,
    lon: 105.7278,
    tag: "Check-in",
    best_month_start: 12,
    best_month_end: 4,
    image_url: "https://mtcs.1cdn.vn/2022/09/19/canh-dong-dien-gio-dam-nai-tinh-ninh-thuan.jpg"
  },
  {
    id: 31,
    name: "Bán đảo Sơn Trà",
    location: "Đà Nẵng",
    lat: 16.0544,
    lon: 108.2022,
    tag: "Thiên Nhiên",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://pystravel.vn/_next/image?url=https%3A%2F%2Fbooking.pystravel.vn%2Fuploads%2Fposts%2Falbums%2F17553%2F0e982b5225f47a4a015c0dbc35269a87.png&w=1920&q=75"
  },
  {
    id: 32,
    name: "Bãi biển Mỹ Khê",
    location: "Đà Nẵng",
    lat: 16.0544,
    lon: 108.2022,
    tag: "Biển Cát",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/09/bien-my-khe-18.jpg?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 33,
    name: "Eo Gió",
    location: "Quy Nhơn",
    lat: 13.7751,
    lon: 109.223,
    tag: "Biển Cát",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://hatahotel.vn/wp-content/uploads/2022/12/eo-gio-1024x768-1.jpg"
  },
  {
    id: 34,
    name: "Kỳ Co",
    location: "Quy Nhơn",
    lat: 13.7751,
    lon: 109.223,
    tag: "Biển Cát",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://ik.imagekit.io/tvlk/blog/2024/02/ky-co-cover.jpg"
  },
  {
    id: 35,
    name: "Bãi Xép",
    location: "Phú Yên",
    lat: 13.0883,
    lon: 109.309,
    tag: "Biển Cát",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Mui_Dai_Lanh_PhuYen.jpg/960px-Mui_Dai_Lanh_PhuYen.jpg"
  },
  {
    id: 36,
    name: "Vịnh Nha Trang",
    location: "Nha Trang",
    lat: 12.2388,
    lon: 109.1967,
    tag: "Biển Đảo",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://cdn1.nhatrangtoday.vn/images/photos/Vinh-Nha-Trang-14.jpg"
  },
  {
    id: 37,
    name: "Tháp Bà Ponagar",
    location: "Nha Trang",
    lat: 12.2388,
    lon: 109.1967,
    tag: "Lịch Sử",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://mocban.vn/wp-content/uploads/2024/05/thap-ba-ponagar-3.jpg"
  },
  {
    id: 38,
    name: "Hang Rái",
    location: "Ninh Thuận",
    lat: 11.6033,
    lon: 108.995,
    tag: "Thiên Nhiên",
    best_month_start: 12,
    best_month_end: 2,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/10/hang-rai-10.jpg?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 39,
    name: "Vườn Nho Thái An",
    location: "Ninh Thuận",
    lat: 11.6033,
    lon: 108.995,
    tag: "Trải Nghiệm",
    best_month_start: 12,
    best_month_end: 2,
    image_url: "https://ik.imagekit.io/tvlk/blog/2024/11/vuon-nho-thai-an-2-1-1024x614.webp?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 40,
    name: "Bàu Trắng",
    location: "Bình Thuận",
    lat: 11.0875,
    lon: 108.0693,
    tag: "Thiên Nhiên",
    best_month_start: 12,
    best_month_end: 2,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/02/khu-du-lich-bao-trang-1.jpg?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 41,
    name: "Đảo Phú Quý",
    location: "Bình Thuận",
    lat: 11.0875,
    lon: 108.0693,
    tag: "Biển Đảo",
    best_month_start: 12,
    best_month_end: 2,
    image_url: "https://cdn3.ivivu.com/2023/12/du-lich-dao-phu-quy-ivivu.jpg"
  },
  {
    id: 42,
    name: "Biển Sầm Sơn",
    location: "Thanh Hóa",
    lat: 19.8067,
    lon: 105.7764,
    tag: "Biển Cát",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://i1-e.pinimg.com/1200x/9a/89/df/9a89df0831d59e821d219301541c7da5.jpg"
  },
  {
    id: 43,
    name: "Thành Nhà Hồ",
    location: "Thanh Hóa",
    lat: 19.8067,
    lon: 105.7764,
    tag: "Lịch Sử",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://i1-e.pinimg.com/736x/e6/4c/7f/e64c7f48195219758a83287dfb84c38e.jpg"
  },
  {
    id: 44,
    name: "Làng Sen quê Bác",
    location: "Nghệ An",
    lat: 19.34,
    lon: 104.869,
    tag: "Lịch Sử",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/06/lang-sen-que-bac-acc-1.png"
  },
  {
    id: 45,
    name: "Biển Cửa Lò",
    location: "Nghệ An",
    lat: 19.34,
    lon: 104.869,
    tag: "Biển Cát",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Cualovedem.jpg/960px-Cualovedem.jpg"
  },
  {
    id: 46,
    name: "Chùa Hương Tích",
    location: "Hà Tĩnh",
    lat: 18.3364,
    lon: 105.9042,
    tag: "Tâm Linh",
    best_month_start: 11,
    best_month_end: 12,
    image_url: "https://i1-e.pinimg.com/736x/d4/e2/95/d4e295d2d78288723df71030139963d9.jpg"
  },
  {
    id: 47,
    name: "Biển Thiên Cầm",
    location: "Hà Tĩnh",
    lat: 18.3364,
    lon: 105.9042,
    tag: "Biển Cát",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://i1-e.pinimg.com/1200x/c4/fa/48/c4fa482a0fa3e36ef7ceccf37daf1ebc.jpg"
  },
  {
    id: 48,
    name: "Hang Sơn Đoòng",
    location: "Quảng Bình",
    lat: 17.4833,
    lon: 106.5997,
    tag: "Khám Phá",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Son_Doong_Cave_by_Daniel_Burka.jpg/960px-Son_Doong_Cave_by_Daniel_Burka.jpg"
  },
  {
    id: 49,
    name: "Thành cổ Quảng Trị",
    location: "Quảng Trị",
    lat: 16.7505,
    lon: 107.1904,
    tag: "Lịch Sử",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://i1-e.pinimg.com/1200x/32/6d/0b/326d0bdfd4eee5a756d67dbff4dd2600.jpg"
  },
  {
    id: 50,
    name: "Cầu Hiền Lương – sông Bến Hải",
    location: "Quảng Trị",
    lat: 16.7505,
    lon: 107.1904,
    tag: "Lịch Sử",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://i1-e.pinimg.com/736x/4f/f4/78/4ff478ce9a49949fb4d46c8178560b0b.jpg"
  },
  {
    id: 51,
    name: "Đại Nội Huế",
    location: "Thừa Thiên Huế",
    lat: 16.4637,
    lon: 107.5909,
    tag: "Lịch Sử",
    best_month_start: 2,
    best_month_end: 4,
    image_url: "https://i1-e.pinimg.com/736x/dd/cf/68/ddcf68cc32658ee90b52a566287c44a7.jpg"
  },
  {
    id: 52,
    name: "Chùa Thiên Mụ",
    location: "Thừa Thiên Huế",
    lat: 16.4637,
    lon: 107.5909,
    tag: "Tâm Linh",
    best_month_start: 2,
    best_month_end: 4,
    image_url: "https://i1-e.pinimg.com/1200x/5e/e2/0f/5ee20fefc0cf88e2f07ddb3957f0c82a.jpg"
  },
  {
    id: 53,
    name: "Sông Hương",
    location: "Thừa Thiên Huế",
    lat: 16.4637,
    lon: 107.5909,
    tag: "Thiên Nhiên",
    best_month_start: 2,
    best_month_end: 4,
    image_url: "https://i1-e.pinimg.com/736x/72/a9/92/72a9926184fbde476d906c063318a174.jpg"
  },
  {
    id: 54,
    name: "Cô Tô",
    location: "Quảng Ninh",
    lat: 21.0065,
    lon: 107.2925,
    tag: "Biển Đảo",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/1/16/%C3%82u_c%E1%BA%A3ng.jpg"
  },
  {
    id: 55,
    name: "Yên Tử",
    location: "Quảng Ninh",
    lat: 21.0065,
    lon: 107.2925,
    tag: "Tâm Linh",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://cdn.vivutour.vn/2026/2/thap-chuong-tay-yen-tu-3.webp"
  },
  {
    id: 56,
    name: "Đồng Văn",
    location: "Hà Giang",
    lat: 22.8233,
    lon: 104.9836,
    tag: "Khám Phá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://i1-e.pinimg.com/1200x/3c/ab/8c/3cab8c61b8aa5b232084b1d30c8b1f29.jpg"
  },
  {
    id: 57,
    name: "Mã Pí Lèng",
    location: "Hà Giang",
    lat: 22.8233,
    lon: 104.9836,
    tag: "Khám Phá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://i1-e.pinimg.com/1200x/74/8d/2e/748d2ee4c771a02fff08cd57512c26d0.jpg"
  },
  {
    id: 58,
    name: "Lũng Cú",
    location: "Hà Giang",
    lat: 22.8233,
    lon: 104.9836,
    tag: "Khám Phá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://mia.vn/media/uploads/blog-du-lich/lung-cu-1-1747591454.jpg"
  },
  {
    id: 59,
    name: "Fansipan",
    location: "Lào Cai",
    lat: 22.3364,
    lon: 103.8438,
    tag: "Khám Phá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/d/de/C%C3%A1p-treo-fansipan-17.jpg"
  },
  {
    id: 60,
    name: "Cát Cát",
    location: "Lào Cai",
    lat: 22.3364,
    lon: 103.8438,
    tag: "Văn Hoá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://sun-ecommerce-cdn.azureedge.net/ecommerce/service-sites/asset/SunWorldFansipan/swold/ban-cat-cat/1-ban-cat-cat.png"
  },
  {
    id: 61,
    name: "Tam Cốc",
    location: "Ninh Bình",
    lat: 20.252,
    lon: 105.908,
    tag: "Thiên Nhiên",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Muaxuantamcoc.jpg"
  },
  {
    id: 62,
    name: "Hang Múa",
    location: "Ninh Bình",
    lat: 20.252,
    lon: 105.908,
    tag: "Check-in",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tam_Coc_by_Tuan_Mai_%22007%22_%288888350545%29.jpg/960px-Tam_Coc_by_Tuan_Mai_%22007%22_%288888350545%29.jpg"
  },
  {
    id: 63,
    name: "Hồ Gươm",
    location: "Hà Nội",
    lat: 21.0285,
    lon: 105.8542,
    tag: "Văn Hoá",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/09/ho-guom-1.jpg?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 64,
    name: "Phố cổ Hà Nội",
    location: "Hà Nội",
    lat: 21.0285,
    lon: 105.8542,
    tag: "Văn Hoá",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://i1-e.pinimg.com/736x/f3/42/23/f34223ed6dfb6b61b306696f08333475.jpg"
  },
  {
    id: 65,
    name: "Văn Miếu",
    location: "Hà Nội",
    lat: 21.0285,
    lon: 105.8542,
    tag: "Lịch Sử",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/V%C4%83n_mi%E1%BA%BFu_X%C3%ADch_%C4%90%E1%BA%B1ng_02.JPG/330px-V%C4%83n_mi%E1%BA%BFu_X%C3%ADch_%C4%90%E1%BA%B1ng_02.JPG"
  },
  {
    id: 66,
    name: "Lăng Chủ Tịch Hồ Chí Minh",
    location: "Hà Nội",
    lat: 21.0285,
    lon: 105.8542,
    tag: "Lịch Sử",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fd/L%C4%83ng_B%C3%A1c_-_NKS.jpg/960px-L%C4%83ng_B%C3%A1c_-_NKS.jpg"
  },
  {
    id: 67,
    name: "Mộc Châu",
    location: "Sơn La",
    lat: 21.3283,
    lon: 103.9039,
    tag: "Thiên Nhiên",
    best_month_start: 11,
    best_month_end: 3,
    image_url: "https://i1-e.pinimg.com/1200x/64/09/ed/6409ed2aeb6462336d7bce3e6fd71deb.jpg"
  },
  {
    id: 68,
    name: "Đồi chè",
    location: "Sơn La",
    lat: 21.3283,
    lon: 103.9039,
    tag: "Thiên Nhiên",
    best_month_start: 7,
    best_month_end: 8,
    image_url: "https://vcdn1-dulich.vnecdn.net/2022/04/12/102022247-mobile-3988-1649760588.jpg?w=0&h=0&q=100&dpr=2&fit=crop&s=mZ8lSPcvp_RAwc0-rX_5-Q"
  },
  {
    id: 69,
    name: "Thác Dải Yếm",
    location: "Sơn La",
    lat: 21.3283,
    lon: 103.9039,
    tag: "Thiên Nhiên",
    best_month_start: 7,
    best_month_end: 8,
    image_url: "https://i1-e.pinimg.com/1200x/fb/5f/4a/fb5f4a88f2afa9f185bcbf734238eda4.jpg"
  },
  {
    id: 70,
    name: "Mù Cang Chải",
    location: "Yên Bái",
    lat: 21.7229,
    lon: 104.9113,
    tag: "Thiên Nhiên",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://i1-e.pinimg.com/1200x/b0/94/af/b094af6ec04ffb62f90ea6e01b1dd9d1.jpg"
  },
  {
    id: 71,
    name: "Đèo Khau Phạ",
    location: "Yên Bái",
    lat: 21.7229,
    lon: 104.9113,
    tag: "Khám Phá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://i1-e.pinimg.com/736x/c5/a5/86/c5a586ba4822924c3b8866a3863d631e.jpg"
  },
  {
    id: 72,
    name: "Đồi A1",
    location: "Điện Biên",
    lat: 21.3833,
    lon: 103.0167,
    tag: "Lịch Sử",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://i.pinimg.com/736x/c0/be/25/c0be2580a294d040bf7dca6a823173a7.jpg"
  },
  {
    id: 73,
    name: "Hầm Đờ Cát",
    location: "Điện Biên",
    lat: 21.3833,
    lon: 103.0167,
    tag: "Lịch Sử",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://i.pinimg.com/736x/c1/45/fc/c145fc12ad765f972f70d6e98de0b641.jpg"
  },
  {
    id: 74,
    name: "Hồ Pá Khoang",
    location: "Điện Biên",
    lat: 21.3833,
    lon: 103.0167,
    tag: "Thiên Nhiên",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://dulichdienbien.vietnaminfo.net/DataFiles/2022/07/Files/20220718-102322-ey73AbSZ.jpg"
  },
  {
    id: 75,
    name: "Đèo Ô Quy Hồ",
    location: "Lai Châu",
    lat: 22.3956,
    lon: 103.4565,
    tag: "Khám Phá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://dulich.laichau.gov.vn/DataFiles/2024/06/Places/20240613-143452-7OjIk2D1.webp"
  },
  {
    id: 76,
    name: "Sìn Hồ",
    location: "Lai Châu",
    lat: 22.3956,
    lon: 103.4565,
    tag: "Thiên Nhiên",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://dulichokela.com/wp-content/uploads/2024/05/cao-nguyen-sin-ho-lai-chau.jpg"
  },
  {
    id: 77,
    name: "Hồ Hòa Bình",
    location: "Hòa Bình",
    lat: 20.8133,
    lon: 105.3384,
    tag: "Thiên Nhiên",
    best_month_start: 5,
    best_month_end: 9,
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_YLPf_qGQLe0uuHivECwrBcllBuwBlxO2CQ&s"
  },
  {
    id: 78,
    name: "Mai Châu",
    location: "Hòa Bình",
    lat: 20.8133,
    lon: 105.3384,
    tag: "Văn Hoá",
    best_month_start: 9,
    best_month_end: 10,
    image_url: "https://vcdn1-dulich.vnecdn.net/2022/04/12/102022247-mobile-3988-1649760588.jpg?w=0&h=0&q=100&dpr=2&fit=crop&s=mZ8lSPcvp_RAwc0-rX_5-Q"
  },
  {
    id: 79,
    name: "Đền Hùng",
    location: "Phú Thọ",
    lat: 21.3167,
    lon: 105.2167,
    tag: "Lịch Sử",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://mtcs.1cdn.vn/2022/09/19/canh-dong-dien-gio-dam-nai-tinh-ninh-thuan.jpg"
  },
  {
    id: 80,
    name: "Thanh Thủy",
    location: "Phú Thọ",
    lat: 21.3167,
    lon: 105.2167,
    tag: "Nghỉ Dưỡng",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://media.vov.vn/sites/default/files/styles/large/public/2024-11/anh_dep_thanh_thuy.jpg"
  },
  {
    id: 81,
    name: "Tam Đảo",
    location: "Vĩnh Phúc",
    lat: 21.3,
    lon: 105.6,
    tag: "Nghỉ Dưỡng",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://mtcs.1cdn.vn/2023/03/20/tam-dao-vinh-phuc-co-gi-hay-h4.jpg"
  },
  {
    id: 82,
    name: "Tây Thiên",
    location: "Vĩnh Phúc",
    lat: 21.3,
    lon: 105.6,
    tag: "Tâm Linh",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://bizweb.dktcdn.net/thumb/grande/100/288/381/products/bizmac-full-08422015-034200.png?v=1698033492190"
  },
  {
    id: 83,
    name: "Hồ Cấm Sơn",
    location: "Bắc Giang",
    lat: 21.2731,
    lon: 106.1946,
    tag: "Thiên Nhiên",
    best_month_start: 7,
    best_month_end: 8,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/09/Ho-Cam-Son-2.png"
  },
  {
    id: 84,
    name: "Tây Yên Tử",
    location: "Bắc Giang",
    lat: 21.2731,
    lon: 106.1946,
    tag: "Tâm Linh",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://cdn.vivutour.vn/2026/2/thap-chuong-tay-yen-tu-3.webp"
  },
  {
    id: 85,
    name: "Chùa Dâu",
    location: "Bắc Ninh",
    lat: 21.1861,
    lon: 106.0763,
    tag: "Tâm Linh",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/b/bd/Dau_pagoda.jpg"
  },
  {
    id: 86,
    name: "Chùa Bút Tháp",
    location: "Bắc Ninh",
    lat: 21.1861,
    lon: 106.0763,
    tag: "Tâm Linh",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://i1-e.pinimg.com/736x/c9/35/2a/c9352a017b05249ba787028114e710a5.jpg"
  },
  {
    id: 87,
    name: "Đồ Sơn",
    location: "Hải Phòng",
    lat: 20.8449,
    lon: 106.6881,
    tag: "Biển Cát",
    best_month_start: 4,
    best_month_end: 6,
    image_url: "https://www.vietnamairlines.com/content/dam/legacy-site-assets/SEO-images/2025%20SEO/Thay%20Anh%20Traffic%20Tieng%20Viet/do%20son%20hai%20phong/do-son-hai-phong-co-vi-tri-thuan-loi-trong-du-lich-thu-hut-luong-lon-du-khach-noi-dia.jpeg"
  },
  {
    id: 88,
    name: "Phố Hiến",
    location: "Hưng Yên",
    lat: 20.65,
    lon: 106.05,
    tag: "Lịch Sử",
    best_month_start: 9,
    best_month_end: 11,
    image_url: "https://img.tripi.vn/cdn-cgi/image/width=700,height=700/https://gcs.tripi.vn/public-tripi/tripi-feed/img/473733Hsy/pho-hien-hung-yen-ivivu-1.jpg"
  },
  {
    id: 89,
    name: "Văn Miếu Xích Đằng",
    location: "Hưng Yên",
    lat: 20.65,
    lon: 106.05,
    tag: "Lịch Sử",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/V%C4%83n_mi%E1%BA%BFu_X%C3%ADch_%C4%90%E1%BA%B1ng_02.JPG/330px-V%C4%83n_mi%E1%BA%BFu_X%C3%ADch_%C4%90%E1%BA%B1ng_02.JPG"
  },
  {
    id: 90,
    name: "Biển Đồng Châu",
    location: "Thái Bình",
    lat: 20.45,
    lon: 106.3333,
    tag: "Biển Cát",
    best_month_start: 5,
    best_month_end: 8,
    image_url: "https://ik.imagekit.io/tvlk/blog/2024/03/bien-dong-chau-1-1024x682.jpg?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 91,
    name: "Đền Trần",
    location: "Nam Định",
    lat: 20.4333,
    lon: 106.1667,
    tag: "Lịch Sử",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcoydN4hAR1ZCC-hIOg0G-1PAwIFdbkF9PGA&s"
  },
  {
    id: 92,
    name: "Tam Chúc",
    location: "Hà Nam",
    lat: 20.5833,
    lon: 105.9167,
    tag: "Tâm Linh",
    best_month_start: 11,
    best_month_end: 12,
    image_url: "https://bizweb.dktcdn.net/100/474/438/products/tham-quan-chua-tam-chuc-ha-nam.jpg?v=1716283364750"
  },
  {
    id: 93,
    name: "Hồ Núi Cốc",
    location: "Thái Nguyên",
    lat: 21.5942,
    lon: 105.8482,
    tag: "Thiên Nhiên",
    best_month_start: 11,
    best_month_end: 12,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/01/khu-du-lich-ho-nui-coc-2.jpg?tr=q-70,c-at_max,w-1000,h-600"
  },
  {
    id: 94,
    name: "Tân Trào",
    location: "Tuyên Quang",
    lat: 21.8167,
    lon: 105.2167,
    tag: "Lịch Sử",
    best_month_start: 11,
    best_month_end: 12,
    image_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcReOei1yWkJriQ64HGv9Yd6DKEMFRBJWlwPow&s"
  },
  {
    id: 95,
    name: "Na Hang",
    location: "Tuyên Quang",
    lat: 21.8167,
    lon: 105.2167,
    tag: "Thiên Nhiên",
    best_month_start: 7,
    best_month_end: 8,
    image_url: "https://gcs.tripi.vn/public-tripi/tripi-feed/img/473793Pgs/kinh-nghiem-du-lich-na-hang-tuyen-quang-huu-ich-nhat-ma-ban-nen-biet-854014.jpg"
  },
  {
    id: 96,
    name: "Bản Giốc",
    location: "Cao Bằng",
    lat: 22.6667,
    lon: 106.25,
    tag: "Thiên Nhiên",
    best_month_start: 7,
    best_month_end: 8,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/08/thac-ban-gioc-cao-bang.jpg"
  },
  {
    id: 97,
    name: "Ngườm Ngao",
    location: "Cao Bằng",
    lat: 22.6667,
    lon: 106.25,
    tag: "Hang Động",
    best_month_start: 7,
    best_month_end: 8,
    image_url: "https://ik.imagekit.io/tvlk/blog/2023/03/go-and-share-dong-nguom-ngao-5.jpg"
  },
  {
    id: 98,
    name: "Mẫu Sơn",
    location: "Lạng Sơn",
    lat: 21.8333,
    lon: 106.7667,
    tag: "Thiên Nhiên",
    best_month_start: 1,
    best_month_end: 3,
    image_url: "https://img.baobacninhtv.vn/Medias/2021/11/25/17/20211125172346-01.jpg"
  },
  {
    id: 99,
    name: "Hồ Ba Bể",
    location: "Bắc Kạn",
    lat: 22.1333,
    lon: 105.8333,
    tag: "Thiên Nhiên",
    best_month_start: 7,
    best_month_end: 8,
    image_url: "https://ik.imagekit.io/tvlk/blog/2022/10/kinh-nghiem-du-lich-ho-ba-be-1.jpg?tr=q-70,c-at_max,w-1000,h-600"
  }
];

// calculateDistance is used by the merged /api/travel-suggestions route above
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c);
}

// Serve frontend SPA cho mọi route không phải API (production)
if (fs.existsSync(DIST_DIR)) {
  app.use((req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.use((req, res) => res.status(404).json({ message: 'Route không tồn tại' }));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 ExploreVN Backend đang chạy tại cổng ${PORT}`));

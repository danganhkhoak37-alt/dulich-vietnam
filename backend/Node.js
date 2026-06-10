// Cấu hình kết nối MySQL
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'your_password',
  database: 'Wanderly_DB'
});

// API Gợi ý du lịch thông minh
app.get('/api/travel-suggestions', async (req, res) => {
  const { userLat, userLng, currentMonth } = req.query;

  try {
    // Truy vấn tính khoảng cách và lọc theo tháng tốt nhất
    const [rows] = await pool.execute(`
      SELECT *, 
      (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) AS distance 
      FROM locations
      WHERE ? BETWEEN best_month_start AND best_month_end
      ORDER BY distance ASC
      LIMIT 10
    `, [userLat, userLng, userLat, currentMonth]);

    res.json({
      status: 'success',
      count: rows.length,
      data: rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
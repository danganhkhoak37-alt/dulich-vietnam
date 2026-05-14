const https = require('https');

function searchPinterest(query) {
  return new Promise((resolve, reject) => {
    const url = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(query)}`;
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Cố gắng trích xuất URL ảnh từ dữ liệu JSON nhúng trong trang
        const match = data.match(/https:\/\/i\.pinimg\.com\/[a-zA-Z0-9_]+\/[a-zA-Z0-9_\/]+\.jpg/g);
        if (match && match.length > 0) {
          // Lọc ra các ảnh có kích thước lớn (chứa /736x/ hoặc /originals/)
          const highRes = match.filter(url => url.includes('/736x/') || url.includes('/originals/'));
          resolve(highRes.length > 0 ? highRes[0] : match[0]);
        } else {
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

searchPinterest('Đại Nội Huế').then(url => {
  console.log('Result:', url);
}).catch(console.error);

const fs = require('fs');
const https = require('https');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function searchPinterestDDG(query) {
  return new Promise((resolve, reject) => {
    https.get(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const vqdMatch = data.match(/vqd=["']([^"']+)["']/);
        if (!vqdMatch) return resolve(null);
        const vqd = vqdMatch[1];
        
        const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}&f=,,,&p=1`;
        https.get(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        }, (res2) => {
          let data2 = '';
          res2.on('data', c => data2 += c);
          res2.on('end', () => {
            try {
              const json = JSON.parse(data2);
              if (json.results && json.results.length > 0) {
                const pinterestImg = json.results.find(r => r.image.includes('i.pinimg.com'));
                resolve(pinterestImg ? pinterestImg.image : json.results[0].image);
              } else {
                resolve(null);
              }
            } catch(e) {
              resolve(null);
            }
          });
        });
      });
    });
  });
}

async function fetchAllPinterest() {
  let content = fs.readFileSync('server.js', 'utf8');
  
  const names = [];
  const regex = /name:\s*"([^"]+)"/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (!['WanderlyVietNam'].includes(match[1])) {
      names.push(match[1]);
    }
  }

  console.log(`Bắt đầu tìm ảnh Pinterest cho ${names.length} địa điểm...`);

  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    try {
      await sleep(1000); // 1s delay to avoid DDG rate limit
      
      const query = `${name} vietnam travel pinterest aesthetic photography`;
      const imageUrl = await searchPinterestDDG(query);

      if (imageUrl) {
        console.log(`✅ ${name}: ${imageUrl}`);
        const namePattern = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const replaceRegex = new RegExp(`(name:\\s*"${namePattern}"[\\s\\S]*?image_url:\\s*)"([^"]+)"`, 'g');
        content = content.replace(replaceRegex, `$1"${imageUrl}"`);
      } else {
        console.log(`❌ Không tìm thấy: ${name}`);
      }
    } catch (err) {
      console.log(`❌ Lỗi: ${name}`);
    }
  }

  fs.writeFileSync('server.js', content, 'utf8');
  console.log('\nHoàn tất cập nhật ảnh Pinterest!');
}

fetchAllPinterest();

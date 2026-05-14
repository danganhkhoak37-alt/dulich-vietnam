const https = require('https');

async function searchDDG(query) {
  return new Promise((resolve, reject) => {
    https.get(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&t=h_&ia=web`, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const vqdMatch = data.match(/vqd=["']([^"']+)["']/);
        if (!vqdMatch) return reject('No vqd token');
        const vqd = vqdMatch[1];
        
        const url = `https://duckduckgo.com/i.js?q=${encodeURIComponent(query)}&o=json&vqd=${vqd}&f=,,,&p=1`;
        https.get(url, (res2) => {
          let data2 = '';
          res2.on('data', c => data2 += c);
          res2.on('end', () => {
            try {
              const json = JSON.parse(data2);
              if (json.results && json.results.length > 0) {
                // Lọc chỉ lấy URL từ i.pinimg.com
                const pinterestImg = json.results.find(r => r.image.includes('i.pinimg.com'));
                resolve(pinterestImg ? pinterestImg.image : json.results[0].image);
              } else {
                resolve(null);
              }
            } catch(e) {
              reject(e);
            }
          });
        });
      });
    });
  });
}

searchDDG('Đại Nội Huế pinterest travel aesthetic').then(url => console.log('Result:', url)).catch(console.error);

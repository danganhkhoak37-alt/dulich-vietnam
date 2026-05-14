const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

async function scrape() {
  const response = await axios.get('https://vnexpress.net/du-lich/cam-nang', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(response.data);
  const guideItems = [];
  const seenTitles = new Set();
  
  const internationalKeywords = ['quốc tế', 'thế giới', 'trung quốc', 'nhật bản', 'hàn quốc', 'châu âu', 'châu á', 'mỹ', 'pháp', 'đức', 'anh', 'nga', 'tây', 'nước ngoài', 'bali', 'thái lan', 'singapore', 'đài loan', 'malaysia'];

  $('article.item-news').each((i, el) => {
    if (guideItems.length >= 12) return;
    
    let title = $(el).find('.title-news h3').text().trim() || $(el).find('h3.title-news a').text().trim() || $(el).find('.title-news').text().trim();
    let link = $(el).find('a').attr('href');
    let excerpt = $(el).find('p.description').text().trim() || 'Khám phá chi tiết cẩm nang du lịch, những trải nghiệm chân thực và mẹo vặt hữu ích từ cộng đồng đam mê xê dịch.';
    let image = $(el).find('picture img').attr('src') || $(el).find('div.thumb-art img').attr('data-src') || $(el).find('div.thumb-art img').attr('src') || $(el).find('img').attr('src');
    let categoryLabel = $(el).find('span.location-stamp').text().trim() || 'Cẩm nang';

    const isInternational = internationalKeywords.some(kw => 
      title.toLowerCase().includes(kw) || 
      excerpt.toLowerCase().includes(kw) || 
      categoryLabel.toLowerCase().includes(kw)
    );

    if (title && link && !seenTitles.has(title) && !isInternational) {
      seenTitles.add(title);
      guideItems.push({
        id: "vn-guide-" + guideItems.length,
        title,
        link,
        excerpt,
        image_url: image || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800',
        category: categoryLabel,
        read_time: '5 phút'
      });
    }
  });

  const dest = path.join(__dirname, '..', 'src', 'data', 'vnexpressGuides.json');
  fs.writeFileSync(dest, JSON.stringify(guideItems, null, 2), 'utf-8');
  console.log('Saved ' + guideItems.length + ' items to ' + dest);
}
scrape();

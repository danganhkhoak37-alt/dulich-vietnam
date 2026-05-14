const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
  const response = await axios.get('https://vnexpress.net/du-lich/cam-nang', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });
  const $ = cheerio.load(response.data);
  $('article.item-news').each((i, el) => {
    let title = $(el).find('.title-news h3').text().trim() || $(el).find('h3.title-news a').text().trim() || $(el).find('.title-news').text().trim();
    let link = $(el).find('a').attr('href');
    console.log({title, link});
  });
}
test();

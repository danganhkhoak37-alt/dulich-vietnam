const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('../database.sqlite');
db.serialize(() => {
  db.run("UPDATE posts SET image_url = replace(image_url, 'http://localhost:5000/uploads/', '/uploads/') WHERE image_url LIKE 'http://localhost:5000/uploads/%'");
  db.run("UPDATE users SET avatar_url = replace(avatar_url, 'http://localhost:5000/uploads/', '/uploads/') WHERE avatar_url LIKE 'http://localhost:5000/uploads/%'");
  db.run("UPDATE users SET cover_url = replace(cover_url, 'http://localhost:5000/uploads/', '/uploads/') WHERE cover_url LIKE 'http://localhost:5000/uploads/%'");
});
db.close(() => console.log('Fixed DB URLs'));

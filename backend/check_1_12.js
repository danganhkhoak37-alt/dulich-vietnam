const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

const regex = /name:\s*"([^"]+)"(?:(?!"name:")[^}])*?best_month_start:\s*1,\s*best_month_end:\s*12/g;
let match;
const found = [];
while ((match = regex.exec(content)) !== null) {
  found.push(match[1]);
}
console.log('Locations with 1-12:', found);

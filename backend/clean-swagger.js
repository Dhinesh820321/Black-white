const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js') && f !== 'index.js');

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Clean empty parameters array and their empty lines
  content = content.replace(/ \*\s+parameters:\n \*\s+responses:/g, ' *     responses:');
  
  fs.writeFileSync(filePath, content, 'utf8');
});
console.log('Cleaned up empty swagger parameters');

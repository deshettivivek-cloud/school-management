const fs = require('fs');
const path = require('path');
const dirs = [
  'c:/Users/VIVEK-D/OneDrive/Pictures/Desktop/New folder/server/controllers',
  'c:/Users/VIVEK-D/OneDrive/Pictures/Desktop/New folder/server/routes'
];

dirs.forEach(dir => {
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.js')) {
      const p = path.join(dir, file);
      let content = fs.readFileSync(p, 'utf8');
      
      // Replace backslash followed by backtick with just backtick
      if (content.includes('\\`')) {
        content = content.replace(/\\\`/g, '`');
        fs.writeFileSync(p, content);
        console.log('Fixed', p);
      }
    }
  });
});
console.log('Done');

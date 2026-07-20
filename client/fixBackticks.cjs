const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if(file.endsWith('.js') || file.endsWith('.jsx')) {
          results.push(file);
      }
    }
  });
  return results;
}

const files = walk('c:/Users/VIVEK-D/OneDrive/Pictures/Desktop/New folder/client/src');
files.forEach(p => {
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('\\`')) {
    content = content.replace(/\\\`/g, '`');
    fs.writeFileSync(p, content);
    console.log('Fixed', p);
  }
});
console.log('Done');

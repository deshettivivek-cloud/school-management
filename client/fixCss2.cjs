const fs = require('fs');
let css = fs.readFileSync('src/styles/index.css', 'utf8');

css = css.replace(/table-container\s*\{\s*background:\s*var\(--bg-card\);\s*border:\s*1px\s*solid\s*var\(--border-color\);\s*border-radius:\s*var\(--radius-lg\);\s*overflow:\s*hidden;\s*box-shadow:\s*var\(--shadow-xs\);\s*\}/g, 'table-container {\n  background: var(--bg-card);\n  border: 1px solid var(--border-color);\n  border-radius: var(--radius-lg);\n  overflow-x: auto;\n  box-shadow: var(--shadow-xs);\n}');

fs.writeFileSync('src/styles/index.css', css);
console.log('done table-container');

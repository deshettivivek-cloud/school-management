const fs = require('fs');
let css = fs.readFileSync('src/styles/index.css', 'utf8');

// The line endings could be \r\n
css = css.replace(/stat-grid\s*\{\s*grid-template-columns:\s*1fr;\s*\}/g, 'stat-grid {\n    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));\n  }');

const addCss = `
@media (max-width: 480px) {
  .stat-grid {
    grid-template-columns: 1fr !important;
  }
  
  .card {
    width: 100%;
  }
}

/* ── Responsive Table Wrapper ─────────────────────────────── */
.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.table-responsive table {
  min-width: 600px;
}
`;

if (!css.includes('.table-responsive')) {
  css += addCss;
}

fs.writeFileSync('src/styles/index.css', css);
console.log('done');

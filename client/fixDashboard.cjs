const fs = require('fs');
let css = fs.readFileSync('src/styles/dashboard.css', 'utf8');

const heroMedia = `
@media (max-width: 768px) {
  .dashboard-hero {
    flex-direction: column;
    padding: 1.5rem;
    gap: 1.5rem;
  }
  .hero-title {
    font-size: 1.75rem !important;
  }
  .dashboard-hero-bg::after {
    display: none;
  }
}
`;

if (!css.includes('.dashboard-hero {\\n    flex-direction: column;')) {
  css += heroMedia;
  fs.writeFileSync('src/styles/dashboard.css', css);
  console.log('done dashboard');
}

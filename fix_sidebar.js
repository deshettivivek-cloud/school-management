const fs = require('fs');
let c = fs.readFileSync('client/src/components/Layout/Sidebar.jsx', 'utf8');
c = c.replace(/const \[openSection, setOpenSection\] = useState\(null\);/, 'const [openSection, setOpenSection] = useState(null);\n  const effectiveCollapsed = collapsed && !mobileOpen;');
c = c.replace(/{!collapsed && \(\s*<div className="sidebar-footer-new"/, '{!effectiveCollapsed && (\n          <div className="sidebar-footer-new"');
fs.writeFileSync('client/src/components/Layout/Sidebar.jsx', c);

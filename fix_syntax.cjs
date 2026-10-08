const fs = require('fs');
let c = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

c = c.replace(/import\s*\{\s*import PageSkeleton from '\.\.\/components\/PageSkeleton';/g, "import PageSkeleton from '../components/PageSkeleton';\nimport {");

fs.writeFileSync('src/pages/Settings.jsx', c);
console.log('Fixed syntax error in Settings.jsx');

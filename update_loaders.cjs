const fs = require('fs');
const path = require('path');

const applySkeletonLoader = (filePath, loadingCheckStr) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes("import PageSkeleton from")) {
    // Add import after the last import statement
    const lastImportIndex = content.lastIndexOf('import ');
    if (lastImportIndex !== -1) {
      const endOfImport = content.indexOf('\n', lastImportIndex);
      content = content.slice(0, endOfImport + 1) + 
                `import PageSkeleton from '../components/PageSkeleton';\n` + 
                content.slice(endOfImport + 1);
    }
  }

  // Replace standard loading blocks
  // Specifically targeting the return blocks that start with "if (loading) return ("
  // and end with ");"
  
  const loadingRegex = new RegExp(`if\\s*\\(loading\\)\\s*return\\s*\\([\\s\\S]*?\\);`, 'm');
  if (loadingRegex.test(content)) {
    content = content.replace(loadingRegex, `if (loading) return <PageSkeleton />;`);
    console.log(`Updated ${path.basename(filePath)} (Full Page Return)`);
  } else {
    // For inline loading like {loading ? (...) : (...)}
    // Example: {loading ? (<div ... animate-spin ...></div>) : (...
    
    // Just a basic replacement for known patterns
    if (content.includes("{loading ? (")) {
       const inlineRegex = /\{\s*loading\s*\?\s*\(\s*<div[^>]*>[\s\S]*?<div[^>]*animate-spin[^>]*>[\s\S]*?<\/div>\s*\)\s*:/g;
       content = content.replace(inlineRegex, '{loading ? (<PageSkeleton />) :');
       console.log(`Updated ${path.basename(filePath)} (Inline Ternary)`);
    }
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
};

const pages = [
  'Settings.jsx',
  'TableUtilization.jsx',
  'TimeComparisonReport.jsx',
  'TableWiseSalesReport.jsx'
];

pages.forEach(file => {
  applySkeletonLoader(path.join(__dirname, 'src', 'pages', file), 'if (loading)');
});

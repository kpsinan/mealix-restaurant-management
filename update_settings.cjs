const fs = require('fs');

const path = 'src/pages/Settings.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Alt+B shortcut
if (!content.includes('Alt + B')) {
  content = content.replace(
    'const SHORTCUTS_MAP = [',
    'const SHORTCUTS_MAP = [\n  { category: \'Navigation\', keys: \'Alt + B\', action: \'Go to Billing & Print\' },'
  );
}

// 2. Add more about the app
const oldAbout = '<p className="text-gray-500 mt-6 max-w-md text-center leading-relaxed">\n                  {"Smart POS System"}\n               </p>';
const newAbout = `<div className="text-gray-600 mt-6 max-w-2xl text-center leading-relaxed space-y-4">
                  <p>
                    <strong>MealiX POS</strong> is a next-generation Restaurant Management System designed to streamline operations from order taking to kitchen display and billing.
                  </p>
                  <p>
                    Developed with modern web technologies, it features real-time synchronization, smart table assignment, and extensive multi-language support (including Arabic, Spanish, and Malayalam). 
                    Our goal is to provide restaurant staff with an intuitive, lightning-fast interface to ensure seamless customer service.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <span className="block font-bold text-blue-600 text-xl">10+</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Modules</span>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <span className="block font-bold text-emerald-600 text-xl">100%</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Cloud Sync</span>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <span className="block font-bold text-purple-600 text-xl">Live</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Analytics</span>
                    </div>
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                      <span className="block font-bold text-orange-600 text-xl">Auto</span>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Backups</span>
                    </div>
                  </div>
               </div>`;

// Use simple string replacement without exact whitespace matching to avoid failing
content = content.replace(/<p[^>]*>\s*\{"Smart POS System"\}\s*<\/p>/g, newAbout);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated Settings.jsx');

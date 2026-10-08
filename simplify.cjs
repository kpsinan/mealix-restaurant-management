const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'translations.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace sidebar items in English
content = content.replace(/dashboard: "Dashboard"/, 'dashboard: "Home"');
content = content.replace(/floorPlan: "Floor Plan"/, 'floorPlan: "Tables"');
content = content.replace(/smartAssign: "Smart Assign"/, 'smartAssign: "Auto Assign"');
content = content.replace(/order: "Take Order"/, 'order: "New Order"');
content = content.replace(/menu: "Menu Management"/, 'menu: "Menu"');
content = content.replace(/billing: "Billing & Cashier"/, 'billing: "Billing"');
content = content.replace(/reports: "Reports Hub"/, 'reports: "Reports"');
content = content.replace(/staff: "Staff Directory"/, 'staff: "Staff"');
content = content.replace(/kitchen: "Kitchen Display \(KDS\)"/, 'kitchen: "Kitchen"');
content = content.replace(/settings: "System Settings"/, 'settings: "Settings"');

// Replace page titles in English
content = content.replace(/title: "Dashboard Overview"/, 'title: "Home"');
content = content.replace(/title: "Take New Order"/, 'title: "New Order"');
content = content.replace(/title: "Kitchen Display System \(KDS\)"/, 'title: "Kitchen Orders"');
content = content.replace(/title: "Billing & Checkout"/, 'title: "Billing"');
content = content.replace(/title: "Staff Attendance & History"/, 'title: "Staff Attendance"');
content = content.replace(/title: "Floor Plan & Table Status"/, 'title: "Tables"');
content = content.replace(/title: "Reports & Analytics Hub"/, 'title: "Reports"');
// Wait, settings title already exists as "System Settings" which I replaced above, wait, in settings block it's `title: "System Settings"`.
// So the first replace will actually match both if there are multiple. Let's make sure.
content = content.replace(/title: "System Settings"/g, 'title: "Settings"');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully simplified navigation and titles.');

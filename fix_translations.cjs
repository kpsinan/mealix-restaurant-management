const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, 'src', 'pages', 'Settings.jsx');
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

const settingsReplacements = {
  't.settingsTitle': 't.settings.title',
  't.settingsSubtitle': 't.settings.subtitle',
  't.loading': 't.common.loading',
  't.saving': 't.common.saving',
  't.saveChanges': 't.common.save',
  't.saveSuccess': 't.settings.saveSuccess',
  't.saveError': 't.common.error',
  't.tabGeneral': 't.settings.tabGeneral',
  't.tabLocalization': 't.settings.tabLocalization',
  't.tabPrinting': 't.settings.tabPrinting',
  't.tabShortcuts': 't.settings.tabShortcuts',
  't.tabAbout': 't.settings.tabAbout',
  't.generalTitle': '"General Configuration"',
  't.restaurantNamePlaceholder': '"Enter restaurant name"',
  't.restaurantName': 't.settings.restaurantName',
  't.addressSubtitle': '"Appears on receipt"',
  't.addressPlaceholder': '"Enter full address"',
  't.address': 't.settings.address',
  't.upiIdSubtitle': '"For QR code payments"',
  't.upiId': 't.settings.upiId',
  't.localizationTitle': '"Localization & Region"',
  't.appLanguageSubtitle': '"Select system language"',
  't.appLanguage': 't.settings.appLanguage',
  't.defaultCurrencySubtitle': '"Used across the app"',
  't.defaultCurrency': 't.settings.defaultCurrency',
  't.printingTitle': '"Receipt Printing"',
  't.paperSizeSubtitle': '"58mm or 80mm printers"',
  't.paperSize': 't.settings.paperSize',
  't.fontDensitySubtitle': '"Adjust text size on receipt"',
  't.fontDensity': 't.settings.fontDensity',
  't.footerMessageSubtitle': '"Message at bottom of bill"',
  't.footerMessage': 't.settings.footerMessage',
  't.showLogoSubtitle': '"Print logo at top"',
  't.showLogo': 't.settings.showLogo',
  't.shortcutsTitle': '"Keyboard Shortcuts"',
  't.shortcutsKey': '"Key / Combo"',
  't.shortcutsAction': '"Action"',
  't.shortcutsCategory': '"Category"',
  't.appSlogan': '"Smart POS System"'
};

for (const [key, value] of Object.entries(settingsReplacements)) {
  const regex = new RegExp(`\\b${key.replace(/\./g, '\\.')}\\b`, 'g');
  settingsContent = settingsContent.replace(regex, value);
}

fs.writeFileSync(settingsPath, settingsContent, 'utf8');
console.log("Settings.jsx updated successfully.");

const menuPath = path.join(__dirname, 'src', 'pages', 'Menu.jsx');
let menuContent = fs.readFileSync(menuPath, 'utf8');

const menuReplacements = {
  't.menuTitle': '(t.menu?.title || "Menu Management")',
  't.menuSubtitle': '(t.menu?.subtitle || "Manage your dishes & categories")',
  't.bulkActions': '(t.menu?.bulkActions || "Bulk Actions")',
  't.addNewItem': '(t.menu?.addNewItem || "Add New Item")',
  't.selectItems': '(t.menu?.selectItems || "Select Items")',
  't.deselectAll': '(t.menu?.deselectAll || "Deselect All")',
  't.selectAll': '(t.menu?.selectAll || "Select All")',
  't.delete': 't.common.delete',
  't.cancel': 't.common.cancel',
  't.deleting': 't.common.deleting',
  't.done': '(t.common.save || "Done")',
  't.confirmDeleteTitle': '(t.menu?.confirmDeleteTitle || "Confirm Deletion")',
  't.confirmDeleteMsg': '(t.menu?.confirmDeleteMsg || "Are you sure you want to delete")',
  't.addItemTitle': '(t.menu?.addItemTitle || "Add/Edit Menu Item")',
  't.itemName': '(t.menu?.itemName || "Item Name")',
  't.fullPrice': '(t.menu?.fullPrice || "Full Price")',
  't.halfPrice': '(t.menu?.halfPrice || "Half Price")',
  't.quarterPrice': '(t.menu?.quarterPrice || "Quarter Price")',
  't.ingredients': '(t.menu?.ingredients || "Ingredients")',
  't.specialNote': '(t.menu?.specialNote || "Special Note")',
  't.bulkAddTitle': '(t.menu?.bulkAddTitle || "Bulk Add Items")',
  't.bulkUpdateTitle': '(t.menu?.bulkUpdateTitle || "Bulk Update Items")',
  't.bulkAddSubtitle': '(t.menu?.bulkAddSubtitle || "Add multiple items at once")',
  't.bulkUpdateSubtitle': '(t.menu?.bulkUpdateSubtitle || "Update multiple items at once")',
  't.addRow': '(t.menu?.addRow || "Add Row")',
  't.updateItems': '(t.menu?.updateItems || "Update Items")',
  't.addItems': '(t.menu?.addItems || "Add Items")',
  't.processing': '(t.common.saving || "Processing...")',
  't.bulkActionTitle': '(t.menu?.bulkActionTitle || "Bulk Actions")',
  't.addNewItemsBtn': '(t.menu?.addNewItemsBtn || "Add New Items")',
  't.updateExistingBtn': '(t.menu?.updateExistingBtn || "Update Existing Items")',
  't.selected': '(t.menu?.selected || "Selected")',
  't.selectSubtitle': '(t.menu?.selectSubtitle || "Select items to perform actions")',
  't.status': '(t.common.status || "Status")',
  't.matchStatus': '(t.menu?.matchStatus || "Match Status")'
};

for (const [key, value] of Object.entries(menuReplacements)) {
  const regex = new RegExp(`\\b${key.replace(/\./g, '\\.')}\\b`, 'g');
  menuContent = menuContent.replace(regex, value);
}

fs.writeFileSync(menuPath, menuContent, 'utf8');
console.log("Menu.jsx updated successfully.");

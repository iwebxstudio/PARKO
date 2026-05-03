const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'src', 'pages', 'staff', 'CheckIn.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all border-radius Tailwind classes
content = content.replace(/rounded-(lg|xl|md|full|sm)/g, 'rounded-none');
content = content.replace(/ rounded /g, ' rounded-none ');
content = content.replace(/ rounded"/g, ' rounded-none"');

fs.writeFileSync(filePath, content);
console.log('Removed all border-radius from CheckIn.tsx');

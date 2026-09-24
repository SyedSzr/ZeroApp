const fs = require('fs');
const file = 'd:/App/Zero/ZeroApp/js/screens/profile.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\{ label: t\('my_submissions'\), count: mySubmissions\.length, icon: '.*?' \},\s*/g, '');
content = content.replace(/className=\"px-5 grid grid-cols-3 gap-3 mb-6\"/g, 'className={\"px-5 grid gap-3 mb-6 \" + (user ? \"grid-cols-2\" : \"grid-cols-3\")}');

const fallbackStart = 'My Submissions (My Games)';
const fallbackEnd = 'Menu Items (Horizontal)';

if (content.includes(fallbackStart) && content.includes(fallbackEnd)) {
  const startIndex = content.lastIndexOf('{/*', content.indexOf(fallbackStart));
  const endIndex = content.lastIndexOf('{/*', content.indexOf(fallbackEnd));
  
  if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
  }
}

const fallbackModalStart = 'Submission Details Modal';
const fallbackModalEnd = 'Settings View';
if (content.includes(fallbackModalStart) && content.includes(fallbackModalEnd)) {
  const startIndex = content.lastIndexOf('{/*', content.indexOf(fallbackModalStart));
  const endIndex = content.lastIndexOf('{/*', content.indexOf(fallbackModalEnd));
  if (startIndex !== -1 && endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex);
  }
}

fs.writeFileSync(file, content);
console.log('Done');

const fs = require('fs');
const file = 'd:/App/Zero/ZeroApp/js/admin.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div class="flex flex-col gap-1 px-1">([\s\S]*?)<\/div>\s*<button onclick="togglePlayScroll/g;
let matchCount = 0;

content = content.replace(regex, (match, p1) => {
  matchCount++;
  return '<div class="flex items-center gap-2">' +
         '<input type="number" value="${idx + 1}" min="1" max="${selectedGames.length}" onchange="setPlayScrollIndex(\'${g.id}\', this.value - 1)" title="Change rank" class="w-14 h-10 bg-white/5 border border-white/10 rounded-xl text-center text-white text-sm font-bold focus:border-accent outline-none" />' +
         '<div class="flex flex-col gap-1 px-1">' + p1 + '</div>' +
         '</div><button onclick="togglePlayScroll';
});

console.log('Matches replaced:', matchCount);

if (!content.includes('window.setPlayScrollIndex')) {
  content += '\nwindow.setPlayScrollIndex = (id, newIdx) => {\n  let selected = [];\n  try { selected = JSON.parse(data.settings.play_scroll_games || \'[]\'); } catch(e) {}\n  const oldIdx = selected.indexOf(id);\n  if (oldIdx < 0) return;\n  newIdx = Math.max(0, Math.min(newIdx, selected.length - 1));\n  if (newIdx === oldIdx) return;\n  selected.splice(oldIdx, 1);\n  selected.splice(newIdx, 0, id);\n  data.settings.play_scroll_games = JSON.stringify(selected);\n  renderCurrentView();\n};\n';
}

fs.writeFileSync(file, content);
console.log('Done');

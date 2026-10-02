const fs = require('fs');
const file = 'd:/App/Zero/ZeroApp/js/admin.js';
let content = fs.readFileSync(file, 'utf8');

const htmlToReplace = \
                <div class="flex flex-col gap-1 px-1">
                  <button onclick="movePlayScroll('\', -1)" class="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-white \">?</button>
                  <button onclick="movePlayScroll('\', 1)" class="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-white \">?</button>
                </div>
\;

const htmlReplacement = \
                <div class="flex items-center gap-2">
                  <input type="number" 
                         value="\" 
                         min="1" 
                         max="\" 
                         onchange="setPlayScrollIndex('\', this.value - 1)" 
                         title="Change rank"
                         class="w-12 h-10 bg-white/5 border border-white/10 rounded-xl text-center text-white text-sm focus:border-accent outline-none" />
                  <div class="flex flex-col gap-1 px-1">
                    <button onclick="movePlayScroll('\', -1)" class="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-white \">?</button>
                    <button onclick="movePlayScroll('\', 1)" class="w-7 h-7 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 text-white \">?</button>
                  </div>
                </div>
\;

// Actually the arrows are not ? in source code? Let's check the source first.

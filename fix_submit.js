const fs = require('fs');
const file = 'd:/App/Zero/ZeroApp/js/screens/submit.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const payload = \{[\s\S]*?status: 'pending',\s*tags: [^\n]+\n\s*\};/,
  const payload = {
        id,
        name,
        description: fd.get('description'),
        long_description: fd.get('long_description') || '',
        url: rawUrl,
        region: fd.get('region') || 'Global',
        category: fd.get('category'),
        user_id: user?.id || null,
        status: 'pending',
        tags: fd.get('tags') ? fd.get('tags').split(',').map(t_tag => t_tag.trim()).filter(Boolean) : []
      };

      if (itemType === 'game') {
        payload.gameCategory = fd.get('category');
      } else {
        payload.homeCategory = fd.get('category');
      }
);

fs.writeFileSync(file, content);
console.log('Done');

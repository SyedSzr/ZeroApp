const https = require('https');
const options = {
  hostname: 'sjotifqahfcylcooaqxm.supabase.co',
  port: 443,
  path: '/rest/v1/profiles?select=*',
  method: 'GET',
  headers: {
    'apikey': 'sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj',
    'Authorization': 'Bearer sb_publishable_3h4-HTzlMANQA-T2FMaavQ_uso2rIGj'
  }
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
});
req.on('error', console.error);
req.end();

const fs = require('fs');
const filepath = 'C:\\Users\\YaelDrori\\Documents\\roy cv\\אלפון';

try {
  const stat = fs.statSync(filepath);
  console.log('Is Directory?', stat.isDirectory());
  console.log('Size:', stat.size);
  
  if (!stat.isDirectory()) {
    const buffer = fs.readFileSync(filepath);
    console.log('First 500 bytes:', buffer.slice(0, 500).toString('utf-8'));
  }
} catch (e) {
  console.error(e);
}

const fs = require('fs');
const path = require('path');

const dir = '/Users/c.longlade/Library/CloudStorage/OneDrive-DAILYMOTION/Slack_inactivity_autobot_log';
const file = path.join(dir, 'test.txt');

try {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, 'test');
  console.log('✅ Write successful');
} catch (err) {
  console.error('❌ Write failed:', err);
}
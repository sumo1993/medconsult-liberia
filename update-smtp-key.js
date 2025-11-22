const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 SMTP Key Updater for Brevo\n');
console.log('📋 Steps to get your new SMTP key:');
console.log('   1. Go to https://app.brevo.com');
console.log('   2. Login with: 429319lr@gmail.com');
console.log('   3. Click Settings (gear icon)');
console.log('   4. Click "SMTP & API" in left menu');
console.log('   5. Click "SMTP" tab');
console.log('   6. Click "Generate a new SMTP key"');
console.log('   7. Copy the key (starts with xsmtpsib-)\n');

rl.question('Paste your NEW SMTP key here: ', (newKey) => {
  if (!newKey || !newKey.startsWith('xsmtpsib-')) {
    console.log('\n❌ Invalid key format. Key should start with "xsmtpsib-"');
    rl.close();
    return;
  }

  try {
    // Read current .env.local
    let envContent = fs.readFileSync('.env.local', 'utf8');
    
    // Replace the SMTP_PASS line
    const updatedContent = envContent.replace(
      /SMTP_PASS=.*/,
      `SMTP_PASS=${newKey.trim()}`
    );
    
    // Write back to .env.local
    fs.writeFileSync('.env.local', updatedContent);
    
    console.log('\n✅ SMTP key updated in .env.local!');
    console.log('\n🧪 Testing connection...\n');
    
    rl.close();
    
    // Test the connection
    const { execSync } = require('child_process');
    try {
      execSync('node test-brevo-connection.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('\n⚠️  Test failed. Please check if the key is correct.');
    }
    
  } catch (error) {
    console.error('\n❌ Error updating file:', error.message);
    rl.close();
  }
});

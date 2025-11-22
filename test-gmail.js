const readline = require('readline');
const nodemailer = require('nodemailer');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📧 Gmail SMTP Tester\n');
console.log('First, you need to get your Gmail App Password:\n');
console.log('1. Go to: https://myaccount.google.com/apppasswords');
console.log('2. Select "Mail" and "Other (MedConsult)"');
console.log('3. Click Generate');
console.log('4. Copy the 16-character password\n');

rl.question('Paste your Gmail App Password here (remove spaces): ', async (appPassword) => {
  if (!appPassword || appPassword.length < 16) {
    console.log('\n❌ Invalid app password. Should be 16 characters.');
    rl.close();
    return;
  }

  console.log('\n🔍 Testing Gmail SMTP connection...\n');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: '429319lr@gmail.com',
      pass: appPassword.trim().replace(/\s/g, ''),
    },
  });

  try {
    // Test connection
    await transporter.verify();
    console.log('✅ SUCCESS! Gmail SMTP connection verified!\n');

    // Send test email
    console.log('📧 Sending test email...\n');
    
    const info = await transporter.sendMail({
      from: '"MedConsult Liberia" <429319lr@gmail.com>',
      to: '429319lr@gmail.com',
      subject: '✅ Gmail SMTP Test - Success!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px; background: #f0fdf4; border: 3px solid #059669; border-radius: 10px; max-width: 600px;">
          <h1 style="color: #059669; margin-top: 0;">🎉 Success!</h1>
          <p style="font-size: 18px; color: #333;">Your Gmail SMTP is now working perfectly!</p>
          <p style="font-size: 16px; color: #666;">MedConsult Liberia can now send password reset emails.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #059669; margin-top: 0;">✅ What's Working:</h3>
            <ul style="color: #333; line-height: 1.8;">
              <li>Email sending ✓</li>
              <li>Password reset emails ✓</li>
              <li>Professional templates ✓</li>
              <li>500 emails/day limit ✓</li>
            </ul>
          </div>
          <p style="font-size: 14px; color: #999; margin-bottom: 0;">Test email from MedConsult Liberia</p>
        </div>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('📬 Message ID:', info.messageId);
    console.log('\n🎉 CHECK YOUR INBOX at 429319lr@gmail.com\n');
    console.log('📝 Now update your .env.local with:');
    console.log('   SMTP_HOST=smtp.gmail.com');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_USER=429319lr@gmail.com');
    console.log('   SMTP_PASS=' + appPassword.trim().replace(/\s/g, ''));
    console.log('\n✅ Gmail SMTP is ready to use!');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\n🔧 Authentication failed. Please check:');
      console.error('   1. Did you enable 2-Step Verification?');
      console.error('   2. Did you generate an App Password (not your regular password)?');
      console.error('   3. Did you copy the App Password correctly?');
      console.error('\n📖 Guide: https://support.google.com/accounts/answer/185833');
    } else {
      console.error('\nFull error:', error);
    }
  }

  rl.close();
});

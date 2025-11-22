const nodemailer = require('nodemailer');
const fs = require('fs');

// Read .env.local manually
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

async function testEmail() {
  console.log('📧 Testing email configuration...\n');
  
  console.log('SMTP Settings:');
  console.log('Host:', envVars.SMTP_HOST);
  console.log('Port:', envVars.SMTP_PORT);
  console.log('User:', envVars.SMTP_USER);
  console.log('From:', envVars.SMTP_FROM);
  console.log('');

  const transporter = nodemailer.createTransport({
    host: envVars.SMTP_HOST,
    port: parseInt(envVars.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: envVars.SMTP_USER,
      pass: envVars.SMTP_PASS,
    },
  });

  console.log('🔄 Verifying SMTP connection...');
  
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
    
    console.log('📨 Sending test email...');
    const info = await transporter.sendMail({
      from: envVars.SMTP_FROM,
      to: '429319lr@gmail.com', // Test recipient
      subject: '✅ Test Email from MedConsult Liberia',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #10b981;">✅ Email System Working!</h2>
          <p>This is a test email to verify your email configuration is working correctly.</p>
          <p>If you received this, your email system is ready to send approval notifications!</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('\n📬 Check the inbox for: 429319lr@gmail.com');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.response) {
      console.error('Server response:', error.response);
    }
  }
}

testEmail();

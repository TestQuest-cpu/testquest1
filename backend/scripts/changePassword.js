require('dotenv').config();
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function askPasswordHidden(question) {
  return new Promise((resolve) => {
    process.stdout.write(question);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    const onData = (char) => {
      // Handle ctrl+c
      if (char === '\u0003') {
        process.exit();
      }
      // Handle enter
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
      }
      // Handle backspace
      else if (char === '\u007f') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
      }
      // Handle normal character
      else if (char >= ' ') {
        password += char;
        process.stdout.write('*');
      }
    };
    
    process.stdin.on('data', onData);
  });
}

async function changeAdminPassword() {
  try {
    console.log('🔐 Admin Password Change Tool');
    console.log('This tool allows you to change the admin password via API');
    console.log('');

    // Get credentials
    const username = await askQuestion('Enter admin username: ');
    const currentPassword = await askPasswordHidden('Enter current password: ');
    const newPassword = await askPasswordHidden('Enter new password: ');
    const confirmPassword = await askPasswordHidden('Confirm new password: ');

    if (newPassword !== confirmPassword) {
      console.log('❌ Passwords do not match!');
      rl.close();
      return;
    }

    if (newPassword.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      rl.close();
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://testquest-five.vercel.app';

    console.log('\n🔄 Logging in...');
    
    // Login to get admin token
    const loginResponse = await axios.post(`${baseUrl}/api/admin/login`, {
      username,
      password: currentPassword
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { token } = loginResponse.data;
    console.log('✅ Login successful');

    console.log('🔄 Changing password...');

    // Change password (this endpoint needs to be created)
    // For now, we'll output instructions
    console.log('');
    console.log('⚠️ Password change via API endpoint is not yet implemented.');
    console.log('Please use one of these methods instead:');
    console.log('');
    console.log('1. Use the database script:');
    console.log(`   cd backend && npm run update-admin ${username} "${newPassword}"`);
    console.log('');
    console.log('2. Use the admin dashboard (when password change feature is added)');
    console.log('');

  } catch (error) {
    if (error.response) {
      console.log(`❌ Error: ${error.response.data.message || error.response.statusText}`);
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  } finally {
    rl.close();
  }
}

// Run if called directly
if (require.main === module) {
  changeAdminPassword();
}

module.exports = changeAdminPassword;
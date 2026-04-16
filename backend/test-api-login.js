const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login endpoint...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'aniketbhosale1012@gmail.com',
      password: 'Admin@1212'
    });
    
    console.log('✅ Login Response:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\nToken:', response.data.token.substring(0, 30) + '...');
  } catch (error) {
    console.error('❌ Login Error:', error.response?.data || error.message);
  }
}

testLogin();

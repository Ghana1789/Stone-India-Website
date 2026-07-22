const axios = require('axios');

async function testAuth() {
  try {
    console.log('Logging in...');
    // Use the admin credentials from seed.js
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@stoneindia.com',
      password: 'Admin@123'
    });

    const token = loginRes.data.token;
    console.log('Login success - Token received.');

    // Fetch /auth/me
    console.log('Fetching /auth/me...');
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('/auth/me success:', meRes.data.user.email);

    // Fetch /admin/dashboard
    console.log('Fetching /admin/dashboard...');
    const adminRes = await axios.get('http://localhost:5000/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('/admin/dashboard success. Total Orders:', adminRes.data.data.stats.totalOrders);

  } catch (e) {
    if (e.response) {
      console.error(`Status: ${e.response.status}`, e.response.data);
    } else {
      console.error(e.message);
    }
  }
}

testAuth();

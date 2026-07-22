async function testAuth() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@stoneindia.com', password: 'Admin@123' })
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const data = await loginRes.json();
    const token = data.token;
    console.log('Login success - Token received.');

    console.log('Fetching /auth/me...');
    const meRes = await fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!meRes.ok) throw new Error(`/auth/me failed: ${meRes.status}`);
    const meData = await meRes.json();
    console.log('/auth/me success:', meData.user.email);

    console.log('Fetching /admin/dashboard...');
    const adminRes = await fetch('http://localhost:5000/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!adminRes.ok) throw new Error(`/admin/dashboard failed: ${adminRes.status}`);
    const adminData = await adminRes.json();
    console.log('/admin/dashboard success. Total Orders:', adminData.data.stats.totalOrders);

  } catch (e) {
    console.error(e.message);
  }
}

testAuth();

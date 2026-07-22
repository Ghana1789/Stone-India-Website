async function testClientAPI() {
  try {
    console.log('Logging in as Client...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'client@stoneindia.com', password: 'Client@123' })
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const { token } = await loginRes.json();
    console.log('Client Login successful.');

    const endpoints = [
      '/client/dashboard',
      '/client/orders',
      '/client/projects',
      '/client/invoices',
      '/client/tickets',
      '/client/documents'
    ];

    for (const ep of endpoints) {
      console.log(`Testing ${ep}...`);
      const res = await fetch(`http://localhost:5000/api${ep}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ ${ep} - Success (${Array.isArray(data.data) ? data.data.length + ' items' : 'Object returned'})`);
      } else {
        console.error(`❌ ${ep} - Failed with status ${res.status}`);
      }
    }
  } catch (e) {
    console.error(e.message);
  }
}

testClientAPI();

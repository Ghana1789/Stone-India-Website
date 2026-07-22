async function testEmployeeAPI() {
  try {
    console.log('Logging in as Employee (priya)...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@stoneindia.com', password: 'Employee@123' })
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const { token } = await loginRes.json();
    console.log('Employee Login successful.');

    const endpoints = [
      '/employee/dashboard',
      '/employee/tasks',
      '/employee/batches',
      '/employee/leave-requests',
      '/employee/timesheets',
      '/employee/projects',
      '/employee/expenses',
      '/employee/payslips',
      '/employee/training',
      '/employee/performance'
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

testEmployeeAPI();

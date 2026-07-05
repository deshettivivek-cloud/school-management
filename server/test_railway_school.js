async function testLiveRailway() {
  try {
    const RAILWAY_URL = 'https://abundant-vibrancy-production-d857.up.railway.app';
    
    console.log('1. Attempting login to Railway backend...');
    const loginRes = await fetch(`${RAILWAY_URL}/api/auth/super-admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_super@classorbit.in',
        password: 'TestPassword123!'
      })
    });
    
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    
    const token = loginData.data.token || loginData.data.session?.access_token;
    console.log('Login successful! Token received:', token ? token.substring(0,20)+'...' : 'UNDEFINED');
    console.log('Login Response:', JSON.stringify(loginData, null, 2));
    
    console.log('2. Attempting to create a test school on Railway...');
    const createRes = await fetch(`${RAILWAY_URL}/api/super-admin/schools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        schoolName: 'Railway Test School',
        schoolCode: 'RAIL12',
        academicYear: '2023-2024',
        principalName: 'Railway Principal',
        principalEmail: `railway_principal_${Date.now()}@test.com`,
        temporaryPassword: 'TestPassword123!'
      })
    });
    
    const createData = await createRes.json();
    if (!createRes.ok) throw new Error(`School creation failed: ${JSON.stringify(createData)}`);
    
    console.log('School creation successful!', createData);
    
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

testLiveRailway();

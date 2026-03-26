const http = require('http');

const makeRequest = (method, path, data = null, token = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: responseData
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

const runTests = async () => {
  try {
    console.log('🧪 TESTING BACKEND API\n');

    // Test 1: Health check
    console.log('1️⃣ Health Check...');
    let result = await makeRequest('GET', '/health');
    console.log(`Status: ${result.status}`);
    console.log(`Response: ${result.body}\n`);

    // Test 2: Signup
    console.log('2️⃣ User Signup...');
    result = await makeRequest('POST', '/api/auth/signup', {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'Test@123456'
    });
    console.log(`Status: ${result.status}`);
    console.log(`Response: ${result.body}`);
    const signupData = JSON.parse(result.body);
    const userId = signupData.userId;
    console.log(`New UserId: ${userId}\n`);

    // Test 3: Login
    console.log('3️⃣ User Login...');
    result = await makeRequest('POST', '/api/auth/login', {
      email: `test${Date.now() - 1000}@example.com`,
      password: 'Test@123456'
    });
    console.log(`Status: ${result.status}`);
    const loginData = JSON.parse(result.body);
    const token = loginData.token;
    console.log(`Token: ${token ? token.substring(0, 50) + '...' : 'ERROR'}\n`);

    // Use first signup token since we know that worked
    console.log('3️⃣ User Login (retry with new user)...');
    result = await makeRequest('POST', '/api/auth/signup', {
      name: 'Test User 2',
      email: `test2${Date.now()}@example.com`,
      password: 'Test@123456'
    });
    const newEmail = `test2${Date.now()}@example.com`;
    
    result = await makeRequest('POST', '/api/auth/login', {
      email: newEmail,
      password: 'Test@123456'
    });
    console.log(`Status: ${result.status}`);
    const loginData2 = JSON.parse(result.body);
    const token2 = loginData2.token;
    console.log(`Token received: ${token2 ? 'YES' : 'NO'}`);
    console.log(`Token length: ${token2?.length}\n`);

    if (token2) {
      // Test 4: Save Resume
      console.log('4️⃣ Save Resume...');
      result = await makeRequest('POST', '/api/resume', {
        name: 'Test User 2',
        email: newEmail,
        experience: [
          {
            company: 'Tech Corp',
            position: 'Software Engineer',
            duration: '2020-2023'
          }
        ]
      }, token2);
      console.log(`Status: ${result.status}`);
      console.log(`Response: ${result.body}\n`);

      // Test 5: Get Resume
      console.log('5️⃣ Get Resume...');
      result = await makeRequest('GET', '/api/resume', null, token2);
      console.log(`Status: ${result.status}`);
      console.log(`Response: ${result.body}\n`);

      // Test 6: Score Resume
      console.log('6️⃣ Score Resume...');
      result = await makeRequest('POST', '/api/ats/score', {
        jobDescription: 'Looking for a Software Engineer with JavaScript experience'
      }, token2);
      console.log(`Status: ${result.status}`);
      console.log(`Response: ${result.body}\n`);
    }

    console.log('✅ All tests completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error.message);
    process.exit(1);
  }
};

runTests();

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
          body: responseData,
          headers: res.headers
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
    console.log('🧪 DEBUG LOGIN ISSUE\n');

    // Signup
    console.log('Signing up...');
    const email = `debug${Date.now()}@example.com`;
    const password = 'TestPass123';
    
    let result = await makeRequest('POST', '/api/auth/signup', {
      name: 'Debug User',
      email: email,
      password: password
    });
    console.log(`Signup Status: ${result.status}`);
    console.log(`Signup Response: ${result.body}\n`);

    // Wait a bit
    await new Promise(r => setTimeout(r, 500));

    // Now try login with exact same credentials
    console.log(`Attempting login with email: ${email}`);
    console.log(`Password: ${password}`);
    
    result = await makeRequest('POST', '/api/auth/login', {
      email: email,
      password: password
    });
    console.log(`Login Status: ${result.status}`);
    console.log(`Login Response: ${result.body}\n`);

    if (result.status !== 200) {
      // Try with known working email
      console.log('Trying with known user from earlier...');
      result = await makeRequest('POST', '/api/auth/login', {
        email: 'jane@example.com',
        password: 'Test@123456'
      });
      console.log(`Status: ${result.status}`);
      console.log(`Response: ${result.body}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

runTests();

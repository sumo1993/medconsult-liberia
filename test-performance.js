// Simple performance test script
const testEndpoints = async () => {
  const endpoints = [
    'http://localhost:3000/api/client/stats',
    'http://localhost:3000/api/profile',
    'http://localhost:3000/api/client/assignments-in-progress',
  ];

  console.log('🚀 Testing API Performance...\n');

  for (const endpoint of endpoints) {
    const start = Date.now();
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
        }
      });
      const end = Date.now();
      const time = end - start;
      
      console.log(`✅ ${endpoint}`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Time: ${time}ms`);
      console.log(`   ${time < 100 ? '🟢 Fast' : time < 500 ? '🟡 Moderate' : '🔴 Slow'}\n`);
    } catch (error) {
      console.log(`❌ ${endpoint}`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
};

testEndpoints();

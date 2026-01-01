/**
 * Script de test de connexion à l'API
 * Usage: npx ts-node scripts/test-api-connection.ts
 */

import { apiClient } from '../lib/apiClient';
import { API_CONFIG } from '../lib/api.config';

async function testConnection() {
  console.log('🔍 Testing API Connection...');
  console.log('📍 API URL:', API_CONFIG.baseURL);
  console.log('');

  try {
    // Test health endpoint (if exists)
    console.log('1. Testing health endpoint...');
    const health = await apiClient.get('/health');
    console.log('✅ Health check passed:', health);
  } catch (error: any) {
    console.log('❌ Health check failed:', error.message);
  }

  console.log('');
  console.log('2. Testing auth endpoints availability...');
  
  try {
    // This should return 401 or validation error (not 404)
    await apiClient.post('/auth/login', {
      email: 'test@test.com',
      password: 'test'
    });
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 400) {
      console.log('✅ Auth endpoint is reachable (got expected error)');
    } else if (error.statusCode === 404) {
      console.log('❌ Auth endpoint not found (404)');
    } else {
      console.log('⚠️  Got error:', error.message);
    }
  }

  console.log('');
  console.log('3. Testing drivers endpoint...');
  
  try {
    // This should return 401 (unauthorized)
    await apiClient.get('/drivers/profile');
  } catch (error: any) {
    if (error.statusCode === 401) {
      console.log('✅ Drivers endpoint is reachable (requires auth)');
    } else if (error.statusCode === 404) {
      console.log('❌ Drivers endpoint not found (404)');
    } else {
      console.log('⚠️  Got error:', error.message);
    }
  }

  console.log('');
  console.log('✅ API connection test completed!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Make sure your backend is running on:', API_CONFIG.baseURL);
  console.log('2. Update .env if needed');
  console.log('3. Start using the services in your app!');
}

testConnection().catch(console.error);


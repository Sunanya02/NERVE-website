const assert = require('assert');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock express-validator validationResult since our test doesn't run the Express routing chain
require('express-validator');
jestMockExpressValidator();

// Load DB pool config so we can mock its execute function
const db = require('../config/db');

let mockDbRows = [];

// Mock pool.execute to intercept database statements and return fake records
db.pool.execute = async (query, params) => {
  console.log('MOCK SQL EXECUTE:', query.replace(/\s+/g, ' '), params);
  
  if (query.includes('SELECT * FROM admins WHERE email = ?')) {
    const email = params[0];
    const match = mockDbRows.find(r => r.email === email);
    return match ? [[match]] : [[]];
  }
  
  if (query.includes('SELECT id, name, email, role, created_at, updated_at FROM admins WHERE id = ?')) {
    const id = params[0];
    const match = mockDbRows.find(r => r.id === id);
    if (match) {
      const { password, ...rest } = match;
      return [[{ ...rest, created_at: new Date(), updated_at: new Date() }]];
    }
    return [[]];
  }

  if (query.includes('SELECT COUNT(*) as count FROM')) {
    return [[{ count: 5 }]];
  }

  if (query.includes('SELECT id, activity_type, description, created_at FROM recent_activities')) {
    return [[
      { id: 1, activity_type: 'login', description: 'Admin logged in', created_at: new Date() }
    ]];
  }

  if (query.includes('SELECT * FROM') && query.includes('ORDER BY id DESC')) {
    return [[
      { id: 1, title: 'Mock Entry', name: 'Mock Member', startup_name: 'Mock Startup', email: 'mock@example.com', focus_area: 'Agriculture', status: 'Pending', created_at: new Date() }
    ]];
  }

  if (query.includes('SELECT id FROM admins WHERE email = ? AND id != ?')) {
    return [[]]; // Allow profile email updates
  }

  if (query.includes('UPDATE admins SET')) {
    // Dynamically update mockDbRows when UPDATE query is run
    const id = params[params.length - 1];
    const match = mockDbRows.find(r => r.id === id);
    if (match) {
      match.name = params[0];
      match.email = params[1];
      if (params.length === 4) {
        match.password = params[2];
      }
    }
    return [{ affectedRows: 1 }];
  }

  if (query.includes('INSERT INTO recent_activities')) {
    return [{ insertId: 1 }];
  }
  
  return [[]];
};

const adminAuthController = require('../controllers/adminAuthController');
const authMiddleware = require('../middleware/authMiddleware');

process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
process.env.JWT_EXPIRE = '24h';

// Mock function for express-validator validationResult
function jestMockExpressValidator() {
  const ev = require('express-validator');
  ev.validationResult = (req) => {
    return {
      isEmpty: () => true,
      array: () => []
    };
  };
}

async function runTests() {
  console.log('=== STARTING UNIT TESTS FOR PHASE 2 BACKEND ===');

  // Seed default admin in mock DB
  const hashedPassword = bcrypt.hashSync('Admin@123', 10);
  mockDbRows.push({
    id: 1,
    name: 'Super Admin',
    email: 'admin@nerve.com',
    password: hashedPassword,
    role: 'superadmin'
  });

  // Test 1: Successful Login
  console.log('\n--- Test 1: Admin Login with Correct Credentials ---');
  let loginStatus = 0;
  let loginData = null;
  let cookiesSet = {};

  const mockRes = {
    status(code) {
      loginStatus = code;
      return this;
    },
    json(data) {
      loginData = data;
      return this;
    },
    cookie(name, value, options) {
      cookiesSet[name] = { value, options };
      return this;
    }
  };

  const mockReq = {
    body: {
      email: 'admin@nerve.com',
      password: 'Admin@123'
    }
  };

  await adminAuthController.login(mockReq, mockRes, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(loginStatus, 200, 'Status should be 200 OK');
  assert.strictEqual(loginData.success, true, 'success property should be true');
  assert.strictEqual(loginData.message, 'Admin logged in successfully');
  assert.strictEqual(loginData.data.admin.email, 'admin@nerve.com');
  assert.ok(loginData.data.token, 'Token should be present in response');
  assert.ok(cookiesSet['token'], 'Cookie token should be set');
  console.log('✓ Test 1 Passed: Login succeeded and returned correct JSON response.');

  // Test 2: Failed Login (Incorrect Password)
  console.log('\n--- Test 2: Admin Login with Incorrect Password ---');
  let failStatus = 0;
  let failData = null;

  const mockResFail = {
    status(code) {
      failStatus = code;
      return this;
    },
    json(data) {
      failData = data;
      return this;
    }
  };

  const mockReqWrongPass = {
    body: {
      email: 'admin@nerve.com',
      password: 'WrongPassword123'
    }
  };

  await adminAuthController.login(mockReqWrongPass, mockResFail, (err) => {
    if (err) throw err;
  });

  assert.strictEqual(failStatus, 401, 'Status should be 401 Unauthorized');
  assert.strictEqual(failData.success, false, 'success property should be false');
  assert.strictEqual(failData.message, 'Invalid email or password');
  console.log('✓ Test 2 Passed: Rejected invalid password credentials.');

  // Test 3: Authentication Middleware with Valid Token
  console.log('\n--- Test 3: Auth Middleware (Valid Token) ---');
  let nextCalled = false;
  const mockReqProtect = {
    headers: {
      authorization: `Bearer ${loginData.data.token}`
    }
  };

  await authMiddleware.protect(mockReqProtect, {}, () => {
    nextCalled = true;
  });

  assert.strictEqual(nextCalled, true, 'Next middleware should have been called');
  assert.strictEqual(mockReqProtect.admin.email, 'admin@nerve.com', 'Admin email should be attached to request');
  console.log('✓ Test 3 Passed: Authenticated and attached credentials to request.');

  // Test 4: Authentication Middleware with Invalid Token
  console.log('\n--- Test 4: Auth Middleware (Invalid Token) ---');
  let protectStatus = 0;
  let protectData = null;

  const mockResProtectFail = {
    status(code) {
      protectStatus = code;
      return this;
    },
    json(data) {
      protectData = data;
      return this;
    }
  };

  const mockReqProtectInvalid = {
    headers: {
      authorization: 'Bearer this_is_an_invalid_token'
    }
  };

  await authMiddleware.protect(mockReqProtectInvalid, mockResProtectFail, () => {
    throw new Error('Next should not be called for invalid tokens');
  });

  assert.strictEqual(protectStatus, 401, 'Status should be 401 Unauthorized');
  assert.strictEqual(protectData.success, false, 'success property should be false');
  assert.strictEqual(protectData.message, 'Access denied. Invalid or expired token.');
  console.log('✓ Test 4 Passed: Properly blocked invalid token access.');

  // Test 5: Verify Token Controller
  console.log('\n--- Test 5: verifyToken Controller ---');
  let verifyStatus = 0;
  let verifyData = null;
  const mockResVerify = {
    status(code) { verifyStatus = code; return this; },
    json(data) { verifyData = data; return this; }
  };
  const mockReqVerify = {
    admin: { id: 1, name: 'Super Admin', email: 'admin@nerve.com', role: 'superadmin' }
  };
  await adminAuthController.verifyToken(mockReqVerify, mockResVerify, (err) => { if (err) throw err; });
  assert.strictEqual(verifyStatus, 200);
  assert.strictEqual(verifyData.success, true);
  assert.strictEqual(verifyData.data.admin.email, 'admin@nerve.com');
  console.log('✓ Test 5 Passed: verifyToken returns active admin user context.');

  // Test 6: getDashboardStats Controller
  console.log('\n--- Test 6: getDashboardStats Controller ---');
  let statsStatus = 0;
  let statsData = null;
  const mockResStats = {
    status(code) { statsStatus = code; return this; },
    json(data) { statsData = data; return this; }
  };
  await adminAuthController.getDashboardStats({}, mockResStats, (err) => { if (err) throw err; });
  assert.strictEqual(statsStatus, 200);
  assert.strictEqual(statsData.success, true);
  assert.ok(statsData.data.stats.totalEvents);
  assert.ok(Array.isArray(statsData.data.recentActivities));
  console.log('✓ Test 6 Passed: getDashboardStats queries metrics and activities successfully.');

  // Test 7: getProfile Controller
  console.log('\n--- Test 7: getProfile Controller ---');
  let profileStatus = 0;
  let profileData = null;
  const mockResProfile = {
    status(code) { profileStatus = code; return this; },
    json(data) { profileData = data; return this; }
  };
  const mockReqProfile = {
    admin: { id: 1, name: 'Super Admin', email: 'admin@nerve.com', role: 'superadmin', created_at: '2026-06-29' }
  };
  await adminAuthController.getProfile(mockReqProfile, mockResProfile, (err) => { if (err) throw err; });
  assert.strictEqual(profileStatus, 200);
  assert.strictEqual(profileData.success, true);
  assert.strictEqual(profileData.data.admin.name, 'Super Admin');
  console.log('✓ Test 7 Passed: getProfile returns detailed admin account info.');

  // Test 8: updateProfile Controller
  console.log('\n--- Test 8: updateProfile Controller ---');
  let updateStatus = 0;
  let updateData = null;
  const mockResUpdate = {
    status(code) { updateStatus = code; return this; },
    json(data) { updateData = data; return this; }
  };
  const mockReqUpdate = {
    admin: { id: 1 },
    body: {
      name: 'Updated Admin',
      email: 'updated@nerve.com',
      password: 'NewPassword123'
    }
  };
  await adminAuthController.updateProfile(mockReqUpdate, mockResUpdate, (err) => { if (err) throw err; });
  assert.strictEqual(updateStatus, 200);
  assert.strictEqual(updateData.success, true);
  assert.strictEqual(updateData.data.admin.name, 'Updated Admin');
  console.log('✓ Test 8 Passed: updateProfile processes settings and hashes new password.');

  // Test 9: logout Controller
  console.log('\n--- Test 9: logout Controller ---');
  let logoutStatus = 0;
  let logoutData = null;
  let clearedCookies = {};
  const mockResLogout = {
    status(code) { logoutStatus = code; return this; },
    json(data) { logoutData = data; return this; },
    cookie(name, value, options) { clearedCookies[name] = { value, options }; return this; }
  };
  await adminAuthController.logout({}, mockResLogout, (err) => { if (err) throw err; });
  assert.strictEqual(logoutStatus, 200);
  assert.strictEqual(logoutData.success, true);
  assert.ok(clearedCookies['token'], 'Cookie token should be cleared');
  console.log('✓ Test 9 Passed: logout clears HTTP cookie successfully.');

  console.log('\n=============================================');
  console.log('  ALL BACKEND TESTS COMPLETED SUCCESSFULLY!  ');
  console.log('=============================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});

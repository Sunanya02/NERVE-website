const fs = require('fs');
const path = require('path');

const runPhase4Tests = async () => {
  console.log('=== STARTING E2E INTEGRATION TESTS FOR PHASE 4 ===');

  const BASE_URL = 'http://localhost:5000';
  let token = '';

  // 1. Log in to get token
  try {
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nerve.com', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) {
      throw new Error(`Login failed: ${loginData.message}`);
    }
    token = loginData.data.token;
    console.log('✓ Admin authenticated successfully.');
  } catch (error) {
    console.error('Authentication failed:', error.message);
    process.exit(1);
  }

  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`
  });

  const dummyPdfPath = path.join(__dirname, 'dummy_deck.pdf');
  fs.writeFileSync(dummyPdfPath, '%PDF-1.4 dummy pdf document content');

  try {
    // === TEST A: USERS ENDPOINTS ===
    console.log('\n--- Testing Users Endpoints ---');

    // Get all users
    const getUsersRes = await fetch(`${BASE_URL}/api/users`, {
      method: 'GET',
      headers: getHeaders()
    });
    const getUsersData = await getUsersRes.json();
    if (!getUsersRes.ok || !getUsersData.success) {
      throw new Error(`Failed to fetch users: ${getUsersData.message}`);
    }
    console.log(`✓ Retrieved ${getUsersData.data.length} users successfully.`);

    // If users exist, test update and toggle status
    if (getUsersData.data.length > 0) {
      const testUser = getUsersData.data[0];
      const userId = testUser.id;

      // Edit User
      const editUserRes = await fetch(`${BASE_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Updated Mentor Name',
          email: testUser.email,
          role: testUser.role
        })
      });
      const editUserData = await editUserRes.json();
      if (!editUserRes.ok || !editUserData.success) {
        throw new Error(`Failed to edit user: ${editUserData.message}`);
      }
      console.log(`✓ User ID ${userId} updated successfully.`);

      // Toggle status (Activate/Deactivate)
      const toggleStatusRes = await fetch(`${BASE_URL}/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      const toggleStatusData = await toggleStatusRes.json();
      if (!toggleStatusRes.ok || !toggleStatusData.success) {
        throw new Error(`Failed to toggle user status: ${toggleStatusData.message}`);
      }
      console.log(`✓ User status toggled successfully. is_active = ${toggleStatusData.data.is_active}`);

      // Restore status
      await fetch(`${BASE_URL}/api/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: getHeaders()
      });
    }

    // === TEST B: APPLICATIONS ENDPOINTS ===
    console.log('\n--- Testing Applications Endpoints ---');

    // Get all applications
    const getAppsRes = await fetch(`${BASE_URL}/api/applications`, {
      method: 'GET',
      headers: getHeaders()
    });
    const getAppsData = await getAppsRes.json();
    if (!getAppsRes.ok || !getAppsData.success) {
      throw new Error(`Failed to fetch applications: ${getAppsData.message}`);
    }
    console.log(`✓ Retrieved ${getAppsData.data.length} OCP applications.`);

    if (getAppsData.data.length > 0) {
      const testApp = getAppsData.data[0];
      const appId = testApp.id;

      // Update Application status
      const updateStatusRes = await fetch(`${BASE_URL}/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'Approved' })
      });
      const updateStatusData = await updateStatusRes.json();
      if (!updateStatusRes.ok || !updateStatusData.success) {
        throw new Error(`Failed to update application status: ${updateStatusData.message}`);
      }
      console.log(`✓ Application ID ${appId} status updated to Approved.`);

      // Upload Pitch Deck PDF
      const pdfForm = new FormData();
      const pdfBuffer = fs.readFileSync(dummyPdfPath);
      const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
      pdfForm.append('pitch_deck', pdfBlob, 'dummy_deck.pdf');

      const uploadDeckRes = await fetch(`${BASE_URL}/api/applications/${appId}/pitch-deck`, {
        method: 'POST',
        headers: getHeaders(),
        body: pdfForm
      });
      const uploadDeckData = await uploadDeckRes.json();
      if (!uploadDeckRes.ok || !uploadDeckData.success) {
        throw new Error(`Failed to upload pitch deck PDF: ${uploadDeckData.message}`);
      }
      console.log(`✓ Pitch deck PDF uploaded successfully for Application ${appId}.`);
      console.log(`  File URL: ${uploadDeckData.data.pitch_deck_url}`);
    }

    console.log('\n======================================================');
    console.log('  ALL PHASE 4 END-TO-END INTEGRATION TESTS PASSED!    ');
    console.log('======================================================');

    if (fs.existsSync(dummyPdfPath)) fs.unlinkSync(dummyPdfPath);
    process.exit(0);

  } catch (error) {
    console.error('Phase 4 Test Execution Failed:', error.message);
    if (fs.existsSync(dummyPdfPath)) fs.unlinkSync(dummyPdfPath);
    process.exit(1);
  }
};

runPhase4Tests();

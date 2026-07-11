const fs = require('fs');
const path = require('path');

const runApiTests = async () => {
  console.log('=== STARTING END-TO-END API INTEGRATION TESTS ===');

  const BASE_URL = 'http://localhost:5000';
  let token = '';

  // 1. Authenticate to get JWT token
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
    console.error('Authentication test failed:', error.message);
    process.exit(1);
  }

  // Create a dummy image file for upload tests
  const dummyFileDir = path.join(__dirname, '..', 'scratch');
  const dummyFilePath = path.join(dummyFileDir, 'dummy.png');
  fs.writeFileSync(dummyFilePath, 'dummy image content');

  // Helper to construct request headers
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`
  });

  try {
    // === TEST A: EVENTS ENDPOINTS ===
    console.log('\n--- Testing Events Endpoints ---');
    
    // Create Event
    const eventForm = new FormData();
    eventForm.append('title', 'API Test Event');
    eventForm.append('event_date', '2026-10-10');
    eventForm.append('location', 'API Test Lab');
    eventForm.append('description', 'API Test Description');
    eventForm.append('is_published', '1');
    
    const fileBuffer = fs.readFileSync(dummyFilePath);
    const fileBlob = new Blob([fileBuffer], { type: 'image/png' });
    eventForm.append('image', fileBlob, 'dummy.png');

    const createEventRes = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: getHeaders(),
      body: eventForm
    });
    const createEventData = await createEventRes.json();
    
    if (!createEventRes.ok || !createEventData.success) {
      throw new Error(`Failed to create event: ${createEventData.message}`);
    }
    const eventId = createEventData.data.id;
    console.log(`✓ Event created successfully via API, ID: ${eventId}`);
    console.log(`  Uploaded image served at: ${createEventData.data.image_url}`);

    // Toggle publish
    const togglePublishRes = await fetch(`${BASE_URL}/api/events/${eventId}/toggle-publish`, {
      method: 'PATCH',
      headers: getHeaders()
    });
    const togglePublishData = await togglePublishRes.json();
    if (!togglePublishRes.ok || !togglePublishData.success) {
      throw new Error(`Failed to toggle publish status: ${togglePublishData.message}`);
    }
    console.log(`✓ Event publication status toggled: is_published = ${togglePublishData.data.is_published}`);

    // Update Event
    const updateEventForm = new FormData();
    updateEventForm.append('title', 'API Test Event (Updated)');
    updateEventForm.append('event_date', '2026-11-11');
    updateEventForm.append('location', 'Updated Location');
    updateEventForm.append('description', 'Updated Description');
    updateEventForm.append('is_published', '0');

    const updateEventRes = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: updateEventForm
    });
    const updateEventData = await updateEventRes.json();
    if (!updateEventRes.ok || !updateEventData.success) {
      throw new Error(`Failed to update event: ${updateEventData.message}`);
    }
    console.log(`✓ Event updated successfully via API`);


    // === TEST B: NEWS ENDPOINTS ===
    console.log('\n--- Testing News Endpoints ---');

    // Create News
    const newsForm = new FormData();
    newsForm.append('title', 'API Test Headline');
    newsForm.append('content', 'API Test News Content');
    newsForm.append('thumbnail', fileBlob, 'dummy-thumb.png');

    const createNewsRes = await fetch(`${BASE_URL}/api/news`, {
      method: 'POST',
      headers: getHeaders(),
      body: newsForm
    });
    const createNewsData = await createNewsRes.json();
    if (!createNewsRes.ok || !createNewsData.success) {
      throw new Error(`Failed to create news: ${createNewsData.message}`);
    }
    const newsId = createNewsData.data.id;
    console.log(`✓ News article created successfully via API, ID: ${newsId}`);
    console.log(`  Thumbnail served at: ${createNewsData.data.thumbnail_url}`);


    // === TEST C: GALLERY ENDPOINTS ===
    console.log('\n--- Testing Gallery Endpoints ---');

    // Create Gallery entry
    const galleryForm = new FormData();
    galleryForm.append('title', 'API Test Photo');
    galleryForm.append('category', 'Labs');
    galleryForm.append('image', fileBlob, 'dummy-gallery.png');

    const createGalleryRes = await fetch(`${BASE_URL}/api/gallery`, {
      method: 'POST',
      headers: getHeaders(),
      body: galleryForm
    });
    const createGalleryData = await createGalleryRes.json();
    if (!createGalleryRes.ok || !createGalleryData.success) {
      throw new Error(`Failed to create gallery item: ${createGalleryData.message}`);
    }
    const galleryId = createGalleryData.data.id;
    console.log(`✓ Gallery photo uploaded successfully via API, ID: ${galleryId}`);


    // === TEST D: CONTACTS ENDPOINTS ===
    console.log('\n--- Testing Contact Message Endpoints ---');

    // Fetch contact list
    const getContactsRes = await fetch(`${BASE_URL}/api/contacts`, {
      method: 'GET',
      headers: getHeaders()
    });
    const getContactsData = await getContactsRes.json();
    if (!getContactsRes.ok || !getContactsData.success) {
      throw new Error(`Failed to fetch contact list: ${getContactsData.message}`);
    }
    console.log(`✓ Retrieved ${getContactsData.data.length} contact submissions.`);

    // If there is seeded messages, test update and delete
    if (getContactsData.data.length > 0) {
      const contactMsgId = getContactsData.data[0].id;
      
      // Update message status
      const updateContactStatusRes = await fetch(`${BASE_URL}/api/contacts/${contactMsgId}/status`, {
        method: 'PATCH',
        headers: {
          ...getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'read' })
      });
      const updateContactStatusData = await updateContactStatusRes.json();
      if (!updateContactStatusRes.ok || !updateContactStatusData.success) {
        throw new Error(`Failed to update contact status: ${updateContactStatusData.message}`);
      }
      console.log(`✓ Contact message status updated successfully.`);
    }


    // === TEST E: DELETIONS & Disk Cleanup Verification ===
    console.log('\n--- Testing Deletions & Cleanup ---');

    // Delete Event
    const deleteEventRes = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const deleteEventData = await deleteEventRes.json();
    if (!deleteEventRes.ok || !deleteEventData.success) {
      throw new Error(`Failed to delete event: ${deleteEventData.message}`);
    }
    console.log(`✓ Event ID ${eventId} deleted successfully.`);

    // Delete News
    const deleteNewsRes = await fetch(`${BASE_URL}/api/news/${newsId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const deleteNewsData = await deleteNewsRes.json();
    if (!deleteNewsRes.ok || !deleteNewsData.success) {
      throw new Error(`Failed to delete news: ${deleteNewsData.message}`);
    }
    console.log(`✓ News ID ${newsId} deleted successfully.`);

    // Delete Gallery
    const deleteGalleryRes = await fetch(`${BASE_URL}/api/gallery/${galleryId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const deleteGalleryData = await deleteGalleryRes.json();
    if (!deleteGalleryRes.ok || !deleteGalleryData.success) {
      throw new Error(`Failed to delete gallery item: ${deleteGalleryData.message}`);
    }
    console.log(`✓ Gallery ID ${galleryId} deleted successfully.`);

    console.log('\n======================================================');
    console.log('  ALL END-TO-END API CRUD INTEGRATION TESTS PASSED!   ');
    console.log('======================================================');
    
    // Clean up local temp file
    if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    process.exit(0);

  } catch (error) {
    console.error('API Test Execution Failed:', error.message);
    if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);
    process.exit(1);
  }
};

runApiTests();

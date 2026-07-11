const assert = require('assert');
const { pool } = require('../config/db');

async function runCrudTests() {
  console.log('=== STARTING INTEGRATION TESTS FOR PHASE 3 CRUD MODULES ===');

  try {
    // Test 1: Event CRUD
    console.log('\n--- Test 1: Event CRUD Queries ---');
    // Create
    const [insertEvent] = await pool.execute(
      'INSERT INTO events (title, description, event_date, location, image_url, is_published) VALUES (?, ?, ?, ?, ?, ?)',
      ['Test Hackathon 2026', 'Test description', '2026-12-31', 'Test Lab, Pune', 'uploads/test.png', 1]
    );
    const eventId = insertEvent.insertId;
    assert.ok(eventId, 'Event should be created with a valid auto-increment ID');
    console.log(`✓ Event created successfully with ID: ${eventId}`);

    // Read
    const [events] = await pool.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    assert.strictEqual(events.length, 1);
    assert.strictEqual(events[0].title, 'Test Hackathon 2026');
    assert.strictEqual(events[0].is_published, 1);
    console.log('✓ Event retrieved and matched successfully.');

    // Update
    await pool.execute(
      'UPDATE events SET title = ?, is_published = ? WHERE id = ?',
      ['Updated Test Hackathon', 0, eventId]
    );
    const [updatedEvents] = await pool.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    assert.strictEqual(updatedEvents[0].title, 'Updated Test Hackathon');
    assert.strictEqual(updatedEvents[0].is_published, 0);
    console.log('✓ Event updated successfully.');

    // Delete
    await pool.execute('DELETE FROM events WHERE id = ?', [eventId]);
    const [afterDeleteEvents] = await pool.execute('SELECT * FROM events WHERE id = ?', [eventId]);
    assert.strictEqual(afterDeleteEvents.length, 0);
    console.log('✓ Event deleted successfully.');


    // Test 2: News CRUD
    console.log('\n--- Test 2: News CRUD Queries ---');
    // Create
    const [insertNews] = await pool.execute(
      'INSERT INTO news (title, content, thumbnail_url) VALUES (?, ?, ?)',
      ['Test Headline 2026', 'Test content details', 'uploads/news-thumb.png']
    );
    const newsId = insertNews.insertId;
    assert.ok(newsId, 'News article should be created with a valid ID');
    console.log(`✓ News article created with ID: ${newsId}`);

    // Read & Update
    await pool.execute('UPDATE news SET title = ? WHERE id = ?', ['Updated Headline', newsId]);
    const [news] = await pool.execute('SELECT * FROM news WHERE id = ?', [newsId]);
    assert.strictEqual(news[0].title, 'Updated Headline');
    console.log('✓ News article updated and verified.');

    // Delete
    await pool.execute('DELETE FROM news WHERE id = ?', [newsId]);
    const [afterDeleteNews] = await pool.execute('SELECT * FROM news WHERE id = ?', [newsId]);
    assert.strictEqual(afterDeleteNews.length, 0);
    console.log('✓ News article deleted successfully.');


    // Test 3: Gallery CRUD
    console.log('\n--- Test 3: Gallery CRUD Queries ---');
    // Create
    const [insertGallery] = await pool.execute(
      'INSERT INTO gallery (title, image_url, category) VALUES (?, ?, ?)',
      ['Test Album Photo', 'uploads/gallery-pic.png', 'Labs']
    );
    const galleryId = insertGallery.insertId;
    assert.ok(galleryId);
    console.log(`✓ Gallery photo uploaded with ID: ${galleryId}`);

    // Read
    const [gallery] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [galleryId]);
    assert.strictEqual(gallery[0].category, 'Labs');
    console.log('✓ Gallery photo category verified.');

    // Delete
    await pool.execute('DELETE FROM gallery WHERE id = ?', [galleryId]);
    const [afterDeleteGallery] = await pool.execute('SELECT * FROM gallery WHERE id = ?', [galleryId]);
    assert.strictEqual(afterDeleteGallery.length, 0);
    console.log('✓ Gallery photo deleted successfully.');


    // Test 4: Contact CRUD
    console.log('\n--- Test 4: Contact CRUD Queries ---');
    // Create contact message
    const [insertContact] = await pool.execute(
      'INSERT INTO contact_messages (name, email, subject, message, status) VALUES (?, ?, ?, ?, ?)',
      ['Tester Name', 'test@nerve.com', 'Test Subject', 'Hello tester message body', 'unread']
    );
    const contactId = insertContact.insertId;
    assert.ok(contactId);
    console.log(`✓ Contact message created with ID: ${contactId}`);

    // Update status
    await pool.execute('UPDATE contact_messages SET status = ? WHERE id = ?', ['read', contactId]);
    const [contacts] = await pool.execute('SELECT * FROM contact_messages WHERE id = ?', [contactId]);
    assert.strictEqual(contacts[0].status, 'read');
    console.log('✓ Contact message status marked as read.');

    // Delete
    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [contactId]);
    const [afterDeleteContacts] = await pool.execute('SELECT * FROM contact_messages WHERE id = ?', [contactId]);
    assert.strictEqual(afterDeleteContacts.length, 0);
    console.log('✓ Contact message deleted successfully.');

    console.log('\n======================================================');
    console.log('  ALL PHASE 3 DATABASE CRUD INTEGRATION TESTS PASSED!  ');
    console.log('======================================================');
    process.exit(0);
  } catch (error) {
    console.error('Integration Tests Failed:', error);
    process.exit(1);
  }
}

runCrudTests();

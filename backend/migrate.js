const { pool } = require('./config/db');

const runMigration = async () => {
  try {
    console.log('Starting Phase 3 & 4 database migrations...');

    // 1. Check/Add columns to 'events' table
    const [eventCols] = await pool.execute('SHOW COLUMNS FROM events');
    const eventColNames = eventCols.map(col => col.Field.toLowerCase());

    if (!eventColNames.includes('image_url')) {
      console.log('Adding "image_url" to "events" table...');
      await pool.execute('ALTER TABLE events ADD COLUMN image_url VARCHAR(255) DEFAULT NULL');
    } else {
      console.log('"image_url" already exists in "events" table.');
    }

    if (!eventColNames.includes('is_published')) {
      console.log('Adding "is_published" to "events" table...');
      await pool.execute('ALTER TABLE events ADD COLUMN is_published TINYINT(1) DEFAULT 1');
    } else {
      console.log('"is_published" already exists in "events" table.');
    }

    // 2. Check/Add columns to 'news' table
    const [newsCols] = await pool.execute('SHOW COLUMNS FROM news');
    const newsColNames = newsCols.map(col => col.Field.toLowerCase());

    if (!newsColNames.includes('thumbnail_url')) {
      console.log('Adding "thumbnail_url" to "news" table...');
      await pool.execute('ALTER TABLE news ADD COLUMN thumbnail_url VARCHAR(255) DEFAULT NULL');
    } else {
      console.log('"thumbnail_url" already exists in "news" table.');
    }

    // 3. Check/Add columns to 'gallery' table
    const [galleryCols] = await pool.execute('SHOW COLUMNS FROM gallery');
    const galleryColNames = galleryCols.map(col => col.Field.toLowerCase());

    if (!galleryColNames.includes('category')) {
      console.log('Adding "category" to "gallery" table...');
      await pool.execute("ALTER TABLE gallery ADD COLUMN category VARCHAR(100) DEFAULT 'General'");
    } else {
      console.log('"category" already exists in "gallery" table.');
    }

    // 4. Check/Add columns to 'users' table (Phase 4)
    const [userCols] = await pool.execute('SHOW COLUMNS FROM users');
    const userColNames = userCols.map(col => col.Field.toLowerCase());

    if (!userColNames.includes('password')) {
      console.log('Adding "password" to "users" table...');
      await pool.execute('ALTER TABLE users ADD COLUMN password VARCHAR(255) NOT NULL AFTER email');
    } else {
      console.log('"password" already exists in "users" table.');
    }

    if (!userColNames.includes('is_active')) {
      console.log('Adding "is_active" to "users" table...');
      await pool.execute('ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1');
    } else {
      console.log('"is_active" already exists in "users" table.');
    }

    // 5. Check/Add columns to 'applications' table (Phase 4)
    const [appCols] = await pool.execute('SHOW COLUMNS FROM applications');
    const appColNames = appCols.map(col => col.Field.toLowerCase());

    if (!appColNames.includes('pitch_deck_url')) {
      console.log('Adding "pitch_deck_url" to "applications" table...');
      await pool.execute('ALTER TABLE applications ADD COLUMN pitch_deck_url VARCHAR(255) DEFAULT NULL');
    } else {
      console.log('"pitch_deck_url" already exists in "applications" table.');
    }

    console.log('Database migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database migration failed:', error.message);
    process.exit(1);
  }
};

runMigration();

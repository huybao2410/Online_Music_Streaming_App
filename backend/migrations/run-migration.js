// Run database migrations
const pool = require('../src/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('Starting database migration...');

    // Add cover_url to playlists
    console.log('Adding cover_url column to playlists table...');
    await pool.query(`
      ALTER TABLE playlists 
      ADD COLUMN cover_url VARCHAR(255) NULL AFTER description
    `);
    console.log('✓ Added cover_url to playlists');

    // Add avatar_url to users
    console.log('Adding avatar_url column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN avatar_url VARCHAR(255) NULL AFTER username
    `);
    console.log('✓ Added avatar_url to users');

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    // Check if column already exists
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠ Columns already exist, skipping migration');
      process.exit(0);
    }
    
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

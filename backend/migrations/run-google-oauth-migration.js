// Run Google OAuth migration
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function runMigration() {
  try {
    console.log('🚀 Starting Google OAuth migration...');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'add_google_oauth_support.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split by semicolon and filter empty statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));

    // Execute each statement
    for (const statement of statements) {
      if (statement) {
        console.log(`\n📝 Executing: ${statement.substring(0, 80)}...`);
        await pool.query(statement);
        console.log('✅ Success');
      }
    }

    // Verify the changes
    console.log('\n🔍 Verifying migration...');
    const [columns] = await pool.query(`
      SELECT 
        COLUMN_NAME, 
        DATA_TYPE, 
        IS_NULLABLE, 
        COLUMN_DEFAULT,
        COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME IN ('auth_provider', 'google_id', 'password_hash')
    `);

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 Updated columns:');
    console.table(columns);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

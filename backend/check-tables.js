// Script to check database table structures
const pool = require('./src/config/db');

async function checkTables() {
  try {
    console.log('=== Checking Artists Table ===');
    const [artistsColumns] = await pool.query('DESCRIBE artists');
    console.log('Artists columns:');
    artistsColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Key ? `[${col.Key}]` : ''}`);
    });

    console.log('\n=== Checking Songs Table ===');
    const [songsColumns] = await pool.query('DESCRIBE songs');
    console.log('Songs columns:');
    songsColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Key ? `[${col.Key}]` : ''}`);
    });

    console.log('\n=== Sample Query Test ===');
    const [result] = await pool.query(`
      SELECT a.*, COUNT(DISTINCT s.song_id) as song_count
      FROM artists a
      LEFT JOIN songs s ON a.artist_id = s.artist_id
      GROUP BY a.artist_id
      LIMIT 5
    `);
    console.log('Query successful! Sample results:', result.length, 'rows');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('SQL:', error.sql);
    process.exit(1);
  }
}

checkTables();

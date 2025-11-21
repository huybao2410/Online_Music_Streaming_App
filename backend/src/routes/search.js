// backend/src/routes/search.js
const express = require('express');
const pool = require('../config/db');

const router = express.Router();

// Search suggestions endpoint - for autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.json({
        success: true,
        songs: [],
        artists: [],
        albums: []
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const limitNum = parseInt(limit);

    // Search songs
    const [songs] = await pool.query(
      `SELECT 
        s.song_id as id,
        s.title,
        s.audio_url,
        s.cover_url,
        s.duration,
        a.name as artist_name,
        a.artist_id as artist_id
      FROM songs s
      LEFT JOIN artists a ON s.artist_id = a.artist_id
      WHERE s.title LIKE ?
      ORDER BY s.title ASC
      LIMIT ?`,
      [searchTerm, limitNum]
    );

    // Search artists
    const [artists] = await pool.query(
      `SELECT 
        artist_id as id,
        name,
        avatar_url
      FROM artists
      WHERE name LIKE ?
      ORDER BY name ASC
      LIMIT ?`,
      [searchTerm, limitNum]
    );

    // Search albums from albums table (giống Flutter)
    const [albums] = await pool.query(
      `SELECT 
        a.album_id as id,
        a.name,
        a.cover_url,
        a.description,
        a.release_date,
        ar.name as artist_name,
        ar.artist_id
      FROM albums a
      LEFT JOIN artists ar ON a.artist_id = ar.artist_id
      WHERE a.name LIKE ? OR a.description LIKE ? OR ar.name LIKE ?
      ORDER BY a.album_id DESC
      LIMIT ?`,
      [searchTerm, searchTerm, searchTerm, limitNum]
    );

    return res.json({
      success: true,
      songs,
      artists,
      albums
    });

  } catch (error) {
    console.error('Error searching:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm'
    });
  }
});

// Full search endpoint
router.get('/', async (req, res) => {
  try {
    const { query, type = 'all', page = 1, limit = 20 } = req.query;

    if (!query || query.trim().length === 0) {
      return res.json({
        success: true,
        songs: [],
        artists: [],
        albums: [],
        total: 0
      });
    }

    const searchTerm = `%${query.trim()}%`;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);

    let songs = [], artists = [], albums = [];
    let totalSongs = 0, totalArtists = 0, totalAlbums = 0;

    if (type === 'all' || type === 'songs') {
      // Search songs (giống Flutter: tìm theo title, artist, genre)
      const [songResults] = await pool.query(
        `SELECT 
          s.song_id as id,
          s.title,
          s.duration,
          s.audio_url,
          s.cover_url,
          a.name as artist_name,
          a.artist_id as artist_id,
          g.name as genre_name
        FROM songs s
        LEFT JOIN artists a ON s.artist_id = a.artist_id
        LEFT JOIN genres g ON s.genre_id = g.genre_id
        WHERE s.title LIKE ? OR a.name LIKE ? OR g.name LIKE ?
        ORDER BY s.song_id DESC
        LIMIT ? OFFSET ?`,
        [searchTerm, searchTerm, searchTerm, limitNum, offset]
      );

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total
        FROM songs s
        LEFT JOIN artists a ON s.artist_id = a.artist_id
        LEFT JOIN genres g ON s.genre_id = g.genre_id
        WHERE s.title LIKE ? OR a.name LIKE ? OR g.name LIKE ?`,
        [searchTerm, searchTerm, searchTerm]
      );

      songs = songResults;
      totalSongs = countResult[0].total;
    }

    if (type === 'all' || type === 'artists') {
      // Search artists
      const [artistResults] = await pool.query(
        `SELECT 
          artist_id as id,
          name,
          avatar_url,
          bio
        FROM artists
        WHERE name LIKE ?
        ORDER BY name ASC
        LIMIT ? OFFSET ?`,
        [searchTerm, limitNum, offset]
      );

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM artists WHERE name LIKE ?`,
        [searchTerm]
      );

      artists = artistResults;
      totalArtists = countResult[0].total;
    }

    if (type === 'all' || type === 'albums') {
      // Search albums from albums table (giống Flutter)
      const [albumResults] = await pool.query(
        `SELECT 
          a.album_id as id,
          a.name,
          a.cover_url,
          a.description,
          a.release_date,
          ar.name as artist_name,
          ar.artist_id
        FROM albums a
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id
        WHERE a.name LIKE ? OR a.description LIKE ? OR ar.name LIKE ?
        ORDER BY a.album_id DESC
        LIMIT ? OFFSET ?`,
        [searchTerm, searchTerm, searchTerm, limitNum, offset]
      );

      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total
        FROM albums a
        LEFT JOIN artists ar ON a.artist_id = ar.artist_id
        WHERE a.name LIKE ? OR a.description LIKE ? OR ar.name LIKE ?`,
        [searchTerm, searchTerm, searchTerm]
      );

      albums = albumResults;
      totalAlbums = countResult[0].total;
    }

    return res.json({
      success: true,
      query: query.trim(),
      songs,
      artists,
      albums,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        totalSongs,
        totalArtists,
        totalAlbums
      }
    });

  } catch (error) {
    console.error('Error in full search:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tìm kiếm'
    });
  }
});

module.exports = router;

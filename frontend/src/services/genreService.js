export const getGenres = async () => {
  try {
    const res = await fetch(
      "http://localhost:8081/music_API/online_music/song/get_genres.php"
    );

    const data = await res.json();

    return data.genres || [];
  } catch (err) {
    console.error("❌ Lỗi getGenres:", err);
    return [];
  }
};

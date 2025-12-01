const API_BASE_URL = "http://localhost:8081/music_API/online_music/song/get_songs.php";

export const getGenres = async () => {
  try {
    const res = await fetch(API_BASE_URL);
    const data = await res.json();

    if (!data.status || !Array.isArray(data.songs)) return [];

    // Rút trích danh sách thể loại
    const uniqueGenres = Array.from(
      new Set(data.songs.map((s) => s.genre))
    );

    // format lại
    return uniqueGenres.map((name, index) => ({
      id: index + 1,
      name,
    }));
  } catch (err) {
    console.error("Lỗi load thể loại:", err);
    return [];
  }
};
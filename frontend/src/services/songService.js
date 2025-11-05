import axios from "axios";

export const getSongs = async () => {
  try {
    const response = await axios.get("http://localhost/music_API/online_music/list_songs_web.php");
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài hát:", error);
    return [];
  }
};

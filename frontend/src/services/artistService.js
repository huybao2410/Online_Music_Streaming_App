import api from "./api";

export const getAllArtists = async () => {
  try {
    const response = await api.get("/get_artists.php");
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nghệ sĩ:", error);
    return [];
  }
};
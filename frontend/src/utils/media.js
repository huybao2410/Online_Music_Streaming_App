export const fixMediaUrl = (url) => {
  if (!url) return "";

  // Android emulator → Web
  if (url.includes("10.0.2.2:8081")) {
    return url.replace("10.0.2.2:8081", "localhost:8081");
  }

  return url;
};
export const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "";
export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://api.mrbikedoctor.cloud/bikedoctor";

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  return `${IMAGE_BASE_URL}${imagePath}`;
};

export const getAuthToken = () => localStorage.getItem("adminToken");

export const InfoRow = ({ label, value, mono = false }) => null; // placeholder — defined per-component

import axios from "axios";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "https://api.mrbikedoctor.cloud/bikedoctor";

export const getAuthToken = () => localStorage.getItem("adminToken");

// Shared request helper for every Preferences module (Campaigns, Promo
// Codes, Rewards & Referral rules, Legal, App Content). None of these
// endpoints exist on the backend yet — this phase only wires the frontend
// so requests fail gracefully (surfaced via each page's error state) until
// the corresponding routes are implemented server-side. No UI change should
// be needed when that happens.
export const prefApiRequest = async (method, endpoint, data, isFormData = false) => {
  const headers = {};
  const token = getAuthToken();
  if (token) headers.token = token;
  if (isFormData) headers["Content-Type"] = "multipart/form-data";

  const response = await axios({
    method,
    url: `${API_BASE_URL}${endpoint}`,
    data,
    headers,
    withCredentials: true,
  });
  return response.data;
};

import { prefApiRequest } from "./prefApiClient";

const BANNERS_BASE = "/preferences/app-banners";
const FAQ_BASE = "/preferences/faq";
const SETTINGS_BASE = "/preferences/app-settings";

// App-content banners (home / popup / announcement) are one collection
// discriminated by `bannerType`, mirroring the reward-rules pattern —
// keeps three near-identical tabs on one API surface instead of three.
export const BANNER_TYPES = {
  HOME: "home",
  POPUP: "popup",
  ANNOUNCEMENT: "announcement",
};

export const getAppBanners = (bannerType, params = {}) =>
  prefApiRequest("GET", `${BANNERS_BASE}/${bannerType}`, { params });
export const createAppBanner = (bannerType, formData) =>
  prefApiRequest("POST", `${BANNERS_BASE}/${bannerType}`, formData, true);
export const updateAppBanner = (bannerType, id, formData) =>
  prefApiRequest("PUT", `${BANNERS_BASE}/${bannerType}/${id}`, formData, true);
export const deleteAppBanner = (bannerType, id) => prefApiRequest("DELETE", `${BANNERS_BASE}/${bannerType}/${id}`);
export const toggleAppBannerStatus = (bannerType, id, status) =>
  prefApiRequest("PATCH", `${BANNERS_BASE}/${bannerType}/${id}/status`, { status });
export const bulkDeleteAppBanners = (bannerType, ids) =>
  prefApiRequest("POST", `${BANNERS_BASE}/${bannerType}/bulk-delete`, { ids });

// FAQ
export const getFaqs = (params = {}) => prefApiRequest("GET", FAQ_BASE, { params });
export const createFaq = (payload) => prefApiRequest("POST", FAQ_BASE, payload);
export const updateFaq = (id, payload) => prefApiRequest("PUT", `${FAQ_BASE}/${id}`, payload);
export const deleteFaq = (id) => prefApiRequest("DELETE", `${FAQ_BASE}/${id}`);
export const toggleFaqStatus = (id, status) => prefApiRequest("PATCH", `${FAQ_BASE}/${id}/status`, { status });
export const bulkDeleteFaqs = (ids) => prefApiRequest("POST", `${FAQ_BASE}/bulk-delete`, { ids });

// App settings singleton — support details, social links, website/store links
export const getAppSettings = () => prefApiRequest("GET", SETTINGS_BASE);
export const updateAppSettings = (payload) => prefApiRequest("PUT", SETTINGS_BASE, payload);

import { prefApiRequest } from "./prefApiClient";

const BASE = "/preferences/campaigns";

export const getCampaigns = (params = {}) => prefApiRequest("GET", BASE, { params });
export const getCampaignById = (id) => prefApiRequest("GET", `${BASE}/${id}`);
export const createCampaign = (formData) => prefApiRequest("POST", BASE, formData, true);
export const updateCampaign = (id, formData) => prefApiRequest("PUT", `${BASE}/${id}`, formData, true);
export const deleteCampaign = (id) => prefApiRequest("DELETE", `${BASE}/${id}`);
export const toggleCampaignStatus = (id, status) => prefApiRequest("PATCH", `${BASE}/${id}/status`, { status });
export const bulkDeleteCampaigns = (ids) => prefApiRequest("POST", `${BASE}/bulk-delete`, { ids });
export const bulkUpdateCampaignStatus = (ids, status) => prefApiRequest("POST", `${BASE}/bulk-status`, { ids, status });
export const getCampaignAnalytics = (id) => prefApiRequest("GET", `${BASE}/${id}/analytics`);

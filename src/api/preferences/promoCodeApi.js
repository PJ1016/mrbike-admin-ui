import { prefApiRequest } from "./prefApiClient";

const BASE = "/preferences/promo-codes";

export const getPromoCodes = (params = {}) => prefApiRequest("GET", BASE, { params });
export const getPromoCodeById = (id) => prefApiRequest("GET", `${BASE}/${id}`);
export const createPromoCode = (payload) => prefApiRequest("POST", BASE, payload);
export const updatePromoCode = (id, payload) => prefApiRequest("PUT", `${BASE}/${id}`, payload);
export const deletePromoCode = (id) => prefApiRequest("DELETE", `${BASE}/${id}`);
export const togglePromoCodeStatus = (id, status) => prefApiRequest("PATCH", `${BASE}/${id}/status`, { status });
export const bulkDeletePromoCodes = (ids) => prefApiRequest("POST", `${BASE}/bulk-delete`, { ids });
export const bulkUpdatePromoCodeStatus = (ids, status) => prefApiRequest("POST", `${BASE}/bulk-status`, { ids, status });

import { prefApiRequest } from "./prefApiClient";

const SETTINGS_BASE = "/preferences/referral-settings";

// Referral settings singleton — Phase 1 toggles and amounts only.
export const getReferralSettings = () => prefApiRequest("GET", SETTINGS_BASE);
export const updateReferralSettings = (payload) => prefApiRequest("PUT", SETTINGS_BASE, payload);

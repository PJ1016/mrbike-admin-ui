import { prefApiRequest } from "./prefApiClient";

const BASE = "/preferences/referral-transactions";

// Admin-facing, all-users listing of referral transactions.
export const getReferralTransactions = (page = 1, limit = 20) =>
  prefApiRequest("GET", `${BASE}?page=${page}&limit=${limit}`);

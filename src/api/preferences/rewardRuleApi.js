import { prefApiRequest } from "./prefApiClient";

// One generic CRUD surface reused by all five rule tables on the
// Rewards & Referral page (Referral Bonus, Reward Point Rules, Redemption
// Rules, Signup Bonus, Cashback Rules) — each is keyed by `ruleType` so the
// backend can host them under a single collection/route family.
const BASE = "/preferences/reward-rules";

export const RULE_TYPES = {
  REFERRAL_BONUS: "referral-bonus",
  POINT_RULES: "point-rules",
  REDEMPTION_RULES: "redemption-rules",
  SIGNUP_BONUS: "signup-bonus",
  CASHBACK_RULES: "cashback-rules",
};

export const getRewardRules = (ruleType, params = {}) =>
  prefApiRequest("GET", `${BASE}/${ruleType}`, { params });

export const getRewardRuleById = (ruleType, id) => prefApiRequest("GET", `${BASE}/${ruleType}/${id}`);

export const createRewardRule = (ruleType, payload) => prefApiRequest("POST", `${BASE}/${ruleType}`, payload);

export const updateRewardRule = (ruleType, id, payload) =>
  prefApiRequest("PUT", `${BASE}/${ruleType}/${id}`, payload);

export const deleteRewardRule = (ruleType, id) => prefApiRequest("DELETE", `${BASE}/${ruleType}/${id}`);

export const toggleRewardRuleStatus = (ruleType, id, status) =>
  prefApiRequest("PATCH", `${BASE}/${ruleType}/${id}/status`, { status });

export const bulkDeleteRewardRules = (ruleType, ids) =>
  prefApiRequest("POST", `${BASE}/${ruleType}/bulk-delete`, { ids });

export const bulkUpdateRewardRuleStatus = (ruleType, ids, status) =>
  prefApiRequest("POST", `${BASE}/${ruleType}/bulk-status`, { ids, status });

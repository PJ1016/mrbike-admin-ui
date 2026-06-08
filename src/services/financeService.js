import { getFinanceSummary, getAllPayouts, getDealerPayouts } from "../api";

export const fetchFinanceSummary = async () => {
  const res = await getFinanceSummary();
  if (res?.data) return res.data;
  if (res?.totalBookings !== undefined) return res;
  throw new Error("Empty response from /finance/summary");
};

export const fetchAllPayouts = async () => {
  try {
    const res = await getAllPayouts("ALL");
    console.log("payout response", res);
    console.log("records", res?.data);

    const raw = res?.data || res?.payouts || res?.withdrawals || [];
    const data = Array.isArray(raw) ? raw : [];
    console.log("[financeService] raw array length:", data.length);

    return { data, isLegacy: false };
  } catch (err) {
    // Fallback only on HTTP/network failure (404, 500, no connection)
    console.warn(
      "GET /dealer/payouts?status=ALL failed — falling back to /dealer/pending:",
      err?.message
    );
    try {
      const res = await getDealerPayouts();
      const raw = res?.data || res;
      const data = Array.isArray(raw) ? raw : [];
      console.log("Legacy /dealer/pending count", data.length);
      return { data, isLegacy: true };
    } catch (fallbackErr) {
      console.error("Both payouts endpoints failed:", fallbackErr?.message);
      return { data: [], isLegacy: true };
    }
  }
};

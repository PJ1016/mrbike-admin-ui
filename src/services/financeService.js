import {
  getFinanceSummary,
  getAllPayouts,
  getDealerPayouts,
  getDealerWallets,
  getDealerWalletDetails,
  getFinanceTransactions,
  getFinanceTransactionDetails,
} from "../api";

export const fetchFinanceSummary = async () => {
  const res = await getFinanceSummary();
  if (res?.data) return res.data;
  if (res?.totalBookings !== undefined) return res;
  throw new Error("Empty response from /finance/summary");
};

export const fetchAllPayouts = async () => {
  try {
    const res = await getAllPayouts("ALL");
    const raw = res?.data || res?.payouts || res?.withdrawals || [];
    const data = Array.isArray(raw) ? raw : [];

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
      return { data, isLegacy: true };
    } catch (fallbackErr) {
      console.error("Both payouts endpoints failed:", fallbackErr?.message);
      return { data: [], isLegacy: true };
    }
  }
};

// GET /finance/wallets — full list, filtered/sorted/paginated client-side
// (mirrors fetchAllPayouts / getTicketList — no other list endpoint in this
// codebase relies on server-side pagination).
export const fetchDealerWallets = async () => {
  const res = await getDealerWallets();
  const raw = res?.data ?? res?.wallets ?? res;
  return Array.isArray(raw) ? raw : [];
};

export const fetchDealerWalletDetails = async (id) => {
  const res = await getDealerWalletDetails(id);
  return res?.data ?? res ?? null;
};

export const fetchFinanceTransactions = async () => {
  const res = await getFinanceTransactions();
  const raw = res?.data ?? res?.transactions ?? res;
  return Array.isArray(raw) ? raw : [];
};

export const fetchFinanceTransactionDetails = async (id) => {
  const res = await getFinanceTransactionDetails(id);
  return res?.data ?? res ?? null;
};

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
export const fetchDealerWallets = async (params = {}) => {
  const res = await getDealerWallets(params);
  return { data: Array.isArray(res?.data) ? res.data : [], pagination: res?.pagination || null };
};

export const fetchDealerWalletDetails = async (id) => {
  const res = await getDealerWalletDetails(id);
  const raw = res?.data ?? res ?? null;
  if (!raw) return null;
  const summary = raw.walletSummary || {};
  return {
    ...raw,
    dealer: raw.dealer || {},
    walletBalance: summary.availableBalance,
    availableBalance: summary.availableBalance,
    pendingBalance: summary.pendingBalance,
    lifetimeEarnings: summary.lifetimeEarnings,
    totalWithdrawn: summary.totalWithdrawals,
    transactions: raw.recentTransactions || [],
    withdrawalHistory: raw.withdrawalHistory || { data: [], pagination: null },
  };
};

export const fetchFinanceTransactions = async (params = {}) => {
  const res = await getFinanceTransactions(params);
  return { data: Array.isArray(res?.data) ? res.data : [], pagination: res?.pagination || null };
};

export const fetchFinanceTransactionDetails = async (id) => {
  const res = await getFinanceTransactionDetails(id);
  const raw = res?.data ?? res ?? null;
  if (!raw) return null;
  return {
    ...raw,
    amount: raw.amountBreakdown?.walletAmount,
    commission: raw.amountBreakdown?.platformCommission,
    tax: raw.amountBreakdown?.taxes,
    booking: raw.bookingDetails,
    dealer: raw.dealerDetails,
    customer: raw.customerDetails,
    gatewayResponse: raw.paymentGatewayResponse,
    refund: raw.refundInformation && { amount: raw.refundInformation.refundAmount, status: raw.refundInformation.refundStatus },
  };
};

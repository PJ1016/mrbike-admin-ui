// Shared display helpers for the Finance module (Dealer Wallets & Transactions).
// Status color palette mirrors the pill-badge style already established by
// WithdrawalManagement.jsx's local StatusBadge, extended with wallet/txn statuses.
import moment from "moment";

export const STATUS_CONFIG = {
  PENDING: { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  IN_PROGRESS: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  APPROVED: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  COMPLETED: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  SUCCESS: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  ACTIVE: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  REJECTED: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  FAILED: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  CANCELLED: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  INACTIVE: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  SUSPENDED: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  REFUNDED: { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" },
};

export const DEFAULT_STATUS_STYLE = { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };

export const TXN_LABELS = {
  settlement_online: "Online Settlement",
  settlement_cash: "Cash Settlement",
  withdrawal: "Withdrawal",
  deposit: "Deposit",
  booking_payment: "Booking Payment",
  commission: "Commission",
  refund: "Refund",
};

export const DEBIT_TYPES = ["withdrawal"];

export const isDebitTxn = (txn) => {
  const t = (txn?.type || txn?.transaction_type || txn?.transactionType || "").toLowerCase();
  return t === "withdrawal" || t === "debit";
};

export const fmtCurrency = (n) =>
  n != null ? `₹${Number(n).toLocaleString("en-IN")}` : "—";

export const fmtNumber = (n) => Number(n || 0).toLocaleString("en-IN");

export const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

// "N/A" (never blank) for any value that may legitimately be null — refund
// fields, gateway response fields, etc.
export const naFallback = (value) => (value === null || value === undefined || value === "" ? "N/A" : value);

const DATE_PRESETS = ["all", "today", "7d", "30d"];

export const withinDateRange = (iso, range) => {
  if (!DATE_PRESETS.includes(range) || range === "all") return true;
  const m = moment(iso);
  if (range === "today") return m.isSameOrAfter(moment().startOf("day"));
  if (range === "7d") return m.isSameOrAfter(moment().subtract(7, "days"));
  if (range === "30d") return m.isSameOrAfter(moment().subtract(30, "days"));
  return true;
};

// Generic client-side column sort — comparable values (numbers, ISO date
// strings, plain strings) sort correctly without a per-column comparator.
export const sortRows = (rows, sortKey, sortDirection, getValue) => {
  if (!sortKey) return rows;
  const dir = sortDirection === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = getValue ? getValue(a, sortKey) : a[sortKey];
    const bv = getValue ? getValue(b, sortKey) : b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    const ad = Date.parse(av);
    const bd = Date.parse(bv);
    if (!Number.isNaN(ad) && !Number.isNaN(bd) && typeof av === "string" && typeof bv === "string") {
      return (ad - bd) * dir;
    }
    return String(av).localeCompare(String(bv)) * dir;
  });
};

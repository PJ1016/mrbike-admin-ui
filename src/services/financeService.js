/**
 * Finance Service Layer
 *
 * Wraps backend API calls for all finance-related screens.
 * Mock data is returned when endpoints are not yet available (404 / network error).
 * Swap MOCK_SUMMARY and MOCK_PAYOUTS for live data by ensuring the backend
 * implements GET /finance/summary and GET /dealer/payouts?status=ALL.
 */

import { getFinanceSummary, getAllPayouts, getDealerPayouts } from "../api";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_SUMMARY = {
  totalBookingValue: 1284500,
  totalCommissionEarned: 128450,
  totalTaxCollected: 23122,
  totalWalletBalance: 342100,
  pendingWithdrawals: 3,
  inProgressWithdrawals: 2,
  approvedWithdrawals: 5,
  activeDealers: 28,
  totalBookings: 312,
};

const MOCK_PAYOUTS = [
  {
    _id: "mock_p1",
    orderId: "ORD-2025-0001",
    dealer_id: { _id: "d1", name: "Raj Motors", walletBalance: 15200 },
    Amount: 8500,
    Type: "settlement_online",
    Note: "Monthly settlement",
    order_status: "PENDING",
    createdAt: "2025-06-01T10:00:00Z",
    updatedAt: "2025-06-01T10:00:00Z",
  },
  {
    _id: "mock_p2",
    orderId: "ORD-2025-0002",
    dealer_id: { _id: "d2", name: "Speed Garage", walletBalance: 8900 },
    Amount: 4200,
    Type: "settlement_cash",
    Note: "",
    order_status: "PENDING",
    createdAt: "2025-06-02T14:30:00Z",
    updatedAt: "2025-06-02T14:30:00Z",
  },
  {
    _id: "mock_p3",
    orderId: "ORD-2025-0003",
    dealer_id: { _id: "d3", name: "City Bikes", walletBalance: 22000 },
    Amount: 12000,
    Type: "withdrawal",
    Note: "Urgent withdrawal",
    order_status: "PENDING",
    createdAt: "2025-06-03T09:15:00Z",
    updatedAt: "2025-06-03T09:15:00Z",
  },
  {
    _id: "mock_p4",
    orderId: "ORD-2025-0004",
    dealer_id: { _id: "d1", name: "Raj Motors", walletBalance: 15200 },
    Amount: 6700,
    Type: "settlement_online",
    Note: "",
    order_status: "IN_PROGRESS",
    createdAt: "2025-05-28T11:00:00Z",
    updatedAt: "2025-06-04T08:00:00Z",
  },
  {
    _id: "mock_p5",
    orderId: "ORD-2025-0005",
    dealer_id: { _id: "d4", name: "MotoFix Hub", walletBalance: 5400 },
    Amount: 3100,
    Type: "settlement_cash",
    Note: "Pending verification",
    order_status: "IN_PROGRESS",
    createdAt: "2025-05-29T16:45:00Z",
    updatedAt: "2025-06-05T10:00:00Z",
  },
  {
    _id: "mock_p6",
    orderId: "ORD-2025-0006",
    dealer_id: { _id: "d2", name: "Speed Garage", walletBalance: 8900 },
    Amount: 9800,
    Type: "settlement_online",
    Note: "",
    order_status: "APPROVED",
    createdAt: "2025-05-20T10:00:00Z",
    updatedAt: "2025-05-22T14:00:00Z",
  },
  {
    _id: "mock_p7",
    orderId: "ORD-2025-0007",
    dealer_id: { _id: "d3", name: "City Bikes", walletBalance: 22000 },
    Amount: 7500,
    Type: "withdrawal",
    Note: "",
    order_status: "APPROVED",
    createdAt: "2025-05-18T09:00:00Z",
    updatedAt: "2025-05-20T11:00:00Z",
  },
  {
    _id: "mock_p8",
    orderId: "ORD-2025-0008",
    dealer_id: { _id: "d5", name: "Wheelie Works", walletBalance: 1200 },
    Amount: 2200,
    Type: "settlement_cash",
    Note: "Duplicate request",
    order_status: "REJECTED",
    createdAt: "2025-05-25T13:00:00Z",
    updatedAt: "2025-05-25T15:30:00Z",
  },
  {
    _id: "mock_p9",
    orderId: "ORD-2025-0009",
    dealer_id: { _id: "d4", name: "MotoFix Hub", walletBalance: 5400 },
    Amount: 1500,
    Type: "withdrawal",
    Note: "Insufficient docs",
    order_status: "REJECTED",
    createdAt: "2025-05-26T10:00:00Z",
    updatedAt: "2025-05-26T17:00:00Z",
  },
  {
    _id: "mock_p10",
    orderId: "ORD-2025-0010",
    dealer_id: { _id: "d1", name: "Raj Motors", walletBalance: 15200 },
    Amount: 4400,
    Type: "settlement_online",
    Note: "Approved",
    order_status: "APPROVED",
    createdAt: "2025-05-15T08:00:00Z",
    updatedAt: "2025-05-17T09:00:00Z",
  },
];

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches finance summary KPIs.
 * Returns live data from /finance/summary when available; falls back to mock.
 */
export const fetchFinanceSummary = async () => {
  try {
    const res = await getFinanceSummary();
    if (res?.data) return { data: res.data, isMock: false };
    if (res?.totalBookings !== undefined) return { data: res, isMock: false };
    throw new Error("Empty response");
  } catch {
    return { data: MOCK_SUMMARY, isMock: true };
  }
};

/**
 * Fetches ALL withdrawal records across all statuses.
 * Tries /dealer/payouts?status=ALL first, then falls back to /dealer/pending,
 * then falls back to mock data.
 */
export const fetchAllPayouts = async () => {
  try {
    const res = await getAllPayouts("ALL");
    const records = res?.data || res;
    if (Array.isArray(records) && records.length > 0) {
      return { data: records, isMock: false };
    }
    throw new Error("Empty or invalid response");
  } catch {
    try {
      // Fallback: existing pending-only endpoint
      const res = await getDealerPayouts();
      const records = res?.data || res;
      if (Array.isArray(records)) {
        return { data: records, isMock: records.length === 0 };
      }
      throw new Error("Fallback also failed");
    } catch {
      return { data: MOCK_PAYOUTS, isMock: true };
    }
  }
};

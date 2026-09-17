import { getFinanceTransactions } from "../api";
import { fetchFinanceDeposits } from "./financeService";

jest.mock("../api", () => ({
  getFinanceSummary: jest.fn(),
  getAllPayouts: jest.fn(),
  getDealerPayouts: jest.fn(),
  getDealerWallets: jest.fn(),
  getDealerWalletDetails: jest.fn(),
  getFinanceTransactions: jest.fn(),
  getFinanceTransactionDetails: jest.fn(),
  adminDepositToDealer: jest.fn(),
}));

test("deposit search, dealer, status, date and pagination filters are forwarded to the ledger API", async () => {
  getFinanceTransactions.mockResolvedValue({ data: [], pagination: { page: 2, total: 0 } });
  const filters = {
    search: "Speed Motors",
    dealer_id: "dealer-1",
    status: "APPROVED",
    from: "2026-09-01",
    to: "2026-09-17",
    page: 2,
    limit: 25,
  };

  await fetchFinanceDeposits(filters);

  expect(getFinanceTransactions).toHaveBeenCalledWith({ ...filters, transaction_type: "deposit" });
});

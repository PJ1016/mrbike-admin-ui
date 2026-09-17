import axios from "axios";
import { adminDepositToDealer, API_BASE_URL } from "./api";

jest.mock("axios", () => ({
  defaults: {},
  post: jest.fn(),
}));

describe("adminDepositToDealer", () => {
  beforeEach(() => {
    axios.post.mockReset();
    axios.post.mockResolvedValue({ data: { success: true, idempotent: false } });
    window.localStorage.setItem("adminToken", "admin-token");
  });

  test("uses the admin adjustment API and preserves the caller idempotency key on retries", async () => {
    const request = {
      walletId: "dealer-object-id",
      amount: 500,
      reason: "Opening float",
      reference: "BANK-123",
      idempotencyKey: "admin-deposit-dealer-object-id-request-1",
    };

    await adminDepositToDealer(request);
    await adminDepositToDealer(request);

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(
      1,
      `${API_BASE_URL}/finance/wallets/dealer-object-id/adjustments`,
      {
        amount: 500,
        direction: "Credit",
        reason: "Opening float",
        reference: "BANK-123",
        transactionType: "deposit",
      },
      {
        headers: { token: "admin-token", "x-idempotency-key": request.idempotencyKey },
        withCredentials: true,
      },
    );
    expect(axios.post.mock.calls[1][2].headers["x-idempotency-key"]).toBe(request.idempotencyKey);
  });
});

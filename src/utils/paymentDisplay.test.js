import {
  getPartyEmail,
  getPartyName,
  getPartyPhone,
  getReferenceId,
  isWalletTopup,
} from "./paymentDisplay";

test("wallet top-ups display the dealer instead of fake booking/customer values", () => {
  const payment = {
    type: "WALLET_TOPUP",
    dealer_id: {
      _id: "dealer-1",
      shopName: "Test Garage",
      shopEmail: "garage@example.com",
      phone: "9999999999",
    },
    booking_id: null,
    user_id: null,
  };

  expect(isWalletTopup(payment)).toBe(true);
  expect(getReferenceId(payment)).toBe("dealer-1");
  expect(getPartyName(payment)).toBe("Test Garage");
  expect(getPartyEmail(payment)).toBe("garage@example.com");
  expect(getPartyPhone(payment)).toBe("9999999999");
});

test("booking payments retain booking and customer display values", () => {
  const payment = {
    payment_type: "ONLINE",
    booking_id: { _id: "booking-object-id", bookingId: "MRB123" },
    user_id: { first_name: "Asha", last_name: "Rao", email: "asha@example.com", phone: "8888888888" },
  };

  expect(isWalletTopup(payment)).toBe(false);
  expect(getReferenceId(payment)).toBe("MRB123");
  expect(getPartyName(payment)).toBe("Asha Rao");
  expect(getPartyEmail(payment)).toBe("asha@example.com");
  expect(getPartyPhone(payment)).toBe("8888888888");
});

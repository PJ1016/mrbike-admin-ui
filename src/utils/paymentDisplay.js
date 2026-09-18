export const isWalletTopup = (payment) =>
  (payment?.payment_type || payment?.type) === "WALLET_TOPUP";

export const getDealerName = (dealer) =>
  dealer?.shopName || dealer?.ownerName || dealer?.name || "N/A";

export const getDealerEmail = (dealer) =>
  dealer?.shopEmail || dealer?.email || dealer?.personalEmail || "No email";

export const getDealerPhone = (dealer) =>
  dealer?.phone || dealer?.personalPhone || "No phone";

export const getPartyName = (payment) => {
  if (isWalletTopup(payment)) return getDealerName(payment?.dealer_id);
  const name = `${payment?.user_id?.first_name || ""} ${payment?.user_id?.last_name || ""}`.trim();
  return name || "N/A";
};

export const getPartyEmail = (payment) =>
  isWalletTopup(payment)
    ? getDealerEmail(payment?.dealer_id)
    : payment?.user_id?.email || "No email";

export const getPartyPhone = (payment) =>
  isWalletTopup(payment)
    ? getDealerPhone(payment?.dealer_id)
    : payment?.user_id?.phone || "No phone";

export const getReferenceId = (payment) => {
  if (isWalletTopup(payment)) {
    return payment?.dealer_id?._id || payment?.dealer_id || "N/A";
  }
  return payment?.booking_id?.bookingId || payment?.booking_id?._id || payment?.booking_id || "N/A";
};

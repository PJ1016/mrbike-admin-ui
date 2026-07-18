// Single source of truth for the "Business Settings" fields shared between
// the Edit Dealer form (updateDealer.jsx) and the Dealer Details Business
// Settings tab (BusinessSettingsTab.jsx). Both write the same backend
// fields via PUT /dealer/editDealer — keeping the field list, defaults,
// validation, and payload shape here stops the two from drifting apart.
//
// Note: the commission field is intentionally submitted as "comission"
// (typo) to match the field name the backend expects on this endpoint.

export const BUSINESS_SETTINGS_FIELDS = [
  "comission",
  "tax",
  "pickupCharges",
  "dropCharges",
  "providesPickup",
  "providesDrop",
  "minWalletAmount",
  "adminNotes",
];

export const initBusinessSettings = (dealer = {}) => ({
  comission: dealer.commission ?? "",
  tax: dealer.tax ?? "",
  pickupCharges: dealer.pickupCharges ?? "",
  dropCharges: dealer.dropCharges ?? "",
  providesPickup: !!dealer.providesPickup,
  providesDrop: !!dealer.providesDrop,
  minWalletAmount: dealer.minWalletAmount ?? "",
  adminNotes: dealer.adminNotes ?? "",
});

export const validateBusinessSettings = (data) => {
  const e = {};
  if (data.comission !== "" && (isNaN(data.comission) || Number(data.comission) < 0 || Number(data.comission) > 100))
    e.comission = "Must be between 0 and 100";
  if (data.tax !== "" && (isNaN(data.tax) || Number(data.tax) < 0 || Number(data.tax) > 18))
    e.tax = "Must be between 0 and 18";
  return e;
};

export const appendBusinessSettingsToForm = (form, data) => {
  BUSINESS_SETTINGS_FIELDS.forEach((key) => form.append(key, data[key]));
};

// Single source of truth for the "Business Settings" fields shared between
// the Edit Dealer form (updateDealer.jsx) and the Dealer Details Business
// Settings tab (BusinessSettingsTab.jsx). Both write the same backend
// fields via PUT /dealer/editDealer — keeping the field list, defaults,
// validation, and payload shape here stops the two from drifting apart.
//
// Note: the commission field is intentionally submitted as "comission"
// (typo) to match the field name the backend expects on this endpoint.

// Radius bounds mirror helper/dealerServiceRadius.js on the backend, which is
// what actually rejects an out-of-range value.
export const SERVICE_RADIUS_MIN_KM = 0.5;
export const SERVICE_RADIUS_MAX_KM = 50;
export const SERVICE_RADIUS_DEFAULT_KM = 3;

export const BUSINESS_SETTINGS_FIELDS = [
  "comission",
  "tax",
  "pickupCharges",
  "dropCharges",
  "towingCharges",
  "providesPickup",
  "providesDrop",
  "providesTowing",
  "minWalletAmount",
  "serviceRadiusKm",
  "adminNotes",
];

export const initBusinessSettings = (dealer = {}) => ({
  comission: dealer.commission ?? "",
  tax: dealer.tax ?? "",
  pickupCharges: dealer.pickupCharges ?? "",
  dropCharges: dealer.dropCharges ?? "",
  // Applied to a booking when the customer declares their bike as not
  // rideable or completely dead, so it is never hardcoded in any frontend.
  towingCharges: dealer.towingCharges ?? "",
  providesPickup: !!dealer.providesPickup,
  providesDrop: !!dealer.providesDrop,
  providesTowing: !!dealer.providesTowing,
  minWalletAmount: dealer.minWalletAmount ?? "",
  // How far around the shop this dealer serves. A user outside it never sees
  // the garage or its services in the app.
  serviceRadiusKm: dealer.serviceRadiusKm ?? "",
  adminNotes: dealer.adminNotes ?? "",
});

export const validateBusinessSettings = (data) => {
  const e = {};
  if (data.towingCharges !== "" && (isNaN(data.towingCharges) || Number(data.towingCharges) < 0))
    e.towingCharges = "Must be 0 or more";
  if (data.comission !== "" && (isNaN(data.comission) || Number(data.comission) < 0 || Number(data.comission) > 100))
    e.comission = "Must be between 0 and 100";
  if (data.tax !== "" && (isNaN(data.tax) || Number(data.tax) < 0 || Number(data.tax) > 18))
    e.tax = "Must be between 0 and 18";
  if (
    data.serviceRadiusKm !== "" &&
    data.serviceRadiusKm != null &&
    (isNaN(data.serviceRadiusKm) ||
      Number(data.serviceRadiusKm) < SERVICE_RADIUS_MIN_KM ||
      Number(data.serviceRadiusKm) > SERVICE_RADIUS_MAX_KM)
  )
    e.serviceRadiusKm = `Must be between ${SERVICE_RADIUS_MIN_KM} and ${SERVICE_RADIUS_MAX_KM} km`;
  return e;
};

export const appendBusinessSettingsToForm = (form, data) => {
  BUSINESS_SETTINGS_FIELDS.forEach((key) => form.append(key, data[key]));
};

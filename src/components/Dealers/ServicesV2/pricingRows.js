export const normalizeVariantId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim();
  if (!normalized || normalized === "undefined" || normalized === "null") return null;
  return normalized;
};

export const pricingEntriesToEditableBikes = (entries) =>
  entries.map((entry, index) => {
    const variantId = normalizeVariantId(entry.variantId);
    return {
      _id: variantId || `generic:${entry.serviceId}:${index}`,
      variant_id: variantId,
      isGeneric: variantId === null,
      variant_name: entry.bikeName || variantId || "Generic Bike",
      company_name: entry.companyName || "",
      model_name: entry.modelName || "",
      cc: Number(entry.cc || 0),
      price: entry.price,
    };
  });

export const editableBikeToPricingEntry = ({ bike, serviceType, serviceId, price }) => ({
  type: serviceType,
  serviceId,
  variantId: bike.isGeneric ? null : normalizeVariantId(bike.variant_id || bike._id),
  cc: Number(bike.cc || bike.engine_cc || 0),
  price: Number(price || 0),
  bikeName: bike.variant_name || "",
  companyName: bike.company_name || "",
  modelName: bike.model_name || "",
});

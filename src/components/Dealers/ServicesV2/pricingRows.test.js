import {
  editableBikeToPricingEntry,
  normalizeVariantId,
  pricingEntriesToEditableBikes,
} from "./pricingRows";

test("legacy generic rows round-trip as null and never stringified undefined", () => {
  const [bike] = pricingEntriesToEditableBikes([
    { serviceId: "service-1", variantId: undefined, bikeName: "Generic Bike", cc: 350, price: 550 },
  ]);
  const row = editableBikeToPricingEntry({ bike, serviceType: "base", serviceId: "service-1", price: 550 });
  expect(row.variantId).toBeNull();
  expect(JSON.stringify(row)).not.toContain("undefined");
  expect(row.cc).toBe(350);
  expect(row.price).toBe(550);
});

test("an exact 200cc variant keeps its variant id", () => {
  const row = editableBikeToPricingEntry({
    bike: {
      _id: "6aaac7af82bb2014ad592793",
      variant_id: "6aaac7af82bb2014ad592793",
      variant_name: "RTR",
      model_name: "APACHI",
      company_name: "TVS",
      cc: 200,
    },
    serviceType: "base",
    serviceId: "6a64bce9f3922eb3470c9518",
    price: 500,
  });
  expect(row.variantId).toBe("6aaac7af82bb2014ad592793");
  expect(row.cc).toBe(200);
  expect(row.price).toBe(500);
});

test("stringified nullish values are sanitized", () => {
  expect(normalizeVariantId(undefined)).toBeNull();
  expect(normalizeVariantId(null)).toBeNull();
  expect(normalizeVariantId("undefined")).toBeNull();
  expect(normalizeVariantId("null")).toBeNull();
});

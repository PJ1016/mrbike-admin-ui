/**
 * Common displacement (CC) ranges used for service pricing grouping.
 */
export const CC_RANGES = [
  { label: "100-124cc", key: "100-124", min: 0, max: 124 },
  { label: "125-149cc", key: "125-149", min: 125, max: 149 },
  { label: "150-220cc", key: "150-220", min: 150, max: 220 },
  { label: "221-500cc", key: "221-500", min: 221, max: 500 },
  { label: "501-650cc", key: "501-650", min: 501, max: 650 },
  { label: "651-1000cc", key: "651-1000", min: 651, max: 1000 },
  { label: "Above 1001cc", key: "1001+", min: 1001, max: 9999 },
];

/**
 * Helper to get the grouping key for a given CC value based on CC_RANGES definition.
 * 
 * @param {number|string} cc - The bike's displacement in CC
 * @returns {string} The range key (e.g., "150-220")
 */
export const getCCRangeKey = (cc) => {
  const n = typeof cc === 'string' ? parseInt(cc.replace(/\D/g, ''), 10) : Number(cc);
  if (isNaN(n)) return "100-124"; // Default to lowest category
  
  const range = CC_RANGES.find(r => n >= r.min && n <= r.max);
  return range ? range.key : (n < 100 ? "100-124" : "1001+");
};

/**
 * Helper to get the display label for a given CC value.
 * 
 * @param {number|string} cc - The bike's displacement in CC
 * @returns {string} The formatted display label (e.g., "150-220cc")
 */
export const getCCDisplayName = (cc) => {
  const n = typeof cc === 'string' ? parseInt(cc.replace(/\D/g, ''), 10) : Number(cc);
  if (isNaN(n)) return "100-124cc";
  
  const range = CC_RANGES.find(r => n >= r.min && n <= r.max);
  return range ? range.label : (n < 100 ? "100-124cc" : "Above 1001cc");
};

// Shared CC-grouping helper for the Add Service wizard.
// Step4SelectCCRanges and Step4Pricing both need bikes grouped by CC —
// this is the single source of truth for that grouping.

export const getBikeCC = (bike) => Number(bike.cc || bike.engine_cc || 0);

export const groupBikesByCC = (bikes) => {
  const groups = {};
  bikes.forEach((bike) => {
    const cc = getBikeCC(bike);
    if (!groups[cc]) groups[cc] = { cc, bikes: [] };
    groups[cc].bikes.push(bike);
  });
  return Object.values(groups).sort((a, b) => a.cc - b.cc);
};

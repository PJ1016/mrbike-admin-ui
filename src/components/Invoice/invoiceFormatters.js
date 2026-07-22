// Plain-JS mirror of the RN formatters (mybikeuser/mrbikeprovider
// src/**/invoice/formatters.ts) — same currency/date/GST rules, so the
// Admin Panel invoice never looks different from the User/Dealer apps.

export const formatCurrency = (amount) => {
  const value = Number(amount) || 0;
  return `₹ ${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timePart = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
};

export const formatGST = (rate) => `${Number(rate) || 0}%`;

// Shared display helpers for the Support/Ticket module.
// Tickets only ever carry `user_type` to distinguish who raised them — this
// normalizes the numeric/string codes the backend sends (2/"dealer" => Dealer,
// 4/"user" => Customer, 1|3/"admin" => Admin) into one consistent label,
// replacing the two divergent one-off helpers that used to live separately
// in AllTicket.jsx and NewTicket.jsx (one of which had a string-only bug).
export const resolvePartyType = (userType) => {
  if (userType == null) return "Unknown";
  const numeric = Number(userType);
  if (!Number.isNaN(numeric)) {
    if (numeric === 2) return "Dealer";
    if (numeric === 4) return "Customer";
    if (numeric === 1 || numeric === 3) return "Admin";
  }
  const s = String(userType).toLowerCase();
  if (s === "dealer") return "Dealer";
  if (s === "user" || s === "customer") return "Customer";
  if (s === "admin") return "Admin";
  return "Unknown";
};

// Message sender_type can arrive as a plain code or an object
// ({ user_type } / { role }) — same shape NewTicket.jsx already handled.
export const resolveSenderLabel = (senderType) => {
  const raw =
    typeof senderType === "object"
      ? senderType?.user_type ?? senderType?.role
      : senderType;
  return resolvePartyType(raw);
};

export const isAdminSender = (senderType) => resolveSenderLabel(senderType) === "Admin";

// Unchanged from NewTicket.jsx — maps the logged-in admin's own role to the
// sender_type value the reply endpoint expects.
export const roleToSenderType = (role) => {
  const s = String(role || "").toLowerCase();
  if (["admin", "dealer", "user"].includes(s)) return s;
  if (s.includes("admin")) return "admin";
  if (s.includes("dealer")) return "dealer";
  if (s.includes("user")) return "user";
  return "user";
};

export const STATUS_OPTIONS = ["Open", "In Progress", "Closed"];

export const STATUS_COLOR = {
  Open: "warning",
  "In Progress": "info",
  Closed: "success",
};

export const formatDateTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export const getLastMessage = (ticket) => {
  const messages = Array.isArray(ticket?.messages) ? ticket.messages : [];
  return messages.length ? messages[messages.length - 1] : null;
};

export const getLastActivityAt = (ticket) => {
  const lastMessage = getLastMessage(ticket);
  return lastMessage?.timestamp || ticket?.created_at;
};

export const isToday = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

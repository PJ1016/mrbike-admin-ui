import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Payments as PaymentIcon,
} from "@mui/icons-material";

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Admin never derives pricing — always render the Booking's own pricing
// snapshot (set once at booking time and never recomputed from live rates).
export const getBookingAmount = (booking) =>
  booking?.customerTotal ?? booking?.totalBill ?? 0;

// Mirrors Booking.bikeCondition on the backend. A booking created before this
// field existed has none, which reads as Rideable — exactly what it was.
export const BIKE_CONDITION_LABELS = {
  RIDEABLE: "Rideable",
  NOT_RIDEABLE: "Not Rideable",
  COMPLETELY_DEAD: "Completely Dead",
};

// The towing charge may only be revised while the customer still owes the
// money. The backend enforces this and is the authority; this only decides
// whether to offer the editor.
export const canEditTowingCharge = (booking) => {
  if (!booking?.towingRequired) return false;
  if (booking?.billGenerated) return false;
  if (booking?.billStatus && booking.billStatus !== "pending") return false;
  if (booking?.payment_status === "completed") return false;
  return !["rejected", "user_cancelled", "cancelled", "expired", "delivered"].includes(
    booking?.status,
  );
};

export const getStatusConfig = (status) => {
  const s = status?.toLowerCase() || "";

  if (s.includes("completed") || s.includes("paid") || s === "cash received")
    return { color: "success", icon: <CheckCircleIcon fontSize="small" /> };
  if (s.includes("cancelled") || s.includes("rejected"))
    return { color: "error", icon: <CancelIcon fontSize="small" /> };
  if (s.includes("pending") || s.includes("waiting") || s.includes("created"))
    return { color: "warning", icon: <PendingIcon fontSize="small" /> };
  if (s === "awaiting_payment")
    return { color: "warning", icon: <PendingIcon fontSize="small" /> };
  if (s === "payment_selected")
    return { color: "secondary", icon: <PaymentIcon fontSize="small" /> };
  if (s === "ready_for_delivery" || s === "delivered")
    return { color: "success", icon: <CheckCircleIcon fontSize="small" /> };

  return { color: "info", icon: <InfoIcon fontSize="small" /> };
};

export const lifecycleSteps = [
  "Booking Created",
  "Confirmed",
  "Awaiting/Scheduled",
  "In Service",
  "Service Done",
  "Billed",
  "Paid",
];

export const getActiveStep = (booking) => {
  if (!booking) return 0;
  const s = (booking.vehicleLifecycleStatus || "").toLowerCase();
  if (s.includes("payment completed")) return 6;
  if (s.includes("bill generated")) return 5;
  if (s.includes("service completed")) return 4;
  if (s.includes("service in progress")) return 3;
  if (s.includes("pickup scheduled") || s.includes("awaiting")) return 2;
  if (booking.status === "delivered") return 6;
  if (booking.status === "cash received") return 6;
  if (booking.status === "ready_for_delivery" || booking.status === "payment_selected") return 5;
  if (booking.status === "awaiting_payment") return 4;
  if (booking.status === "confirmed") return 1;
  return 0;
};

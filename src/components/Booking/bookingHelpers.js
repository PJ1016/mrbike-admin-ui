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

// Handle both cases where service might be an ID or a populated object
export const calculateEstimatedPrice = (booking) => {
  if (booking.totalBill && booking.totalBill > 0) return booking.totalBill;
  if (!booking.services || booking.services.length === 0) return 0;

  const bikeCC = parseInt(
    booking.bike?.engine_cc || booking.userBike_id?.bike_cc || 0,
  );
  return booking.services.reduce((total, service) => {
    const bikes = service.bikes || [];
    const matchingBike = bikes.find((b) => b.cc === bikeCC);
    return total + (matchingBike?.price || 0);
  }, 0);
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

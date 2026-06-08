import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Divider,
  Alert,
} from "@mui/material";
import {
  TrendingUp,
  AccountBalanceWallet,
  Receipt,
  Percent,
  HourglassEmpty,
  Autorenew,
  CheckCircle,
  Storefront,
  ShoppingCart,
  Refresh,
  ArrowForwardIos,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { fetchFinanceSummary, fetchAllPayouts } from "../../services/financeService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

const fmtNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN");

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ title, value, subtitle, icon, color, bg, onClick, tag }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      borderRadius: "16px",
      border: "1px solid #f1f5f9",
      bgcolor: "#ffffff",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      height: "100%",
      "&:hover": onClick
        ? {
            transform: "translateY(-3px)",
            boxShadow: `0 12px 24px -8px ${color}30`,
            borderColor: `${color}40`,
          }
        : {},
    }}
  >
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Avatar
          sx={{
            bgcolor: bg || `${color}15`,
            color,
            width: 44,
            height: 44,
            borderRadius: "12px",
          }}
        >
          {icon}
        </Avatar>
        {tag && (
          <Chip
            label={tag.label}
            size="small"
            sx={{
              bgcolor: tag.bg,
              color: tag.color,
              fontWeight: 700,
              fontSize: "0.6rem",
              height: 20,
              border: `1px solid ${tag.color}30`,
            }}
          />
        )}
        {onClick && (
          <ArrowForwardIos sx={{ fontSize: 13, color: "#cbd5e1", mt: 0.5 }} />
        )}
      </Stack>

      <Typography
        variant="caption"
        sx={{
          mt: 2,
          display: "block",
          fontWeight: 700,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontSize: "0.6rem",
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          color: "#0f172a",
          mt: 0.3,
          fontSize: "1.45rem",
          lineHeight: 1.2,
        }}
      >
        {value}
      </Typography>
      {subtitle && (
        <Typography
          variant="caption"
          sx={{
            mt: 0.5,
            display: "block",
            color: "#94a3b8",
            fontSize: "0.7rem",
            fontWeight: 500,
          }}
        >
          {subtitle}
        </Typography>
      )}
    </CardContent>
  </Card>
);

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionLabel = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      display: "block",
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      fontSize: "0.65rem",
      mb: 1.5,
      mt: 1,
    }}
  >
    {children}
  </Typography>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const FinanceDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [isMock, setIsMock] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch summary + live payout counts in parallel
      const [summaryResult, payoutsResult] = await Promise.all([
        fetchFinanceSummary(),
        fetchAllPayouts(),
      ]);

      const s = summaryResult.data;
      const payouts = payoutsResult.data;

      // If live payout data is available, recompute counts from it
      // (overrides any stale counts in summary payload)
      if (!payoutsResult.isMock && Array.isArray(payouts)) {
        s.pendingWithdrawals    = payouts.filter((p) => p.order_status === "PENDING").length;
        s.inProgressWithdrawals = payouts.filter((p) => p.order_status === "IN_PROGRESS").length;
        s.approvedWithdrawals   = payouts.filter(
          (p) => p.order_status === "APPROVED" || p.order_status === "COMPLETED"
        ).length;
      }

      setSummary(s);
      setIsMock(summaryResult.isMock);
    } catch (err) {
      console.error("Finance dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          height: "70vh",
          gap: 2,
        }}
      >
        <CircularProgress size={44} thickness={3} sx={{ color: "#2563eb" }} />
        <Typography variant="body2" color="text.secondary">
          Loading finance data…
        </Typography>
      </Box>
    );
  }

  if (!summary) return null;

  const today = moment().format("dddd, D MMMM YYYY");

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}
          >
            Finance Overview
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.5, fontWeight: 500 }}>
            {today}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {isMock && (
            <Chip
              label="Mock Data"
              size="small"
              sx={{
                bgcolor: "#fff7ed",
                color: "#c2410c",
                fontWeight: 700,
                fontSize: "0.65rem",
                border: "1px solid #fed7aa",
              }}
            />
          )}
          <Tooltip title="Refresh">
            <IconButton
              onClick={loadData}
              sx={{
                bgcolor: "white",
                border: "1px solid #f1f5f9",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                "&:hover": { bgcolor: "#f8fafc" },
              }}
            >
              <Refresh sx={{ fontSize: 18, color: "#64748b" }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {isMock && (
        <Alert
          severity="info"
          sx={{ mb: 3, borderRadius: "12px", fontSize: "0.8rem" }}
        >
          Showing mock data — connect <strong>GET /finance/summary</strong> and{" "}
          <strong>GET /dealer/payouts?status=ALL</strong> to display live figures.
        </Alert>
      )}

      {/* ── Section: Revenue ── */}
      <SectionLabel>Revenue & Earnings</SectionLabel>
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Booking Value"
            value={fmtCurrency(summary.totalBookingValue)}
            subtitle="Sum of all booking amounts"
            icon={<TrendingUp />}
            color="#10b981"
            onClick={() => navigate("/finance/bookings")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Commission Earned"
            value={fmtCurrency(summary.totalCommissionEarned)}
            subtitle="Platform commission collected"
            icon={<Percent />}
            color="#2563eb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Tax Collected"
            value={fmtCurrency(summary.totalTaxCollected)}
            subtitle="GST & other taxes"
            icon={<Receipt />}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Wallet Balance"
            value={fmtCurrency(summary.totalWalletBalance)}
            subtitle="Across all dealer wallets"
            icon={<AccountBalanceWallet />}
            color="#0ea5e9"
            onClick={() => navigate("/finance/dealer-wallets")}
          />
        </Grid>
      </Grid>

      {/* ── Section: Withdrawals ── */}
      <SectionLabel>Withdrawal Requests</SectionLabel>
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={4}>
          <KpiCard
            title="Pending Withdrawals"
            value={fmtNumber(summary.pendingWithdrawals)}
            subtitle="Awaiting review"
            icon={<HourglassEmpty />}
            color="#f59e0b"
            tag={{ label: "Action needed", color: "#c2410c", bg: "#fff7ed" }}
            onClick={() => navigate("/finance/withdrawals")}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard
            title="In Progress"
            value={fmtNumber(summary.inProgressWithdrawals)}
            subtitle="Being processed"
            icon={<Autorenew />}
            color="#2563eb"
            onClick={() => navigate("/finance/withdrawals")}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <KpiCard
            title="Approved Withdrawals"
            value={fmtNumber(summary.approvedWithdrawals)}
            subtitle="Successfully processed"
            icon={<CheckCircle />}
            color="#10b981"
            onClick={() => navigate("/finance/withdrawals")}
          />
        </Grid>
      </Grid>

      {/* ── Section: Operations ── */}
      <SectionLabel>Operations</SectionLabel>
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6}>
          <KpiCard
            title="Active Dealers"
            value={fmtNumber(summary.activeDealers)}
            subtitle="Verified and onboarded"
            icon={<Storefront />}
            color="#6366f1"
            onClick={() => navigate("/dealers")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <KpiCard
            title="Total Bookings"
            value={fmtNumber(summary.totalBookings)}
            subtitle="All time service requests"
            icon={<ShoppingCart />}
            color="#ec4899"
            onClick={() => navigate("/bookings")}
          />
        </Grid>
      </Grid>

      {/* ── Footer ── */}
      <Divider sx={{ mt: 5, mb: 2 }} />
      <Typography variant="caption" sx={{ color: "#cbd5e1", display: "block", textAlign: "center" }}>
        Finance Dashboard · Mr Bike Doctor Admin
      </Typography>
    </Box>
  );
};

export default FinanceDashboard;

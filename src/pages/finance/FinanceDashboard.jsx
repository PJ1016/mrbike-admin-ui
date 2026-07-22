import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Skeleton,
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
  Savings,
  SwapHoriz,
  Today,
  CalendarMonth,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { fetchFinanceSummary } from "../../services/financeService";

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
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await fetchFinanceSummary();

      // GET /finance/summary returns withdrawals as { total, pending, inProgress, approved },
      // each an { count, amount } bucket (approved = APPROVED + COMPLETED, already summed
      // server-side). Flatten into the flat fields this page's cards read.
      const withdrawals = s.withdrawals || {};
      s.totalWithdrawals = withdrawals.approved?.amount ?? 0;
      s.pendingWithdrawals = withdrawals.pending?.count ?? 0;
      s.inProgressWithdrawals = withdrawals.inProgress?.count ?? 0;
      s.approvedWithdrawals = withdrawals.approved?.count ?? 0;

      // todayTransactions / thisMonthTransactions are { count, totalAmount } objects.
      s.todayTransactions = s.todayTransactions?.count ?? 0;
      s.monthTransactions = s.thisMonthTransactions?.count ?? 0;

      setSummary(s);
    } catch (err) {
      console.error("Finance dashboard load error:", err);
      setError("Unable to load finance data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
        <Skeleton variant="text" width={220} height={48} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={180} height={22} sx={{ mb: 4 }} />
        <Skeleton variant="text" width={140} height={14} sx={{ mb: 1.5 }} />
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {[0, 1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: "16px" }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="text" width={160} height={14} sx={{ mb: 1.5 }} />
        <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
          {[0, 1, 2].map((i) => (
            <Grid item xs={12} sm={4} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: "16px" }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="text" width={110} height={14} sx={{ mb: 1.5 }} />
        <Grid container spacing={2.5}>
          {[0, 1].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rounded" height={120} sx={{ borderRadius: "16px" }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "70vh", gap: 2 }}>
        <Alert severity="error" sx={{ borderRadius: "12px", fontWeight: 600 }}>
          {error}
        </Alert>
        <Tooltip title="Retry">
          <IconButton
            onClick={loadData}
            sx={{ bgcolor: "white", border: "1px solid #f1f5f9", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", "&:hover": { bgcolor: "#f8fafc" } }}
          >
            <Refresh sx={{ fontSize: 18, color: "#64748b" }} />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  const today = moment().format("dddd, D MMMM YYYY");

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "flex-start" }}
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
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Dealer Earnings"
            value={fmtCurrency(summary.totalDealerEarnings)}
            subtitle="Lifetime earnings across dealers"
            icon={<Savings />}
            color="#14b8a6"
            onClick={() => navigate("/finance/dealer-wallets")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            title="Total Withdrawals"
            value={fmtCurrency(summary.totalWithdrawals)}
            subtitle="All processed withdrawal amounts"
            icon={<SwapHoriz />}
            color="#f97316"
            onClick={() => navigate("/finance/withdrawals")}
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

      {/* ── Section: Transaction Activity ── */}
      <SectionLabel>Transaction Activity</SectionLabel>
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid item xs={12} sm={6}>
          <KpiCard
            title="Today's Transactions"
            value={fmtNumber(summary.todayTransactions)}
            subtitle="Processed so far today"
            icon={<Today />}
            color="#0ea5e9"
            onClick={() => navigate("/finance/transactions")}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <KpiCard
            title="This Month Transactions"
            value={fmtNumber(summary.monthTransactions)}
            subtitle="Processed this calendar month"
            icon={<CalendarMonth />}
            color="#6366f1"
            onClick={() => navigate("/finance/transactions")}
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

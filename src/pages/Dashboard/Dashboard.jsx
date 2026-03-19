import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  Stack,
  Avatar,
  CircularProgress,
  Chip,
  Divider,
  Tooltip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Build,
  TwoWheeler,
  Redeem,
  People,
  Storefront,
  Description,
  Refresh,
  Warning,
  CheckCircle,
  Cancel,
  LocalShipping,
  DirectionsBike,
  AttachMoney,
  EventNote,
  ArrowForwardIos,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AgCharts } from "ag-charts-react";
import { getAllBookings, getDealerList } from "../../api";
import moment from "moment";

// ─── helpers ────────────────────────────────────────────────────────────────
const STATUS_META = {
  confirmed:      { label: "Confirmed",    color: "#2563eb", bg: "#eff6ff", icon: <CheckCircle fontSize="small" /> },
  pickedup:       { label: "Picked Up",    color: "#f59e0b", bg: "#fffbeb", icon: <LocalShipping fontSize="small" /> },
  arrived:        { label: "Arrived",      color: "#0ea5e9", bg: "#f0f9ff", icon: <EventNote fontSize="small" /> },
  completed:      { label: "Completed",    color: "#10b981", bg: "#ecfdf5", icon: <CheckCircle fontSize="small" /> },
  user_cancelled: { label: "Cancelled",    color: "#ef4444", bg: "#fef2f2", icon: <Cancel fontSize="small" /> },
  rejected:       { label: "Rejected",     color: "#ef4444", bg: "#fef2f2", icon: <Cancel fontSize="small" /> },
};

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// ─── Stat Card ───────────────────────────────────────────────────────────────
const StatCard = ({ title, value, subtitle, icon, color, bg, onClick }) => (
  <Card
    elevation={0}
    onClick={onClick}
    sx={{
      borderRadius: "16px",
      border: "1px solid #f1f5f9",
      bgcolor: "#ffffff",
      cursor: onClick ? "pointer" : "default",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      "&:hover": onClick ? { 
        transform: "translateY(-4px)", 
        boxShadow: "0 12px 24px -10px rgba(0,0,0,0.1)",
        borderColor: color ? `${color}40` : "#e2e8f0"
      } : {},
      height: "100%",
    }}
  >
    <CardContent sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar 
          sx={{ 
            bgcolor: bg || `${color}10`, 
            color: color || "primary.main", 
            width: 48, 
            height: 48, 
            borderRadius: "12px",
            flexShrink: 0 
          }}
        >
          {icon}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 700, 
              color: "neutral.500", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              fontSize: "0.65rem" 
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              color: "neutral.800", 
              mt: 0.2, 
              fontSize: "1.5rem",
              lineHeight: 1.2 
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 0.4, 
                display: "block", 
                color: "neutral.400",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

// ─── Status Pill ─────────────────────────────────────────────────────────────
const StatusPill = ({ statusKey, count, total }) => {
  const meta = STATUS_META[statusKey] || { label: statusKey, color: "#64748b", bg: "#f1f5f9" };
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        p: 1.5,
        borderRadius: 2,
        bgcolor: meta.bg,
        mb: 1,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box sx={{ color: meta.color, display: "flex" }}>{meta.icon}</Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color: meta.color }}>
          {meta.label}
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography variant="body2" sx={{ fontWeight: 800, color: meta.color }}>
          {count}
        </Typography>
        <Typography variant="caption" sx={{ color: "#94a3b8" }}>
          ({pct}%)
        </Typography>
      </Stack>
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ bookings: [], dealers: [] });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, dealersRes] = await Promise.all([
        getAllBookings(),
        getDealerList(),
      ]);
      setData({
        bookings: bookingsRes.data || [],
        dealers: dealersRes.data || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ── computed analytics ────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    const { bookings } = data;
    if (!bookings.length) return null;

    const today = moment().startOf("day");

    // 6-month labels
    const labels = [];
    const monthlyBookings = {};
    const monthlyCancelled = {};
    for (let i = 5; i >= 0; i--) {
      const m = moment().subtract(i, "months").format("MMM");
      labels.push(m);
      monthlyBookings[m] = 0;
      monthlyCancelled[m] = 0;
    }

    let totalRevenue = 0;
    let todayBookings = 0;
    let todayRevenue = 0;
    const statusCounts = {};
    const recentBookings = [];

    bookings.forEach((b) => {
      const month = moment(b.createdAt).format("MMM");
      const status = (b.status || "").toLowerCase();
      const isCancelled = status.includes("cancel") || status.includes("reject");

      if (monthlyBookings[month] !== undefined) {
        monthlyBookings[month]++;
        if (isCancelled) monthlyCancelled[month]++;
      }

      const rev = b.totalBill || 0;
      if (!isCancelled) {
        totalRevenue += rev;
        if (moment(b.createdAt).isSame(today, "day")) todayRevenue += rev;
      }
      if (moment(b.createdAt).isSame(today, "day")) todayBookings++;

      // Status bucket
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Recent 5 bookings sorted newest first
    const sorted = [...bookings].sort((a, b) =>
      moment(b.createdAt).valueOf() - moment(a.createdAt).valueOf()
    );
    recentBookings.push(...sorted.slice(0, 5));

    const completedCount = statusCounts["completed"] || 0;
    const cancelledCount =
      (statusCounts["user_cancelled"] || 0) + (statusCounts["rejected"] || 0);
    const activeCount =
      (statusCounts["confirmed"] || 0) +
      (statusCounts["pickedup"] || 0) +
      (statusCounts["arrived"] || 0);

    return {
      totalRevenue,
      todayBookings,
      todayRevenue,
      totalBookings: bookings.length,
      completedCount,
      cancelledCount,
      activeCount,
      statusCounts,
      recentBookings,
      bookingTrend: labels.map((l) => ({
        month: l,
        bookings: monthlyBookings[l],
        cancelled: monthlyCancelled[l],
      })),
      cancelRate: bookings.length
        ? ((cancelledCount / bookings.length) * 100).toFixed(1)
        : 0,
    };
  }, [data.bookings]);

  // ── dealer alerts ─────────────────────────────────────────────────────────
  const highCancellationDealers = useMemo(() => {
    const { bookings, dealers } = data;
    if (!bookings.length || !dealers.length) return [];

    const stats = {};
    bookings.forEach((b) => {
      if (!b.dealer_id?._id) return;
      const id = b.dealer_id._id;
      if (!stats[id]) stats[id] = { total: 0, cancelled: 0 };
      stats[id].total++;
      if ((b.status || "").toLowerCase().includes("cancel")) stats[id].cancelled++;
    });

    return Object.keys(stats)
      .map((id) => {
        const dealer = dealers.find((d) => d._id === id);
        const s = stats[id];
        return {
          name: dealer?.shopName || "Unknown Shop",
          rate: ((s.cancelled / s.total) * 100).toFixed(1),
          total: s.total,
          cancelled: s.cancelled,
        };
      })
      .filter((d) => d.rate > 15 && d.total > 5)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);
  }, [data]);

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "80vh", gap: 2 }}>
        <CircularProgress size={48} thickness={3} />
        <Typography variant="body2" color="text.secondary">Loading dashboard…</Typography>
      </Box>
    );
  }

  const today = moment().format("dddd, D MMMM YYYY");
  const statusOrder = ["confirmed", "pickedup", "arrived", "completed", "user_cancelled", "rejected"];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "neutral.50", minHeight: "100vh" }}>
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "neutral.800", letterSpacing: "-0.03em" }}>
            Hi, Admin 👋
          </Typography>
          <Typography variant="body2" sx={{ color: "neutral.500", fontWeight: 500, mt: 0.5 }}>
            {today} — Here's what's happening today.
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton 
            onClick={fetchData} 
            sx={{ 
              bgcolor: "white", 
              boxShadow: "var(--shadow-sm)",
              border: "1px solid #f1f5f9",
              "&:hover": { bgcolor: "neutral.50" }
            }}
          >
            <Refresh sx={{ fontSize: 20, color: "neutral.600" }} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* ── Row 1: KPI Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Bookings"
            value={analytics?.totalBookings ?? 0}
            subtitle="All time service requests"
            icon={<ShoppingCart />}
            color="#6366f1"
            onClick={() => navigate("/booking")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Jobs in Progress"
            value={analytics?.activeCount ?? 0}
            subtitle="Confirmed + Picked Up + Arrived"
            icon={<Build />}
            color="#f59e0b"
            onClick={() => navigate("/booking")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed Services"
            value={analytics?.completedCount ?? 0}
            subtitle="Successfully done"
            icon={<CheckCircle />}
            color="#10b981"
            onClick={() => navigate("/booking")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Cancellations"
            value={analytics?.cancelledCount ?? 0}
            subtitle={`${analytics?.cancelRate ?? 0}% of all bookings`}
            icon={<Cancel />}
            color="#ef4444"
            onClick={() => navigate("/booking")}
          />
        </Grid>
      </Grid>

      {/* ── Row 2: Revenue Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Today's New Bookings"
            value={analytics?.todayBookings ?? 0}
            subtitle="Booked today"
            icon={<EventNote />}
            color="#8b5cf6"
            onClick={() => navigate("/booking")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Today's Earnings"
            value={fmt(analytics?.todayRevenue)}
            subtitle="Revenue collected today"
            icon={<TrendingUp />}
            color="#10b981"
            onClick={() => navigate("/booking")}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Total Revenue Earned"
            value={fmt(analytics?.totalRevenue)}
            subtitle="All time estimated revenue"
            icon={<AttachMoney />}
            color="#0ea5e9"
            onClick={() => navigate("/booking")}
          />
        </Grid>
      </Grid>

      {/* ── Row 3: Chart + Status Breakdown + Quick Actions ── */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Trend Chart */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e8ecf0", height: "100%" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  📊 Monthly Bookings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  How many bikes came in each month vs cancellations
                </Typography>
              </Box>
            </Stack>
            <AgCharts
              options={{
                height: 260,
                data: analytics?.bookingTrend,
                series: [
                  {
                    type: "bar",
                    xKey: "month",
                    yKey: "bookings",
                    yName: "Total Bookings",
                    fill: "#6366f1",
                    cornerRadiusBbox: { topLeft: 4, topRight: 4 },
                  },
                  {
                    type: "line",
                    xKey: "month",
                    yKey: "cancelled",
                    yName: "Cancellations",
                    stroke: "#ef4444",
                    marker: { fill: "#ef4444", size: 6 },
                  },
                ],
                axes: [
                  { type: "category", position: "bottom" },
                  { type: "number", position: "left", label: { formatter: (p) => `${p.value}` } },
                ],
                legend: { position: "bottom" },
                background: { fill: "transparent" },
              }}
            />
          </Paper>
        </Grid>

        {/* Status Breakdown */}
        <Grid item xs={12} sm={6} lg={3}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e8ecf0", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
              📋 Booking Status
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              What's the status of all bookings?
            </Typography>
            {statusOrder.map((key) =>
              analytics?.statusCounts?.[key] ? (
                <StatusPill
                  key={key}
                  statusKey={key}
                  count={analytics.statusCounts[key]}
                  total={analytics.totalBookings}
                />
              ) : null
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} sm={6} lg={2}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e8ecf0", height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a", mb: 0.5 }}>
              ⚡ Quick Actions
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
              Jump to important sections
            </Typography>
            <Stack spacing={1}>
              {[
                { label: "View All Bookings", icon: <ShoppingCart fontSize="small" />, route: "/booking", color: "#6366f1" },
                { label: "Approve Dealers", icon: <Storefront fontSize="small" />, route: "/dealers-verify", color: "#f59e0b" },
                { label: "Manage Services", icon: <Build fontSize="small" />, route: "/dealers", color: "#10b981" },
                { label: "View Customers", icon: <People fontSize="small" />, route: "/customers", color: "#8b5cf6" },
                { label: "Check Offers", icon: <Redeem fontSize="small" />, route: "/offers", color: "#ec4899" },
              ].map((a, i) => (
                <Box
                  key={i}
                  onClick={() => navigate(a.route)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    cursor: "pointer",
                    border: "1px solid #e8ecf0",
                    transition: "all 0.15s",
                    "&:hover": { bgcolor: `${a.color}10`, borderColor: a.color },
                  }}
                >
                  <Box sx={{ color: a.color, display: "flex" }}>{a.icon}</Box>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "#334155", flex: 1 }}>
                    {a.label}
                  </Typography>
                  <ArrowForwardIos sx={{ fontSize: 10, color: "#94a3b8" }} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* ── Row 4: Recent Bookings + Dealer Alerts ── */}
      <Grid container spacing={2.5}>
        {/* Recent Bookings */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid #e8ecf0" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#0f172a" }}>
                  🕐 Recent Bookings
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  The 5 most recently placed bookings
                </Typography>
              </Box>
              <Chip
                label="See All"
                size="small"
                onClick={() => navigate("/booking")}
                sx={{ cursor: "pointer", fontWeight: 600 }}
              />
            </Stack>
            <List disablePadding>
              {analytics?.recentBookings?.map((b, i) => {
                const status = (b.status || "").toLowerCase();
                const meta = STATUS_META[status] || { label: status, color: "#64748b", bg: "#f1f5f9" };
                const dealer = b.dealer_id?.shopName || b.dealer_id?.name || "Unknown Dealer";
                const ago = moment(b.createdAt).fromNow();
                return (
                  <React.Fragment key={b._id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: meta.bg, color: meta.color, width: 40, height: 40 }}>
                          <DirectionsBike fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                              Booking #{b.id || i + 1}
                            </Typography>
                            <Chip
                              label={meta.label}
                              size="small"
                              sx={{
                                bgcolor: meta.bg,
                                color: meta.color,
                                fontWeight: 700,
                                fontSize: "0.68rem",
                                height: 20,
                              }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {dealer} · {ago}
                          </Typography>
                        }
                      />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {fmt(b.totalBill)}
                      </Typography>
                    </ListItem>
                    {i < (analytics.recentBookings.length - 1) && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          </Paper>
        </Grid>

        {/* Dealer Alerts */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid #fecaca",
              bgcolor: "#fff8f8",
              height: "100%",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Warning sx={{ color: "#ef4444" }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#7f1d1d" }}>
                  ⚠️ Dealer Alerts
                </Typography>
                <Typography variant="caption" sx={{ color: "#b91c1c" }}>
                  Dealers with too many cancellations
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 2, borderColor: "#fecaca" }} />
            {highCancellationDealers.length > 0 ? (
              <Stack spacing={2}>
                {highCancellationDealers.map((d, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid #fca5a5",
                      bgcolor: "white",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                        {d.name}
                      </Typography>
                      <Chip
                        label={`${d.rate}% cancelled`}
                        size="small"
                        sx={{ bgcolor: "#fef2f2", color: "#ef4444", fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      Out of {d.total} bookings, {d.cancelled} were cancelled
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(d.rate)}
                      sx={{
                        borderRadius: 2,
                        bgcolor: "#fecaca",
                        "& .MuiLinearProgress-bar": { bgcolor: "#ef4444" },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <CheckCircle sx={{ color: "#10b981", fontSize: 40, mb: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#065f46" }}>
                  All dealers are performing well! 🎉
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  No high cancellation rates detected.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

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
  Divider,
  Alert,
  AlertTitle,
  Tooltip,
  IconButton,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Build,
  TwoWheeler,
  Redeem,
  SupervisorAccount,
  People,
  Storefront,
  Description,
  Refresh,
  Warning,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { AgCharts } from "ag-charts-react";
import { getAllBookings, getDealerList } from "../../api";
import moment from "moment";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    bookings: [],
    dealers: [],
    counts: {},
  });

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
        counts: {
          totalBookings: bookingsRes.data?.length || 0,
          totalDealers: dealersRes.data?.length || 0,
          // Other counts can still come from the counts API if needed,
          // but we prioritize calculating trends from bookings.
        },
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

  // Calculate Metrics
  const analytics = useMemo(() => {
    const { bookings } = data;
    if (!bookings.length) return null;

    // Monthly Trends
    const monthlyData = {};
    const cancellationTrend = {};

    // Last 6 months labels
    const labels = [];
    for (let i = 5; i >= 0; i--) {
      const month = moment().subtract(i, "months").format("MMM");
      labels.push(month);
      monthlyData[month] = 0;
      cancellationTrend[month] = 0;
    }

    let totalRevenue = 0;
    let cancelledCount = 0;

    bookings.forEach((b) => {
      const month = moment(b.createdAt).format("MMM");
      if (monthlyData[month] !== undefined) {
        monthlyData[month]++;
        if (b.status?.toLowerCase().includes("cancel")) {
          cancellationTrend[month]++;
        }
      }

      const rev = b.est_price || 0;
      if (!b.status?.toLowerCase().includes("cancel")) {
        totalRevenue += rev;
      } else {
        cancelledCount++;
      }
    });

    const overallCancelRate = (
      (cancelledCount / bookings.length) *
      100
    ).toFixed(1);

    return {
      totalRevenue,
      overallCancelRate,
      bookingTrend: labels.map((l) => ({ month: l, count: monthlyData[l] })),
      cancellationTrend: labels.map((l) => ({
        month: l,
        count: cancellationTrend[l],
      })),
    };
  }, [data.bookings]);

  // Top Dealers with High Cancellations
  const highCancellationDealers = useMemo(() => {
    const { bookings, dealers } = data;
    if (!bookings.length || !dealers.length) return [];

    const dealerStats = {};
    bookings.forEach((b) => {
      if (b.dealer_id?._id) {
        const dId = b.dealer_id._id;
        if (!dealerStats[dId]) dealerStats[dId] = { total: 0, cancelled: 0 };
        dealerStats[dId].total++;
        if (b.status?.toLowerCase().includes("cancel")) {
          dealerStats[dId].cancelled++;
        }
      }
    });

    return Object.keys(dealerStats)
      .map((id) => {
        const dealer = dealers.find((d) => d._id === id);
        const stats = dealerStats[id];
        const rate = (stats.cancelled / stats.total) * 100;
        return {
          name: dealer?.shopName || "Unknown Dealer",
          rate: rate.toFixed(1),
          total: stats.total,
        };
      })
      .filter((d) => d.rate > 15 && d.total > 5) // Threshold: >15% rate and at least 5 bookings
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);
  }, [data]);

  const statsCards = [
    {
      title: "Total Bookings",
      value: data.counts.totalBookings,
      icon: <ShoppingCart />,
      color: "#6366f1",
      route: "/booking",
    },
    {
      title: "Active Dealers",
      value: data.counts.totalDealers,
      icon: <Storefront />,
      color: "#ec4899",
      route: "/dealers",
    },
    {
      title: "Est. Revenue",
      value: `₹${analytics?.totalRevenue.toLocaleString() || 0}`,
      icon: <TrendingUp />,
      color: "#10b981",
      route: "/booking",
    },
    {
      title: "Cancellation Rate",
      value: `${analytics?.overallCancelRate || 0}%`,
      icon: <TrendingDown />,
      color: "#f43f5e",
      route: "/booking",
    },
  ];

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ p: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 4 }}
          >
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#1e293b",
                  letterSpacing: "-0.025em",
                }}
              >
                Operational Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time insights and business performance metrics.
              </Typography>
            </Box>
            <Tooltip title="Refresh Data">
              <IconButton
                onClick={fetchData}
                sx={{ bgcolor: "white", boxShadow: 1 }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Stack>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {statsCards.map((card, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: 4,
                    border: "1px solid #e2e8f0",
                    cursor: "pointer",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 12px 24px -10px rgba(0,0,0,0.1)",
                    },
                  }}
                  onClick={() => navigate(card.route)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography
                          variant="overline"
                          sx={{ fontWeight: 700, color: "text.secondary" }}
                        >
                          {card.title}
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5 }}>
                          {card.value}
                        </Typography>
                      </Box>
                      <Avatar
                        sx={{
                          bgcolor: `${card.color}15`,
                          color: card.color,
                          width: 56,
                          height: 56,
                        }}
                      >
                        {card.icon}
                      </Avatar>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3}>
            {/* Booking & Cancellation Trends */}
            <Grid item xs={12} lg={8}>
              <Paper
                elevation={0}
                sx={{ p: 3, borderRadius: 4, border: "1px solid #e2e8f0" }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Volume & Cancellation Analysis
                </Typography>
                <AgCharts
                  options={{
                    data: analytics?.bookingTrend,
                    series: [
                      {
                        type: "area",
                        xKey: "month",
                        yKey: "count",
                        yName: "Total Bookings",
                        fill: "#6366f133",
                        stroke: "#6366f1",
                      },
                      {
                        type: "line",
                        xKey: "month",
                        yKey: "count",
                        data: analytics?.cancellationTrend,
                        yName: "Cancellations",
                        stroke: "#f43f5e",
                        marker: { fill: "#f43f5e" },
                      },
                    ],
                    axes: [
                      { type: "category", position: "bottom" },
                      { type: "number", position: "left" },
                    ],
                    legend: { position: "top" },
                  }}
                />
              </Paper>
            </Grid>

            {/* Actionable Alerts & Insights */}
            <Grid item xs={12} lg={4}>
              <Stack spacing={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 4,
                    border: "1px solid #e2e8f0",
                    bgcolor: "#fff5f5",
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <Warning color="error" />
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 700, color: "#991b1b" }}
                    >
                      Critical Alerts
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2, opacity: 0.1, bgcolor: "#991b1b" }} />

                  {highCancellationDealers.length > 0 ? (
                    <Stack spacing={2}>
                      {highCancellationDealers.map((d, i) => (
                        <Alert
                          icon={false}
                          severity="error"
                          key={i}
                          sx={{ border: "1px solid #fecaca", borderRadius: 2 }}
                        >
                          <AlertTitle sx={{ fontWeight: 700 }}>
                            High Cancellation: {d.name}
                          </AlertTitle>
                          Rate: <strong>{d.rate}%</strong> over {d.total} bookings.
                        </Alert>
                      ))}
                    </Stack>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No critical dealer performance issues detected.
                    </Typography>
                  )}
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: 4, border: "1px solid #e2e8f0" }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Stack spacing={1}>
                    {[
                      {
                        label: "Verify New Dealers",
                        icon: <Storefront fontSize="small" />,
                        route: "/dealerVerify",
                      },
                      {
                        label: "Manage Services",
                        icon: <Build fontSize="small" />,
                        route: "/services",
                      },
                      {
                        label: "Check Recent Offers",
                        icon: <Redeem fontSize="small" />,
                        route: "/offers",
                      },
                    ].map((action, i) => (
                      <Box
                        key={i}
                        onClick={() => navigate(action.route)}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          cursor: "pointer",
                          "&:hover": { bgcolor: "#f1f5f9" },
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "#e2e8f0",
                            color: "#475569",
                          }}
                        >
                          {action.icon}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {action.label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default Dashboard;

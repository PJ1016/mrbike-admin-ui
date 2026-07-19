import React, { useMemo, useState } from "react";
import { Box, Grid, Typography } from "@mui/material";
import { SupportAgent, Storefront, HourglassEmpty, Sync, CheckCircle, AutoAwesome } from "@mui/icons-material";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import useTicketList from "../../hooks/useTicketList";
import { resolvePartyType, getLastActivityAt, isToday } from "../../utils/ticketHelpers";
import SupportStatsCard from "../../components/Support/SupportStatsCard";
import QueuePreview from "../../components/Support/QueuePreview";
import TicketDrawer from "../../components/Support/TicketDrawer";

const CUSTOMER_ACCENT = "#2563eb";
const DEALER_ACCENT = "#f59e0b";

const SupportOverview = () => {
  const navigate = useNavigate();
  const { tickets, loading, refetch } = useTicketList();
  const [drawer, setDrawer] = useState({ ticketId: null, accentColor: CUSTOMER_ACCENT });

  const metrics = useMemo(() => {
    const customer = tickets.filter((t) => resolvePartyType(t.user_type) === "Customer");
    const dealer = tickets.filter((t) => resolvePartyType(t.user_type) === "Dealer");
    return {
      customer,
      dealer,
      open: tickets.filter((t) => t.status === "Open"),
      inProgress: tickets.filter((t) => t.status === "In Progress"),
      closed: tickets.filter((t) => t.status === "Closed"),
      todayNew: tickets.filter((t) => isToday(t.created_at)),
    };
  }, [tickets]);

  const recent = (list) => [...list].sort((a, b) => moment(getLastActivityAt(b)).valueOf() - moment(getLastActivityAt(a)).valueOf()).slice(0, 5);

  const openTicket = (ticket, accentColor) => setDrawer({ ticketId: ticket._id, accentColor });
  const closeDrawer = () => setDrawer((d) => ({ ...d, ticketId: null }));

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em", mb: 0.5 }}>
        Help &amp; Support
      </Typography>
      <Typography variant="body2" sx={{ color: "#64748b", mb: 3 }}>
        {moment().format("dddd, D MMMM YYYY")} — overview of Customer and Dealer support queues.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <SupportStatsCard title="Customer Tickets" value={metrics.customer.length} icon={<SupportAgent fontSize="small" />} color={CUSTOMER_ACCENT} onClick={() => navigate("/support/customer")} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <SupportStatsCard title="Dealer Tickets" value={metrics.dealer.length} icon={<Storefront fontSize="small" />} color={DEALER_ACCENT} onClick={() => navigate("/support/dealer")} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <SupportStatsCard title="Open Tickets" value={metrics.open.length} icon={<HourglassEmpty fontSize="small" />} color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <SupportStatsCard title="In Progress" value={metrics.inProgress.length} icon={<Sync fontSize="small" />} color="#0ea5e9" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <SupportStatsCard title="Closed Tickets" value={metrics.closed.length} icon={<CheckCircle fontSize="small" />} color="#10b981" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <SupportStatsCard title="Today's New" value={metrics.todayNew.length} icon={<AutoAwesome fontSize="small" />} color="#6366f1" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <QueuePreview
            title="Customer Support"
            accentColor={CUSTOMER_ACCENT}
            tickets={recent(metrics.customer)}
            onViewAll={() => navigate("/support/customer")}
            onTicketClick={(t) => openTicket(t, CUSTOMER_ACCENT)}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <QueuePreview
            title="Dealer Support"
            accentColor={DEALER_ACCENT}
            tickets={recent(metrics.dealer)}
            onViewAll={() => navigate("/support/dealer")}
            onTicketClick={(t) => openTicket(t, DEALER_ACCENT)}
          />
        </Grid>
      </Grid>

      {loading && (
        <Typography variant="caption" sx={{ display: "block", mt: 3, textAlign: "center", color: "#94a3b8" }}>
          Loading support data…
        </Typography>
      )}

      <TicketDrawer open={Boolean(drawer.ticketId)} ticketId={drawer.ticketId} accentColor={drawer.accentColor} onClose={closeDrawer} onTicketUpdated={refetch} />
    </Box>
  );
};

export default SupportOverview;

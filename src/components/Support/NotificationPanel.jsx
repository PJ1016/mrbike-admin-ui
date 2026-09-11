import React, { useCallback, useEffect, useState } from "react";
import { Badge, Box, IconButton, Menu, Stack, Tooltip, Typography } from "@mui/material";
import { NotificationsNone, Forum, AddComment, CheckCircle } from "@mui/icons-material";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { getTicketList } from "../../services/ticketService";
import { resolvePartyType, getLastMessage, getLastActivityAt, isAdminSender, isToday } from "../../utils/ticketHelpers";

const EVENT_META = {
  new: { icon: AddComment, color: "#2563eb" },
  reply: { icon: Forum, color: "#f59e0b" },
  closed: { icon: CheckCircle, color: "#10b981" },
};

// Built from the existing ticket list (no dedicated notifications API exists for
// tickets yet) — derives "new today", "recent reply" and "closed" events from data
// already returned by GET /ticket/user-dealer.
const buildEvents = (tickets) => {
  const events = [];

  tickets.forEach((t) => {
    if (isToday(t.created_at)) {
      events.push({ type: "new", ticket: t, at: t.created_at });
    }
    const lastMessage = getLastMessage(t);
    if (lastMessage && !isAdminSender(lastMessage.sender_type)) {
      events.push({ type: "reply", ticket: t, at: lastMessage.timestamp });
    }
    if (t.status === "Closed") {
      events.push({ type: "closed", ticket: t, at: getLastActivityAt(t) });
    }
  });

  return events.sort((a, b) => moment(b.at).valueOf() - moment(a.at).valueOf()).slice(0, 8);
};

const NotificationPanel = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  // buildEvents needs the whole ticket list, which is far too heavy to pull on
  // a timer for a menu that is closed almost all the time. It is fetched once
  // so the bell badge has a count, then refreshed each time the menu is opened
  // — the only moment the list itself is actually on screen.
  const load = useCallback(
    () =>
      getTicketList()
        .then((tickets) => setEvents(buildEvents(tickets)))
        .catch(() => {}),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleOpen = (event) => {
    setAnchorEl(event.currentTarget);
    load();
  };

  const handleClick = (ticket) => {
    setAnchorEl(null);
    const path = resolvePartyType(ticket.user_type) === "Dealer" ? "dealer" : "customer";
    navigate(`/support/${path}?ticket=${ticket._id}`);
  };

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton onClick={handleOpen} sx={{ color: "text.secondary" }}>
          <Badge badgeContent={events.length} color="error" max={9}>
            <NotificationsNone sx={{ fontSize: 20 }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 340, maxHeight: 420, borderRadius: "14px", border: "1px solid #f1f5f9" } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #f1f5f9" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Notifications</Typography>
        </Box>
        {events.length === 0 ? (
          <Typography variant="caption" sx={{ display: "block", textAlign: "center", py: 4, color: "#94a3b8" }}>
            Nothing new.
          </Typography>
        ) : (
          events.map((ev, i) => {
            const meta = EVENT_META[ev.type];
            const Icon = meta.icon;
            return (
              <Stack
                key={`${ev.ticket._id}-${ev.type}-${i}`}
                direction="row"
                spacing={1.2}
                alignItems="flex-start"
                onClick={() => handleClick(ev.ticket)}
                sx={{ px: 2, py: 1.2, cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}
              >
                <Icon sx={{ fontSize: 18, color: meta.color, mt: 0.2 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }} noWrap>
                    {ev.type === "new" ? "New ticket" : ev.type === "reply" ? "New reply" : "Ticket closed"} — {ev.ticket.subject}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                    {resolvePartyType(ev.ticket.user_type)} · {moment(ev.at).fromNow()}
                  </Typography>
                </Box>
              </Stack>
            );
          })
        )}
      </Menu>
    </>
  );
};

export default NotificationPanel;

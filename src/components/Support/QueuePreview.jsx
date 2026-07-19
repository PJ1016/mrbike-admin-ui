import React from "react";
import { Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import moment from "moment";
import StatusBadge from "./StatusBadge";
import { resolvePartyType, getLastActivityAt } from "../../utils/ticketHelpers";

const QueuePreview = ({ title, accentColor = "#2563eb", tickets, onViewAll, onTicketClick }) => (
  <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #f1f5f9", overflow: "hidden", height: "100%" }}>
    <Box sx={{ p: 2, pl: 2.5, borderLeft: `4px solid ${accentColor}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "#0f172a" }}>
        {title}
      </Typography>
      <Typography variant="caption" onClick={onViewAll} sx={{ color: accentColor, fontWeight: 700, cursor: "pointer" }}>
        View all →
      </Typography>
    </Box>
    <Box sx={{ px: 1, pb: 1 }}>
      {tickets.length === 0 ? (
        <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", textAlign: "center", py: 3 }}>
          No tickets yet.
        </Typography>
      ) : (
        tickets.map((t) => (
          <Stack
            key={t._id}
            direction="row"
            alignItems="center"
            spacing={1.5}
            onClick={() => onTicketClick(t)}
            sx={{ p: 1.2, borderRadius: "10px", cursor: "pointer", "&:hover": { bgcolor: "#f8fafc" } }}
          >
            <Avatar sx={{ width: 30, height: 30, bgcolor: `${accentColor}15`, color: accentColor, fontSize: "0.8rem" }}>
              {resolvePartyType(t.user_type).slice(0, 1)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }} noWrap>
                {t.subject}
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                {moment(getLastActivityAt(t)).fromNow()}
              </Typography>
            </Box>
            <StatusBadge status={t.status} />
          </Stack>
        ))
      )}
    </Box>
  </Paper>
);

export default QueuePreview;

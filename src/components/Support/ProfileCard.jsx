import React from "react";
import { Avatar, Box, Paper, Stack, Typography } from "@mui/material";
import { resolvePartyType } from "../../utils/ticketHelpers";

// Kept intentionally minimal — the ticket payload only ever carries user_type,
// not a name/phone/bike/workshop, so this only shows what's actually real.
const ProfileCard = ({ ticket, accentColor = "#2563eb" }) => {
  const partyType = resolvePartyType(ticket.user_type);

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: "1px solid #f1f5f9" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Avatar sx={{ bgcolor: `${accentColor}15`, color: accentColor, fontWeight: 700, width: 44, height: 44 }}>
          {partyType.slice(0, 1)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
            {partyType}
          </Typography>
          <Typography variant="caption" sx={{ color: "#94a3b8" }}>
            Ticket #{ticket.ticketNo || ticket._id}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ProfileCard;

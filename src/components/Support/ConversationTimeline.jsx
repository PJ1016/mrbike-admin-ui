import React from "react";
import { Avatar, Box, Chip, Stack, Typography } from "@mui/material";
import moment from "moment";
import { resolveSenderLabel, isAdminSender } from "../../utils/ticketHelpers";

const dayKey = (iso) => {
  try {
    return moment(iso).format("YYYY-MM-DD");
  } catch {
    return "";
  }
};

const dayLabel = (iso) => {
  const m = moment(iso);
  if (m.isSame(moment(), "day")) return "Today";
  if (m.isSame(moment().subtract(1, "day"), "day")) return "Yesterday";
  return m.format("D MMM YYYY");
};

const ConversationTimeline = ({ messages, accentColor = "#2563eb", bottomRef }) => {
  if (!messages?.length) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          No messages yet. Start the conversation.
        </Typography>
      </Box>
    );
  }

  let lastDay = null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
      {messages.map((m) => {
        const senderType = m.sender_type;
        const admin = isAdminSender(senderType);
        const label = resolveSenderLabel(senderType);
        const day = dayKey(m.timestamp);
        const showDivider = day !== lastDay;
        lastDay = day;

        return (
          <React.Fragment key={m._id || `${m.timestamp}-${m.message?.slice(0, 8)}`}>
            {showDivider && (
              <Box sx={{ display: "flex", justifyContent: "center", my: 1.5 }}>
                <Chip label={dayLabel(m.timestamp)} size="small" sx={{ bgcolor: "#f1f5f9", color: "#64748b", fontWeight: 600, fontSize: "0.68rem" }} />
              </Box>
            )}
            <Stack direction="row" spacing={1} justifyContent={admin ? "flex-end" : "flex-start"} sx={{ mb: 1.5 }}>
              {!admin && (
                <Avatar sx={{ width: 30, height: 30, bgcolor: "#e2e8f0", color: "#475569", fontSize: "0.8rem" }}>
                  {label.slice(0, 1)}
                </Avatar>
              )}
              <Box sx={{ maxWidth: "70%" }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "16px",
                    borderBottomRightRadius: admin ? "6px" : "16px",
                    borderBottomLeftRadius: admin ? "16px" : "6px",
                    bgcolor: admin ? accentColor : "#f1f5f9",
                    color: admin ? "#fff" : "#0f172a",
                  }}
                >
                  <Typography variant="body2">{m.message}</Typography>
                </Box>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 0.4, color: "#94a3b8", textAlign: admin ? "right" : "left" }}
                >
                  {label} · {moment(m.timestamp).format("h:mm A")}
                </Typography>
              </Box>
              {admin && (
                <Avatar sx={{ width: 30, height: 30, bgcolor: accentColor, color: "#fff", fontSize: "0.8rem" }}>A</Avatar>
              )}
            </Stack>
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} />
    </Box>
  );
};

export default ConversationTimeline;

import React, { useState } from "react";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import WifiOffIcon from "@mui/icons-material/WifiOff";

const NoInternetOverlay = ({ onRetry }) => {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <Box
      role="alertdialog"
      aria-live="assertive"
      aria-label="No internet connection"
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2.5,
        bgcolor: "#f8fafc",
        px: 3,
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          bgcolor: "#eff6ff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
        }}
      >
        <WifiOffIcon sx={{ fontSize: 44, color: "#2563eb" }} />
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, color: "#0f172a" }}>
        No Internet Connection
      </Typography>

      <Typography variant="body1" sx={{ color: "#64748b", maxWidth: 420 }}>
        Please check your Wi-Fi or network cable. We'll reconnect
        automatically as soon as your connection is back.
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 1 }}>
        <CircularProgress size={18} thickness={5} sx={{ color: "#2563eb" }} />
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          Waiting to reconnect…
        </Typography>
      </Box>

      {onRetry && (
        <Button
          variant="contained"
          onClick={handleRetry}
          disabled={retrying}
          sx={{ mt: 1 }}
        >
          {retrying ? "Checking..." : "Retry Now"}
        </Button>
      )}
    </Box>
  );
};

export default NoInternetOverlay;

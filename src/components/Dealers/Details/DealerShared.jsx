import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Modal,
  Tooltip,
  IconButton,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { getImageUrl } from "./dealerUtils";

export function ImagePreview({ src, label, showDownload = false }) {
  const [open, setOpen] = useState(false);
  const imageUrl = getImageUrl(src);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = label || "document";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  return (
    <Box>
      <Typography
        variant="caption"
        fontWeight="700"
        color="text.secondary"
        sx={{ display: "block", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>

      {src ? (
        <>
          <Box sx={{ position: "relative", display: "inline-block" }}>
            <Box
              component="img"
              src={imageUrl || "/placeholder.svg"}
              alt={label}
              onClick={() => setOpen(true)}
              sx={{
                width: "100%",
                maxWidth: 220,
                height: 140,
                objectFit: "cover",
                cursor: "pointer",
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                display: "block",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: 4,
                  borderColor: "primary.main",
                },
              }}
            />
            {showDownload && (
              <Tooltip title="Download">
                <IconButton
                  size="small"
                  onClick={handleDownload}
                  sx={{
                    position: "absolute",
                    bottom: 6,
                    right: 6,
                    bgcolor: "rgba(255,255,255,0.9)",
                    boxShadow: 1,
                    "&:hover": { bgcolor: "white" },
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Modal
            open={open}
            onClose={() => setOpen(false)}
            sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}
          >
            <Box
              component="img"
              src={imageUrl || "/placeholder.svg"}
              sx={{
                maxWidth: "90vw",
                maxHeight: "90vh",
                outline: "none",
                borderRadius: 2,
                boxShadow: 24,
              }}
            />
          </Modal>
        </>
      ) : (
        <Chip
          label="Not Uploaded"
          size="small"
          variant="outlined"
          color="default"
          sx={{ borderRadius: 1 }}
        />
      )}
    </Box>
  );
}

export function InfoField({ label, value, mono = false, color }) {
  return (
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight="700"
        sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight="600"
        color={color || "text.primary"}
        sx={mono ? { fontFamily: "monospace", letterSpacing: 1 } : {}}
      >
        {value || "N/A"}
      </Typography>
    </Box>
  );
}

export function SectionHeader({ icon, title }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 2.5,
        pb: 1.5,
        borderBottom: "2px solid",
        borderColor: "primary.main",
      }}
    >
      {icon && (
        <Box sx={{ color: "primary.main", display: "flex", alignItems: "center" }}>
          {icon}
        </Box>
      )}
      <Typography variant="subtitle1" fontWeight="800" color="primary.main" sx={{ letterSpacing: 0.3 }}>
        {title}
      </Typography>
    </Box>
  );
}

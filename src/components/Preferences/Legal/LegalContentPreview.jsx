import React from "react";
import { Box } from "@mui/material";

// Read-only rendering of a legal document's HTML — shared by the View
// drawer and the Edit drawer's in-place "Preview" mode so both show the
// content exactly as the User App / Dealer App / Website will render it.
// `content` only ever comes from our own RichTextEditor, never third-party
// input, so dangerouslySetInnerHTML is safe here.
const LegalContentPreview = ({ content, accentColor = "#0f766e" }) => (
  <Box
    sx={{
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      bgcolor: "#fff",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      overflow: "hidden",
    }}
  >
    <Box
      sx={{
        maxWidth: 820,
        mx: "auto",
        p: { xs: 3, md: 5 },
        fontSize: "0.95rem",
        lineHeight: 1.75,
        color: "#1e293b",
        "& h1": { fontSize: "1.9rem", fontWeight: 800, mt: 3, mb: 1.5, "&:first-of-type": { mt: 0 } },
        "& h2": { fontSize: "1.5rem", fontWeight: 700, mt: 2.5, mb: 1.25 },
        "& h3": { fontSize: "1.25rem", fontWeight: 700, mt: 2, mb: 1 },
        "& h4, & h5, & h6": { fontWeight: 700, mt: 1.5, mb: 1 },
        "& p": { mb: 1.4 },
        "& ul, & ol": { pl: 3, mb: 1.4 },
        "& blockquote": {
          borderLeft: `3px solid ${accentColor}55`,
          pl: 1.5,
          ml: 0,
          color: accentColor,
          fontStyle: "italic",
        },
        "& a": { color: accentColor, fontWeight: 600 },
        "& table": { borderCollapse: "collapse", width: "100%", my: 2 },
        "& td, & th": { border: "1px solid #e2e8f0", p: 1 },
        "& img": { maxWidth: "100%", borderRadius: "6px", my: 1.5 },
      }}
      dangerouslySetInnerHTML={{
        __html: content || "<p style='color:#94a3b8'>No content added yet.</p>",
      }}
    />
  </Box>
);

export default LegalContentPreview;

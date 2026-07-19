import React from "react";
import { Box, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import FormDrawer from "../shared/FormDrawer";
import LegalContentPreview from "./LegalContentPreview";

const ACCENT = "#0f766e";

const audienceColor = (audience) =>
  audience === "User" ? "#2563eb" : audience === "Dealer" ? "#9333ea" : ACCENT;

const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never updated";

// Full-screen, read-only view of a single legal document. Renders through
// the same LegalContentPreview used by the editor's Preview mode, so what's
// shown here matches exactly what the User App / Dealer App / Website will
// render from this document's stored HTML.
const LegalDocumentViewDrawer = ({ open, doc, onClose }) => (
  <FormDrawer
    open={open}
    onClose={onClose}
    title={doc?.label}
    subtitle="DOCUMENT DETAILS"
    fullScreen
    accentColor={ACCENT}
    hideFooter
  >
    {doc && (
      <Stack spacing={2.5} sx={{ flex: 1 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="text.secondary">
              Audience
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={doc.audience}
                size="small"
                sx={{ bgcolor: `${audienceColor(doc.audience)}15`, color: audienceColor(doc.audience), fontWeight: 700 }}
              />
            </Box>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant="caption" color="text.secondary">
              Published Status
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={doc.isPublished ? "Published" : "Draft"}
                size="small"
                sx={{
                  bgcolor: doc.isPublished ? "#ecfdf5" : "#f1f5f9",
                  color: doc.isPublished ? "#059669" : "#94a3b8",
                  fontWeight: 700,
                }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="caption" color="text.secondary">
              Last Updated
            </Typography>
            <Typography variant="body1" fontWeight={700}>
              {fmtDateTime(doc.updatedAt)}
            </Typography>
          </Grid>
        </Grid>

        <Divider />

        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            Content
          </Typography>
          <LegalContentPreview content={doc.content} accentColor={ACCENT} />
        </Box>
      </Stack>
    )}
  </FormDrawer>
);

export default LegalDocumentViewDrawer;

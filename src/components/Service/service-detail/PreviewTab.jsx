import React, { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  AlertTitle,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import { getServiceDetailPreview } from "../../../api";
import { getYoutubeEmbedUrl } from "./MediaTab";

// Phone-width frame so the admin reads the content at roughly the proportions
// a rider will. Deliberately not a pixel-perfect app mock — it renders the
// real merged payload, which is the part worth checking.
const PHONE_WIDTH = 390;

const Section = ({ title, items, icon: Icon }) => {
  if (!items?.length) return null;
  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Stack spacing={1}>
        {items.map((item, index) => (
          <Stack key={`${item.title}-${index}`} direction="row" spacing={1} alignItems="flex-start">
            <Icon sx={{ fontSize: 18, color: "#2563eb", mt: "1px" }} />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {item.title}
              </Typography>
              {item.description && (
                <Typography variant="caption" color="text.secondary">
                  {item.description}
                </Typography>
              )}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

/**
 * Preview tab.
 *
 * Fetches GET /admin/services/:id/detail/preview, which runs the SAME
 * mergeServiceDetail() helper the public GET /api/v1/services/:id uses — just
 * with unpublished content included. That means what's shown here cannot
 * drift from what the app will actually receive, which a hand-built local
 * preview would.
 *
 * `refreshKey` changes after every save so the preview always reflects
 * persisted content, never unsaved form state.
 */
const PreviewTab = ({ serviceId, refreshKey }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getServiceDetailPreview(serviceId);
        if (cancelled) return;
        if (res?.status) {
          setData(res.data);
          setMeta(res.meta);
        } else {
          setError(res?.message || "Could not load preview");
        }
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || "Could not load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [serviceId, refreshKey]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!data) return null;

  const videoEmbedUrl = getYoutubeEmbedUrl(data.videoUrl);
  const blockers = meta?.publishBlockers || [];

  return (
    <Stack spacing={2.5}>
      <Alert severity={meta?.isPublished ? "success" : "info"}>
        <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>
          {meta?.isPublished ? "Published — live in the rider app" : "Draft — not visible in the rider app"}
        </AlertTitle>
        <Typography variant="body2">
          This preview shows saved content only. Save your changes to see them here.
        </Typography>
      </Alert>

      {blockers.length > 0 && (
        <Alert severity="warning">
          <AlertTitle sx={{ fontWeight: 700 }}>Not ready to publish</AlertTitle>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {blockers.map((blocker) => (
              <li key={blocker}>
                <Typography variant="body2">{blocker}</Typography>
              </li>
            ))}
          </Box>
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: PHONE_WIDTH,
            border: "1px solid #e2e8f0",
            borderRadius: 4,
            overflow: "hidden",
            bgcolor: "#fff",
          }}
        >
          {data.coverImage && (
            <Box
              component="img"
              src={data.coverImage}
              alt={data.name}
              sx={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", display: "block" }}
            />
          )}

          {data.images?.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ p: 1, overflowX: "auto" }}>
              {data.images.map((img) => (
                <Box
                  key={img.url}
                  component="img"
                  src={img.url}
                  alt={img.alt || ""}
                  sx={{
                    width: 64,
                    height: 48,
                    objectFit: "cover",
                    borderRadius: 1,
                    flexShrink: 0,
                    border: img.isCover ? "2px solid #2563eb" : "1px solid #e2e8f0",
                  }}
                />
              ))}
            </Stack>
          )}

          <Box sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={800}>
              {data.name}
            </Typography>
            {data.shortDescription && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {data.shortDescription}
              </Typography>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
              {data.fromPrice != null && (
                <Chip size="small" color="primary" label={`From ₹${data.fromPrice}`} sx={{ fontWeight: 700 }} />
              )}
              {data.durationMinutes ? <Chip size="small" label={`${data.durationMinutes} min`} /> : null}
              {data.warrantyText && <Chip size="small" label={data.warrantyText} />}
              {data.recommendedInterval && <Chip size="small" label={data.recommendedInterval} />}
              {data.pickupAvailable && <Chip size="small" label="Pickup available" />}
            </Stack>

            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {data.providerCount} garage{data.providerCount === 1 ? "" : "s"} offering this service
            </Typography>

            {videoEmbedUrl && (
              <Box
                component="iframe"
                src={videoEmbedUrl}
                title="Service video"
                sx={{ mt: 2, width: "100%", aspectRatio: "16/9", border: 0, borderRadius: 2 }}
                allowFullScreen
              />
            )}

            {data.fullDescription && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box
                  sx={{
                    "& p": { margin: "0 0 8px" },
                    "& ul, & ol": { paddingLeft: "20px", margin: "0 0 8px" },
                    "& img": { maxWidth: "100%" },
                    "& table": { width: "100%", borderCollapse: "collapse" },
                    "& td, & th": { border: "1px solid #e2e8f0", padding: "4px 6px" },
                    fontSize: "0.875rem",
                    color: "#334155",
                  }}
                  // Content is sanitized server-side on every write through
                  // utils/sanitizeHtml.js before it can ever be stored.
                  dangerouslySetInnerHTML={{ __html: data.fullDescription }}
                />
              </>
            )}

            <Section title="What's included" items={data.essentialItems} icon={CheckCircleOutlineIcon} />
            <Section title="Optional add-ons" items={data.optionalItems} icon={AddCircleOutlineIcon} />
            <Section title="Benefits" items={data.benefits} icon={StarOutlineIcon} />

            {data.faqs?.length > 0 && (
              <Box sx={{ mt: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
                  Frequently asked questions
                </Typography>
                {data.faqs.map((faq, index) => (
                  <Accordion key={`${faq.question}-${index}`} disableGutters elevation={0} sx={{ border: "1px solid #e2e8f0", "&:before": { display: "none" } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="body2" fontWeight={600}>
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box
                        sx={{ fontSize: "0.825rem", color: "#475569", "& p": { margin: "0 0 6px" } }}
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Stack>
  );
};

export default PreviewTab;

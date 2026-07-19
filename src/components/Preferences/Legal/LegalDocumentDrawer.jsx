import React, { useEffect, useState } from "react";
import { Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { EditNote, Visibility } from "@mui/icons-material";
import FormDrawer from "../shared/FormDrawer";
import RichTextEditor from "../shared/RichTextEditor";
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

// Full-screen edit surface for a single legal document. `doc` is the merged
// row object from Legal.jsx (LEGAL_DOC_TYPES entry + whatever content/status
// the API returned) — this is always an edit surface, there is no create
// mode since the 8 document types are a fixed catalog, not user-creatable.
//
// Save Draft and Publish both go through the same `onSave(payload)` prop
// Legal.jsx already wires up (it just calls updateLegalDocument(key,
// payload)) — they only differ in the `isPublished` flag they send, so no
// change to Legal.jsx or the API layer was needed for this upgrade.
const LegalDocumentDrawer = ({ open, doc, saving, onClose, onSave }) => {
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (open && doc) {
      setContent(doc.content || "");
      setIsPublished(doc.isPublished ?? false);
      setPreviewMode(false);
    }
  }, [open, doc]);

  const handleSaveDraft = () => {
    setIsPublished(false);
    onSave({ content, isPublished: false });
  };

  const handlePublish = () => {
    setIsPublished(true);
    onSave({ content, isPublished: true });
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={doc?.label || "Edit Document"}
      subtitle="LEGAL DOCUMENT EDITOR"
      fullScreen
      accentColor={ACCENT}
      loading={false}
      footer={
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1}>
          <Button
            size="small"
            startIcon={previewMode ? <EditNote fontSize="small" /> : <Visibility fontSize="small" />}
            onClick={() => setPreviewMode((v) => !v)}
            sx={{ fontWeight: 700, color: ACCENT }}
          >
            {previewMode ? "Back to Editor" : "Preview"}
          </Button>
          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" onClick={onClose} disabled={saving} sx={{ fontWeight: 700, minWidth: 96 }}>
              Cancel
            </Button>
            <Button variant="outlined" onClick={handleSaveDraft} disabled={saving} sx={{ fontWeight: 700, minWidth: 120, color: ACCENT, borderColor: ACCENT }}>
              Save Draft
            </Button>
            <Button
              variant="contained"
              onClick={handlePublish}
              disabled={saving}
              sx={{ fontWeight: 700, minWidth: 120, bgcolor: ACCENT, "&:hover": { bgcolor: "#0d5f59" } }}
            >
              Publish
            </Button>
          </Stack>
        </Stack>
      }
    >
      {doc && (
        <Stack spacing={2.5} sx={{ flex: 1, minHeight: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" rowGap={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={doc.audience}
                size="small"
                sx={{ bgcolor: `${audienceColor(doc.audience)}15`, color: audienceColor(doc.audience), fontWeight: 700 }}
              />
              <Chip
                label={isPublished ? "Published" : "Draft"}
                size="small"
                sx={{
                  bgcolor: isPublished ? "#ecfdf5" : "#f1f5f9",
                  color: isPublished ? "#059669" : "#94a3b8",
                  fontWeight: 700,
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: "#94a3b8", fontWeight: 600 }}>
              Last updated: {fmtDateTime(doc.updatedAt)}
            </Typography>
          </Stack>

          <Divider />

          <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a", mb: 1 }}>
              {previewMode ? "Preview — exactly what User App, Dealer App and the Website will render" : "Content"}
            </Typography>
            {previewMode ? (
              <LegalContentPreview content={content} accentColor={ACCENT} />
            ) : (
              <RichTextEditor
                value={content}
                onChange={setContent}
                minHeight={420}
                placeholder={`Write the ${doc.label} content…`}
              />
            )}
          </Box>
        </Stack>
      )}
    </FormDrawer>
  );
};

export default LegalDocumentDrawer;

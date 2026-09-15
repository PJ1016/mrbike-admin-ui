import React, { useState } from "react";
import { Box, Button, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SortableList, { DragHandle } from "./SortableList";
import ServiceFaqDrawer from "./ServiceFaqDrawer";

const stripHtml = (html) => (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

/**
 * FAQs tab — per-service question/answer rows, drag-ordered.
 *
 * Rows are edited in a drawer rather than inline because answers are rich
 * text; this reuses the same FormDrawer + RichTextEditor pairing the app-wide
 * FAQ manager already uses, so the authoring experience is identical.
 */
const FaqsTab = ({ faqs, onChange }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);

  const editingFaq = editingKey ? faqs.find((f) => f._key === editingKey) : null;

  const handleSave = (payload) => {
    if (editingKey) {
      onChange(faqs.map((f) => (f._key === editingKey ? { ...f, ...payload } : f)));
    } else {
      onChange([...faqs, { ...payload, _key: `faq-${Date.now()}-${Math.random()}` }]);
    }
    setDrawerOpen(false);
    setEditingKey(null);
  };

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} flexWrap="wrap">
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Service FAQs
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Drag to reorder — this is the order riders see. These are specific to this service and are
            separate from the app-wide FAQs under Preferences.
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingKey(null);
            setDrawerOpen(true);
          }}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Add FAQ
        </Button>
      </Stack>

      <Box sx={{ mt: 2 }}>
        {faqs.length === 0 ? (
          <Box sx={{ border: "1px dashed #cbd5e1", borderRadius: 2, py: 5, textAlign: "center", bgcolor: "#f8fafc" }}>
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              No FAQs yet
            </Typography>
            <Typography variant="caption" color="text.secondary">
              FAQs are optional, but they answer the questions riders ask before booking.
            </Typography>
          </Box>
        ) : (
          <SortableList items={faqs} getId={(faq) => faq._key} onReorder={onChange}>
            {({ item, index, attributes, listeners }) => (
              <Paper
                elevation={0}
                sx={{ p: 1.5, mb: 1.5, borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "#fff" }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <DragHandle attributes={attributes} listeners={listeners} sx={{ mt: 0.5 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                      {index + 1}. {item.question || <em>Untitled question</em>}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {stripHtml(item.answer) || "No answer yet"}
                    </Typography>
                  </Box>
                  <Stack direction="row">
                    <Tooltip title="Edit FAQ">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingKey(item._key);
                          setDrawerOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove FAQ">
                      <IconButton size="small" onClick={() => onChange(faqs.filter((f) => f._key !== item._key))}>
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            )}
          </SortableList>
        )}
      </Box>

      <ServiceFaqDrawer
        open={drawerOpen}
        faq={editingFaq}
        onClose={() => {
          setDrawerOpen(false);
          setEditingKey(null);
        }}
        onSave={handleSave}
      />
    </Box>
  );
};

export default FaqsTab;

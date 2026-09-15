import React from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SortableList, { DragHandle } from "./SortableList";

// Every row carries a client-only `_key` so dnd-kit has a stable id even
// while the title is still empty (two blank new rows would otherwise collide
// on the same id and break dragging). It is stripped before saving.
export const withKeys = (items = []) =>
  items.map((item, index) => ({ ...item, _key: item._key || `item-${Date.now()}-${index}-${Math.random()}` }));

export const stripKeys = (items = []) =>
  items.map(({ _key, ...rest }) => rest);

const SECTIONS = [
  {
    field: "essentialItems",
    title: "Essential Items",
    hint: "What this service always includes. Shown as the main checklist on the detail screen.",
    placeholder: "e.g. Engine oil change",
  },
  {
    field: "optionalItems",
    title: "Optional Items",
    hint: "Extras a rider can expect to be offered. Informational copy only — these are not chargeable add-ons.",
    placeholder: "e.g. Chain lubrication",
  },
  {
    field: "benefits",
    title: "Benefits",
    hint: "Why a rider should pick this service.",
    placeholder: "e.g. Free doorstep pickup",
  },
];

const ItemSection = ({ section, items, onChange }) => {
  const handleAdd = () => {
    onChange([...items, { _key: `item-${Date.now()}-${Math.random()}`, title: "", description: "", icon: "" }]);
  };

  const handleField = (key, field) => (event) => {
    onChange(items.map((item) => (item._key === key ? { ...item, [field]: event.target.value } : item)));
  };

  const handleRemove = (key) => {
    onChange(items.filter((item) => item._key !== key));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} flexWrap="wrap">
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            {section.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {section.hint}
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Add item
        </Button>
      </Stack>

      <Box sx={{ mt: 1.5 }}>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 2, fontStyle: "italic" }}>
            No items yet.
          </Typography>
        ) : (
          <SortableList items={items} getId={(item) => item._key} onReorder={onChange}>
            {({ item, attributes, listeners }) => (
              <Paper
                elevation={0}
                sx={{ p: 1.5, mb: 1.5, borderRadius: 2, border: "1px solid #e2e8f0", bgcolor: "#fff" }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <DragHandle attributes={attributes} listeners={listeners} sx={{ mt: 1 }} />
                  <Stack spacing={1.25} sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Title"
                      required
                      value={item.title}
                      onChange={handleField(item._key, "title")}
                      placeholder={section.placeholder}
                      error={!item.title.trim()}
                      helperText={!item.title.trim() ? "Title is required" : " "}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Description (optional)"
                      value={item.description || ""}
                      onChange={handleField(item._key, "description")}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                  <Tooltip title="Remove item">
                    <IconButton size="small" onClick={() => handleRemove(item._key)} sx={{ mt: 0.5 }}>
                      <DeleteIcon fontSize="small" color="error" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Paper>
            )}
          </SortableList>
        )}
      </Box>
    </Box>
  );
};

/**
 * Content tab: the three ordered bullet lists.
 *
 * "Optional Items" is informational copy describing what a rider may be
 * offered — it is NOT the bookable `additionalServices` collection that
 * bookings and pricing reference. The two are deliberately kept apart.
 */
const ContentTab = ({ content, onChange }) => (
  <Stack spacing={3} divider={<Divider />}>
    {SECTIONS.map((section) => (
      <ItemSection
        key={section.field}
        section={section}
        items={content[section.field] || []}
        onChange={(next) => onChange(section.field, next)}
      />
    ))}
  </Stack>
);

export default ContentTab;

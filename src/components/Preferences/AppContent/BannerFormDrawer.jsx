import React, { useEffect, useState } from "react";
import { Box, Divider, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import FormDrawer from "../shared/FormDrawer";
import ImageUploadField from "../shared/ImageUploadField";
import { BANNER_TYPES } from "../../../api/preferences/appContentApi";

const ACCENTS = {
  [BANNER_TYPES.POPUP]: "#7c3aed",
  [BANNER_TYPES.ANNOUNCEMENT]: "#ea580c",
};

const TYPE_OPTIONS = [
  { value: BANNER_TYPES.POPUP, label: "Popup" },
  { value: BANNER_TYPES.ANNOUNCEMENT, label: "Announcement" },
];

const emptyForm = {
  type: TYPE_OPTIONS[0].value,
  title: "",
  linkUrl: "",
  displayOrder: "",
  scheduleStart: "",
  scheduleEnd: "",
  isActive: true,
};

// Create/Edit drawer for an App Popups banner (Popup / Announcement). `banner`
// is null for create, or the normalized row object for edit. Builds a
// multipart FormData payload and hands it, plus the selected Type, back to
// the parent's onSave — the parent (AppPopupsManager) owns the actual
// create/update API call since it knows which bannerType collection to hit.
// The Type field is locked once editing an existing banner: the backend has
// no endpoint to move a banner between bannerType collections.
const BannerFormDrawer = ({ open, banner, saving, onClose, onSave }) => {
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});

  const accentColor = ACCENTS[form.type] || "#7c3aed";

  useEffect(() => {
    if (open) {
      setForm(
        banner
          ? {
              type: banner.bannerType || TYPE_OPTIONS[0].value,
              title: banner.title || "",
              linkUrl: banner.linkUrl || "",
              displayOrder: banner.displayOrder ?? "",
              scheduleStart: banner.scheduleStart ? banner.scheduleStart.slice(0, 10) : "",
              scheduleEnd: banner.scheduleEnd ? banner.scheduleEnd.slice(0, 10) : "",
              isActive: banner.isActive ?? true,
            }
          : emptyForm
      );
      setImage(null);
      setErrors({});
    }
  }, [open, banner]);

  const handleChange = (field) => (e) => {
    const value = field === "isActive" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!banner && !image) e.image = "Banner image is required";
    if (form.scheduleStart && form.scheduleEnd && form.scheduleEnd < form.scheduleStart) {
      e.scheduleEnd = "Must be after Schedule Start";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const fd = new FormData();
    fd.append("title", form.title.trim());
    fd.append("linkUrl", form.linkUrl.trim());
    fd.append("displayOrder", form.displayOrder === "" ? "0" : String(Number(form.displayOrder)));
    fd.append("scheduleStart", form.scheduleStart || "");
    fd.append("scheduleEnd", form.scheduleEnd || "");
    fd.append("isActive", String(form.isActive));
    if (image) fd.append("image", image);
    onSave(fd, form.type);
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={banner ? "Edit Banner" : "Create Banner"}
      subtitle="APP CONTENT"
      saving={saving}
      onSave={handleSave}
      saveLabel={banner ? "Update" : "Create"}
      accentColor={accentColor}
    >
      <Stack spacing={2.5}>
        <ImageUploadField
          label="Banner Image"
          required={!banner}
          file={image}
          existingUrl={banner?.image}
          onFileChange={setImage}
          onRemove={() => setImage(null)}
          error={errors.image}
          height={160}
        />

        <Divider />

        <TextField
          select
          fullWidth
          label="Type"
          value={form.type}
          onChange={handleChange("type")}
          disabled={Boolean(banner)}
          helperText={banner ? "Type cannot be changed after creation" : "Choose where this appears in the app"}
          size="small"
          InputLabelProps={{ shrink: true }}
        >
          {TYPE_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label="Title"
          value={form.title}
          onChange={handleChange("title")}
          error={!!errors.title}
          helperText={errors.title}
          placeholder="e.g. Monsoon Service Offer"
          size="small"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          label="Link URL"
          value={form.linkUrl}
          onChange={handleChange("linkUrl")}
          helperText="Where tapping this banner navigates to"
          placeholder="e.g. /offers/monsoon-service"
          size="small"
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          fullWidth
          type="number"
          label="Display Order"
          value={form.displayOrder}
          onChange={handleChange("displayOrder")}
          helperText="Lower numbers appear first"
          size="small"
          InputLabelProps={{ shrink: true }}
        />

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            type="date"
            label="Schedule Start Date"
            value={form.scheduleStart}
            onChange={handleChange("scheduleStart")}
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText="Optional"
          />
          <TextField
            fullWidth
            type="date"
            label="Schedule End Date"
            value={form.scheduleEnd}
            onChange={handleChange("scheduleEnd")}
            error={!!errors.scheduleEnd}
            helperText={errors.scheduleEnd || "Optional"}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </Stack>

        <Divider />

        <FormControlLabel
          control={<Switch checked={form.isActive} onChange={handleChange("isActive")} color="success" />}
          label={
            <Box>
              <Typography variant="body2" fontWeight={600}>Active Status</Typography>
              <Typography variant="caption" color="text.secondary">Inactive banners are hidden from the customer app</Typography>
            </Box>
          }
        />
      </Stack>
    </FormDrawer>
  );
};

export default BannerFormDrawer;

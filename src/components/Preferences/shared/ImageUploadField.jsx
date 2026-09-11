import React, { useEffect, useState } from "react";
import { Alert, Box, Button, IconButton, Typography } from "@mui/material";
import { AddPhotoAlternate, Delete } from "@mui/icons-material";
import { formatSpec, validateBannerImage } from "../../../utils/bannerImageSpecs";

// Reusable image upload box (upload → preview → remove), generalized from
// the pattern in LocationFeaturedCategoryForm so every Preferences module
// (Campaigns banner, App Content banners) shares one upload control.
//
// Pass `spec` (from utils/bannerImageSpecs) to lock the field to one exact
// pixel size: the file is measured before it ever reaches the parent, and a
// wrong-size image is rejected in place instead of being uploaded and cropped
// by the app.
const ImageUploadField = ({
  label = "Image",
  required = false,
  file,
  existingUrl,
  onFileChange,
  onRemove,
  error,
  helperText,
  height = 180,
  spec = null,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sizeError, setSizeError] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // A changed spec (e.g. the banner Type was switched) invalidates the old
  // rejection message — the parent clears the file alongside it.
  useEffect(() => {
    setSizeError(null);
  }, [spec]);

  const handleSelect = async (e) => {
    const selected = e.target.files?.[0];
    // Reset the input so re-picking the same rejected file fires onChange again.
    e.target.value = "";
    if (!selected) return;

    const result = await validateBannerImage(selected, spec);
    if (!result.ok) {
      setSizeError(result.message);
      onFileChange(null);
      return;
    }
    setSizeError(null);
    onFileChange(selected);
  };

  const handleRemove = () => {
    setSizeError(null);
    onRemove();
  };

  const displayUrl = previewUrl || existingUrl;
  const shownError = sizeError || error;
  const hint =
    helperText ||
    (spec ? `JPG, PNG, WEBP · exactly ${formatSpec(spec)} (Max 5MB)` : "JPG, PNG, WEBP (Max 5MB)");

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
        {label} {required && "*"}
      </Typography>
      {spec && (
        <Alert severity="info" icon={false} sx={{ mb: 1, py: 0.25, fontSize: 12 }}>
          <Typography variant="caption" fontWeight={700} display="block">
            Required size: {formatSpec(spec)} — other sizes are not accepted
          </Typography>
          {spec.note && (
            <Typography variant="caption" color="text.secondary">
              {spec.note}
            </Typography>
          )}
        </Alert>
      )}
      <Box
        sx={{
          width: "100%",
          height: displayUrl ? "auto" : height,
          minHeight: displayUrl ? 160 : height,
          borderRadius: 2,
          border: `1px dashed ${shownError ? "#d32f2f" : "#d1d5db"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          bgcolor: "#fafafa",
        }}
      >
        {displayUrl ? (
          <Box sx={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", p: 1.5 }}>
            <img src={displayUrl} alt={label} style={{ maxHeight: 220, maxWidth: "100%", borderRadius: 4, objectFit: "contain" }} />
            <IconButton
              onClick={handleRemove}
              size="small"
              sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "#fff" } }}
            >
              <Delete color="error" fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Button component="label" fullWidth sx={{ height: "100%", flexDirection: "column", gap: 1, color: "text.secondary", textTransform: "none" }}>
            <AddPhotoAlternate sx={{ fontSize: 30, color: "#9ca3af" }} />
            <Typography variant="body2" fontWeight={500}>Upload {label}</Typography>
            <Typography variant="caption" color="text.disabled">{hint}</Typography>
            <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={handleSelect} />
          </Button>
        )}
      </Box>
      {shownError && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: "block" }}>
          {shownError}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploadField;

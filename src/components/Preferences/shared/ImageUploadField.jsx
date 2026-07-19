import React, { useEffect, useState } from "react";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { AddPhotoAlternate, Delete } from "@mui/icons-material";

// Reusable image upload box (upload → preview → remove), generalized from
// the pattern in LocationFeaturedCategoryForm so every Preferences module
// (Campaigns banner, App Content banners) shares one upload control.
const ImageUploadField = ({
  label = "Image",
  required = false,
  file,
  existingUrl,
  onFileChange,
  onRemove,
  error,
  helperText = "JPG, PNG, WEBP (Max 5MB)",
  height = 180,
}) => {
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const displayUrl = previewUrl || existingUrl;

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
        {label} {required && "*"}
      </Typography>
      <Box
        sx={{
          width: "100%",
          height: displayUrl ? "auto" : height,
          minHeight: displayUrl ? 160 : height,
          borderRadius: 2,
          border: `1px dashed ${error ? "#d32f2f" : "#d1d5db"}`,
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
              onClick={onRemove}
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
            <Typography variant="caption" color="text.disabled">{helperText}</Typography>
            <input type="file" hidden accept="image/*" onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])} />
          </Button>
        )}
      </Box>
      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1, display: "block" }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploadField;

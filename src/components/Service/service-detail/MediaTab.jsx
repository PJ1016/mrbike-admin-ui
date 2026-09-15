import React, { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import SortableList, { DragHandle } from "./SortableList";
import { uploadServiceDetailMedia, deleteServiceDetailMedia } from "../../../api";

const MAX_IMAGES = 12;
const ACCEPTED = ".jpg,.jpeg,.png,.webp";

// Matches utils/youtube.js server-side. Client-side check is for instant
// feedback + the preview iframe only; the backend normalization is
// authoritative and is what actually gets stored.
const YOUTUBE_URL_PATTERN = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
export const getYoutubeEmbedUrl = (url) => {
  const match = (url || "").match(YOUTUBE_URL_PATTERN);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

/**
 * Media tab: gallery + video.
 *
 * Uploads go straight to S3 through the existing createS3Upload pipeline and
 * are persisted immediately — the server owns the image list, and every
 * mutation here re-renders from the list it returns rather than from local
 * guesswork. That is why this tab doesn't participate in the form's Save
 * button: an uploaded file is already stored, so a discarded edit elsewhere
 * can't orphan an S3 object.
 *
 * Self-hosted video (MP4) is deliberately not offered: utils/s3Upload.js
 * accepts no video types and the user app has no native player, only
 * react-native-youtube-iframe. Offering an upload we cannot play would be a
 * dead end, so video is a YouTube URL.
 */
const MediaTab = ({ serviceId, images, onImagesChange, videoUrl, onVideoUrlChange, baseImage }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingUrl, setDeletingUrl] = useState(null);

  const videoEmbedUrl = getYoutubeEmbedUrl(videoUrl);
  const videoInvalid = !!videoUrl?.trim() && !videoEmbedUrl;

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = ""; // allow re-picking the same file after a delete
    if (!files.length) return;

    if (images.length + files.length > MAX_IMAGES) {
      setError(`A service can have at most ${MAX_IMAGES} images.`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      const res = await uploadServiceDetailMedia(serviceId, formData);
      if (res?.status) onImagesChange(res.data.images);
      else setError(res?.message || "Upload failed");
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url) => {
    setError(null);
    setDeletingUrl(url);
    try {
      const res = await deleteServiceDetailMedia(serviceId, url);
      if (res?.status) onImagesChange(res.data.images);
      else setError(res?.message || "Delete failed");
    } catch (err) {
      setError(err.response?.data?.message || "Delete failed. Please try again.");
    } finally {
      setDeletingUrl(null);
    }
  };

  // Cover and order are part of the form payload (saved with the Save
  // button), unlike upload/delete which are immediate S3 operations.
  const handleSetCover = (url) => {
    onImagesChange(images.map((img) => ({ ...img, isCover: img.url === url })));
  };

  const handleReorder = (next) => {
    onImagesChange(next.map((img, index) => ({ ...img, order: index })));
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Service Images
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Drag to reorder. The starred image is the cover riders see first. {images.length}/{MAX_IMAGES} used.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={16} /> : <AddPhotoAlternateIcon />}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || images.length >= MAX_IMAGES}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {uploading ? "Uploading…" : "Upload images"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            accept={ACCEPTED}
            onChange={handleFiles}
          />
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          {images.length === 0 ? (
            <Box
              sx={{
                border: "1px dashed #cbd5e1",
                borderRadius: 2,
                py: 6,
                textAlign: "center",
                bgcolor: "#f8fafc",
              }}
            >
              <Typography variant="body2" fontWeight={600} color="text.secondary">
                No gallery images yet
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {baseImage
                  ? "The service's main image will be used until you add gallery images."
                  : "Upload at least one image before publishing."}
              </Typography>
            </Box>
          ) : (
            <SortableList
              items={images}
              getId={(img) => img.url}
              onReorder={handleReorder}
              layout="grid"
            >
              {({ item, attributes, listeners }) => (
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: 2,
                    overflow: "hidden",
                    border: item.isCover ? "2px solid #2563eb" : "1px solid #e2e8f0",
                    bgcolor: "#fff",
                  }}
                >
                  <Box
                    component="img"
                    src={item.url}
                    alt={item.alt || "Service image"}
                    sx={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }}
                  />
                  {item.isCover && (
                    <Chip
                      label="Cover"
                      size="small"
                      color="primary"
                      sx={{ position: "absolute", top: 8, left: 8, fontWeight: 700 }}
                    />
                  )}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 0.5, py: 0.5, borderTop: "1px solid #f1f5f9" }}
                  >
                    <DragHandle attributes={attributes} listeners={listeners} />
                    <Stack direction="row">
                      <Tooltip title={item.isCover ? "This is the cover" : "Make cover"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleSetCover(item.url)}
                            disabled={item.isCover}
                          >
                            {item.isCover ? (
                              <StarIcon fontSize="small" sx={{ color: "#f59e0b" }} />
                            ) : (
                              <StarBorderIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete image">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(item.url)}
                            disabled={deletingUrl === item.url}
                          >
                            {deletingUrl === item.url ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" color="error" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              )}
            </SortableList>
          )}
        </Box>
      </Box>

      <Divider />

      <Box>
        <Typography variant="subtitle1" fontWeight={700}>
          Service Video
        </Typography>
        <Typography variant="caption" color="text.secondary">
          YouTube only — the rider app plays embedded YouTube, not uploaded video files.
        </Typography>
        <TextField
          fullWidth
          size="small"
          sx={{ mt: 1.5 }}
          label="YouTube Video URL (optional)"
          placeholder="https://www.youtube.com/watch?v=…"
          value={videoUrl || ""}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          error={videoInvalid}
          helperText={
            videoInvalid
              ? "Enter a valid YouTube watch, youtu.be, shorts, or embed URL"
              : "Paste a watch, youtu.be, shorts, or embed URL — it is normalized on save"
          }
          InputLabelProps={{ shrink: true }}
        />
        {videoEmbedUrl && (
          <Box
            component="iframe"
            src={videoEmbedUrl}
            title="Service video preview"
            sx={{
              mt: 1.5,
              width: "100%",
              maxWidth: 480,
              aspectRatio: "16/9",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
            }}
            allowFullScreen
          />
        )}
      </Box>
    </Stack>
  );
};

export default MediaTab;

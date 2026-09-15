import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Slider,
  Stack,
  Typography,
} from "@mui/material";
import { Add, Remove, RestartAlt } from "@mui/icons-material";
import {
  cropImageToSpec,
  formatSpec,
  loadImageElement,
  SOFT_UPSCALE_LIMIT,
} from "../../utils/bannerImageSpecs";

// Manual crop step for banner uploads. Banner specs are exact pixel sizes and
// almost no admin has a creative already cut to them, so instead of bouncing
// the upload we let the admin drag/zoom the photo inside a frame with the
// required aspect ratio and re-encode exactly what they framed. An automatic
// centre-crop would be one less click but it silently beheads people and cuts
// logos in half — the admin is the only one who knows what the photo is of.
//
// Geometry: `offset` is stored as a fraction of the displayed image size
// (not pixels) so the framing survives the dialog being resized. zoom 1 means
// "cover the frame exactly"; the image can never be panned away from the
// frame's edges, so the crop box is always fully inside the photo.
const MAX_ZOOM = 4;
const FRAME_MAX_W = 560;
const FRAME_MAX_H = 380;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// `zIndex` is for callers that open this from inside a hand-rolled modal with
// its own stacking context (the Banners edit modal sits at 2000) — MUI's
// default 1300 would otherwise hide the crop dialog behind it.
const ImageCropDialog = ({ open, file, spec, onCancel, onCropped, zIndex }) => {
  const [source, setSource] = useState(null); // { url, width, height }
  const [availWidth, setAvailWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const measureRef = useRef(null);
  const dragRef = useRef(null);
  const centeredRef = useRef(false);

  // Decode the picked file once per open. The object URL has to stay alive as
  // long as the <img> is on screen, so it is revoked on close, not on load.
  useEffect(() => {
    if (!open || !file) return undefined;
    let cancelled = false;
    let release = null;
    setError(null);
    setBusy(false);
    setSource(null);
    centeredRef.current = false;

    loadImageElement(file)
      .then(({ img, revoke }) => {
        release = revoke;
        if (cancelled) {
          revoke();
          return;
        }
        setSource({ url: img.src, width: img.naturalWidth, height: img.naturalHeight });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Could not read this image file.");
      });

    return () => {
      cancelled = true;
      if (release) release();
    };
  }, [open, file]);

  useEffect(() => {
    if (!open) return undefined;
    const el = measureRef.current;
    if (!el) return undefined;
    setAvailWidth(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      setAvailWidth(entries[0].contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [open, source]);

  const aspect = spec ? spec.width / spec.height : 1;
  const frameW = availWidth
    ? clamp(Math.min(availWidth, FRAME_MAX_W, FRAME_MAX_H * aspect), 0, FRAME_MAX_W)
    : 0;
  const frameH = frameW / aspect;

  const ready = Boolean(source && spec && frameW > 0);
  // Scale that makes the image just cover the frame — the zoom floor.
  const cover = ready ? Math.max(frameW / source.width, frameH / source.height) : 1;
  const scale = cover * zoom;
  const displayW = ready ? source.width * scale : 0;
  const displayH = ready ? source.height * scale : 0;

  const clampOffset = useCallback(
    (next, dw, dh) => ({
      x: Math.min(0, Math.max((frameW - dw) / dw, next.x)),
      y: Math.min(0, Math.max((frameH - dh) / dh, next.y)),
    }),
    [frameW, frameH]
  );

  const center = useCallback(() => {
    if (!source || !frameW) return;
    setZoom(1);
    setOffset({ x: -(1 - frameW / (source.width * cover)) / 2, y: -(1 - frameH / (source.height * cover)) / 2 });
  }, [cover, frameW, frameH, source]);

  // First layout after the image decodes: start from the centred full-cover
  // framing, which is what the app itself would have shown.
  useEffect(() => {
    if (!ready || centeredRef.current) return;
    centeredRef.current = true;
    center();
  }, [ready, center]);

  const applyZoom = (value) => {
    const next = clamp(value, 1, MAX_ZOOM);
    const nextW = source.width * cover * next;
    const nextH = source.height * cover * next;
    setOffset((prev) => {
      // Hold whatever is under the middle of the frame in place while zooming.
      const cx = frameW / (2 * displayW) - prev.x;
      const cy = frameH / (2 * displayH) - prev.y;
      return clampOffset({ x: frameW / (2 * nextW) - cx, y: frameH / (2 * nextH) - cy }, nextW, nextH);
    });
    setZoom(next);
  };

  const handlePointerDown = (e) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    dragRef.current = { id: drag.id, x: e.clientX, y: e.clientY };
    setOffset((prev) => clampOffset({ x: prev.x + dx / displayW, y: prev.y + dy / displayH }, displayW, displayH));
  };

  const endDrag = (e) => {
    if (dragRef.current?.id === e.pointerId) dragRef.current = null;
  };

  // The crop box in source pixels — offset is a fraction of the displayed
  // image, so -offset.x * naturalWidth is exactly the pixel column sitting at
  // the frame's left edge.
  const cropBox = ready
    ? {
        x: -offset.x * source.width,
        y: -offset.y * source.height,
        width: frameW / scale,
        height: frameH / scale,
      }
    : null;
  // >1 means the crop is being blown up to reach the required size.
  const outputScale = cropBox ? spec.width / cropBox.width : 1;

  const handleConfirm = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const cropped = await cropImageToSpec(file, spec, cropBox);
      onCropped(cropped);
    } catch (err) {
      setError(err.message || "Could not crop this image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="sm" fullWidth sx={zIndex ? { zIndex } : undefined}>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6" fontWeight={700}>
          Crop to {formatSpec(spec)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {spec?.label} · drag the photo to move it, use the slider to zoom. The part inside the
          frame is saved at exactly {formatSpec(spec)}.
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box ref={measureRef} sx={{ width: "100%" }}>
          {error && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {error}
            </Alert>
          )}

          {ready ? (
            <>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <Box
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  sx={{
                    position: "relative",
                    width: frameW,
                    height: frameH,
                    overflow: "hidden",
                    borderRadius: 1,
                    bgcolor: "#111",
                    cursor: "grab",
                    touchAction: "none",
                    "&:active": { cursor: "grabbing" },
                  }}
                >
                  <img
                    src={source.url}
                    alt="Crop preview"
                    draggable={false}
                    style={{
                      position: "absolute",
                      left: offset.x * displayW,
                      top: offset.y * displayH,
                      width: displayW,
                      height: displayH,
                      maxWidth: "none",
                      pointerEvents: "none",
                      userSelect: "none",
                    }}
                  />
                  {/* Rule-of-thirds guides */}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      pointerEvents: "none",
                      backgroundImage:
                        "linear-gradient(to right, rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.35) 1px, transparent 1px)",
                      backgroundSize: "33.333% 33.333%",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.6)",
                    }}
                  />
                  {/* Where the app paints its own gradient + text, so the admin
                      can keep the subject clear of it. */}
                  {spec?.overlayBottomPct > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: `${spec.overlayBottomPct * 100}%`,
                        pointerEvents: "none",
                        background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,.72))",
                        display: "flex",
                        alignItems: "flex-end",
                        p: 1,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,.85)", fontWeight: 600 }}>
                        App puts title / button here
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <IconButton size="small" onClick={() => applyZoom(zoom - 0.1)} disabled={zoom <= 1}>
                  <Remove fontSize="small" />
                </IconButton>
                <Slider
                  value={zoom}
                  min={1}
                  max={MAX_ZOOM}
                  step={0.01}
                  onChange={(_, value) => applyZoom(value)}
                  size="small"
                  aria-label="Zoom"
                />
                <IconButton size="small" onClick={() => applyZoom(zoom + 0.1)} disabled={zoom >= MAX_ZOOM}>
                  <Add fontSize="small" />
                </IconButton>
                <Button size="small" startIcon={<RestartAlt />} onClick={center} sx={{ textTransform: "none", flexShrink: 0 }}>
                  Reset
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary" display="block">
                Source {source.width} × {source.height} px · cropping {Math.round(cropBox.width)} ×{" "}
                {Math.round(cropBox.height)} px → saved as {formatSpec(spec)}
              </Typography>

              {outputScale > SOFT_UPSCALE_LIMIT && (
                <Alert severity="warning" sx={{ mt: 1.5, py: 0.25 }}>
                  <Typography variant="caption">
                    This crop is {outputScale.toFixed(1)}× smaller than the required size, so the saved
                    banner will look soft. Zoom out, or use a larger photo.
                  </Typography>
                </Alert>
              )}

              {spec?.note && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  {spec.note}
                </Typography>
              )}
            </>
          ) : (
            !error && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Loading image…
              </Typography>
            )
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={busy} sx={{ textTransform: "none" }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!ready || busy} sx={{ textTransform: "none" }}>
          {busy ? "Cropping…" : `Use this crop (${formatSpec(spec)})`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageCropDialog;

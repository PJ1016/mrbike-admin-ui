// Exact pixel sizes every banner creative must be uploaded at.
//
// The customer app never letterboxes a banner — both surfaces use
// resizeMode="cover", so an off-size upload gets silently cropped:
//   - Home hero  : BannerSlider renders a fixed 190dp tall card whose width is
//                  (screen - 40), i.e. a 1.68:1 (small Android) → 2.05:1 (Pro Max)
//                  card. 1200x640 (1.875:1) sits in the middle of that range so
//                  no device crops more than ~5%, and 1200px stays sharp at 3x.
//   - Popup /
//     announcement: AnnouncementPopup sizes the image from its own aspect ratio
//                  with FALLBACK_ASPECT_RATIO = 4:5, so 1080x1350 renders with
//                  no crop at all on normal-height screens.
//
// Uploads still have to land on these exact numbers — but admins rarely have a
// creative already cut to size, so an off-size file is not rejected outright:
// ImageCropDialog lets the admin choose the crop themselves and re-encodes the
// result at exactly these dimensions (see cropImageToSpec below). Deciding the
// framing by hand beats an automatic centre-crop, which happily cuts a head or
// a logo off without anyone noticing until the banner is live.
export const BANNER_IMAGE_SPECS = {
  home: {
    width: 1200,
    height: 640,
    label: "Home Hero banner",
    // The app paints a dark gradient + title/description/button over the bottom
    // ~70% of the card, so this must be a plain background photo.
    note: "Background photo only — the app overlays title, description and button over the bottom 70%. Keep text/logo out of it.",
    // Drawn as a shaded band in the crop dialog so the admin can see which part
    // of their photo the app's own text will sit on top of.
    overlayBottomPct: 0.7,
  },
  popup: {
    width: 1080,
    height: 1350,
    label: "Popup banner",
    note: "Full designed creative (4:5). The app adds no text over it. Keep ~10% safe margin top and bottom for small screens.",
  },
  announcement: {
    width: 1080,
    height: 1350,
    label: "Announcement banner",
    note: "Full designed creative (4:5). The app adds no text over it. Keep ~10% safe margin top and bottom for small screens.",
  },
};

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Cropping blows the chosen box back up to the spec's exact pixel size, so a
// source much smaller than the target only ever produces a blurry banner.
// Below this fraction of the required size the upload is rejected instead of
// being offered a crop; above SOFT_UPSCALE_LIMIT the dialog warns but allows it.
export const MIN_SOURCE_SCALE = 0.5;
export const SOFT_UPSCALE_LIMIT = 1.25;

export const formatSpec = (spec) => (spec ? `${spec.width} × ${spec.height} px` : "");

// How much the source has to be scaled up (>1) or down (<1) for the largest
// possible crop box to fill the spec — i.e. the cover factor.
export const upscaleFactorFor = (dimensions, spec) =>
  Math.max(spec.width / dimensions.width, spec.height / dimensions.height);

// Reads the intrinsic pixel size of a File without uploading it. Rejects if the
// browser cannot decode the file (corrupt / not really an image).
export const readImageDimensions = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image file."));
    };
    img.src = url;
  });

// Same as readImageDimensions but hands back the decoded element itself, for
// callers that are about to draw it onto a canvas. The object URL stays alive
// until revoke() is called — drawing from a revoked URL fails in Safari.
export const loadImageElement = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, revoke: () => URL.revokeObjectURL(url) });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image file."));
    };
    img.src = url;
  });

// Full gate for a banner upload: type → weight → exact dimensions.
// Returns { ok: true } or { ok: false, message, reason } — never throws.
// reason "dimensions" comes with needsCrop: true, which is the caller's cue to
// open the crop dialog rather than to show the message; "too-small" is a hard
// stop because cropping cannot invent pixels that were never there.
export const validateBannerImage = async (file, spec) => {
  if (!file) return { ok: false, reason: "missing", message: "No file selected." };

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, reason: "type", message: "Only JPG, PNG or WEBP files are allowed." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, reason: "size", message: "Image must be smaller than 5MB." };
  }

  if (!spec) return { ok: true };

  let dimensions;
  try {
    dimensions = await readImageDimensions(file);
  } catch (err) {
    return { ok: false, reason: "decode", message: err.message };
  }

  if (dimensions.width === spec.width && dimensions.height === spec.height) {
    return { ok: true, dimensions };
  }

  if (upscaleFactorFor(dimensions, spec) > 1 / MIN_SOURCE_SCALE) {
    const minW = Math.ceil(spec.width * MIN_SOURCE_SCALE);
    const minH = Math.ceil(spec.height * MIN_SOURCE_SCALE);
    return {
      ok: false,
      reason: "too-small",
      dimensions,
      message: `This image is too small to crop. ${spec.label} needs ${formatSpec(spec)}, and the smallest source that can be cropped up to it is ${minW} × ${minH} px — you uploaded ${dimensions.width} × ${dimensions.height} px.`,
    };
  }

  return {
    ok: false,
    reason: "dimensions",
    needsCrop: true,
    dimensions,
    message: `${spec.label} must be exactly ${formatSpec(spec)}. You uploaded ${dimensions.width} × ${dimensions.height} px — crop it to size before saving.`,
  };
};

// Keeps a crop box (source pixels) inside the image and non-degenerate, so a
// sub-pixel rounding error in the dialog's drag maths can never hand
// drawImage a box that hangs over the edge and bleeds transparent pixels in.
const clampCropBox = (crop, img) => {
  const width = Math.max(1, Math.min(Math.round(crop.width), img.naturalWidth));
  const height = Math.max(1, Math.min(Math.round(crop.height), img.naturalHeight));
  return {
    x: Math.max(0, Math.min(Math.round(crop.x), img.naturalWidth - width)),
    y: Math.max(0, Math.min(Math.round(crop.y), img.naturalHeight - height)),
    width,
    height,
  };
};

// Draws `crop` (source pixels) into a canvas of exactly spec.width x spec.height.
// Big downscales are stepped down by halves first: one drawImage from a 4000px
// photo straight to 1200px aliases badly in Chrome, halving does not.
const renderCrop = (img, spec, crop, opaque) => {
  let source = img;
  let { x, y, width, height } = crop;

  while (width > spec.width * 2 && height > spec.height * 2) {
    const half = document.createElement("canvas");
    half.width = Math.round(width / 2);
    half.height = Math.round(height / 2);
    const halfCtx = half.getContext("2d");
    halfCtx.imageSmoothingEnabled = true;
    halfCtx.imageSmoothingQuality = "high";
    halfCtx.drawImage(source, x, y, width, height, 0, 0, half.width, half.height);
    source = half;
    x = 0;
    y = 0;
    width = half.width;
    height = half.height;
  }

  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  // JPEG has no alpha channel: without this, transparent source pixels encode
  // as black instead of white.
  if (opaque) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, spec.width, spec.height);
  }
  ctx.drawImage(source, x, y, width, height, 0, 0, spec.width, spec.height);
  return canvas;
};

const encodeCanvas = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the cropped image."))),
      type,
      quality
    );
  });

const croppedFileName = (name, spec, type) => {
  const ext = type === "image/png" ? "png" : "jpg";
  const base = (name || "banner").replace(/\.[^./\\]+$/, "") || "banner";
  return `${base}-${spec.width}x${spec.height}.${ext}`;
};

// Cuts `crop` out of `file` and re-encodes it at exactly the spec's size.
// Returns a File ready to hand straight to the form's FormData.
// PNG sources stay PNG so a creative with transparent corners survives; a
// re-encode that busts the 5MB cap falls back to progressively harder JPEG.
export const cropImageToSpec = async (file, spec, crop) => {
  const { img, revoke } = await loadImageElement(file);
  try {
    const box = clampCropBox(crop, img);
    const keepPng = file.type === "image/png";
    let type = keepPng ? "image/png" : "image/jpeg";
    let blob = await encodeCanvas(renderCrop(img, spec, box, !keepPng), type, 0.92);

    for (const quality of [0.85, 0.72, 0.6]) {
      if (blob.size <= MAX_IMAGE_BYTES) break;
      type = "image/jpeg";
      blob = await encodeCanvas(renderCrop(img, spec, box, true), type, quality);
    }

    if (blob.size > MAX_IMAGE_BYTES) {
      throw new Error("The cropped image is still larger than 5MB. Try a less detailed photo.");
    }

    return new File([blob], croppedFileName(file.name, spec, type), {
      type,
      lastModified: Date.now(),
    });
  } finally {
    revoke();
  }
};

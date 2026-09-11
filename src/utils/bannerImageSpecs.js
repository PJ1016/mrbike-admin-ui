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
// Admin uploads are locked to these numbers instead of accepting any size —
// a wrong-size creative cannot be fixed after it is live.
export const BANNER_IMAGE_SPECS = {
  home: {
    width: 1200,
    height: 640,
    label: "Home Hero banner",
    // The app paints a dark gradient + title/description/button over the bottom
    // ~70% of the card, so this must be a plain background photo.
    note: "Background photo only — the app overlays title, description and button over the bottom 70%. Keep text/logo out of it.",
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

export const formatSpec = (spec) => (spec ? `${spec.width} × ${spec.height} px` : "");

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

// Full gate for a banner upload: type → size → exact dimensions.
// Returns { ok: true } or { ok: false, message } — never throws.
export const validateBannerImage = async (file, spec) => {
  if (!file) return { ok: false, message: "No file selected." };

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, message: "Only JPG, PNG or WEBP files are allowed." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Image must be smaller than 5MB." };
  }

  if (!spec) return { ok: true };

  let dimensions;
  try {
    dimensions = await readImageDimensions(file);
  } catch (err) {
    return { ok: false, message: err.message };
  }

  if (dimensions.width !== spec.width || dimensions.height !== spec.height) {
    return {
      ok: false,
      message: `${spec.label} must be exactly ${formatSpec(spec)}. You uploaded ${dimensions.width} × ${dimensions.height} px — resize it and upload again.`,
      dimensions,
    };
  }

  return { ok: true, dimensions };
};

"use client";

import { useState } from "react";

/**
 * ImagePreview
 * -------------
 * image can be:
 *  - "uploads/userprofile/abc.jpg"
 *  - "uploads/banners/abc.jpg"
 *  - "uploads/admin-services/abc.jpg"
 *  - already full URL (http/https)
 *
 * Base URL is taken ONLY from:
 *  VITE_IMAGE_BASE_URL=http://localhost:8001/
 */

const ImagePreview = ({ image }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!image) return "N/A";

  const BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL || "https://api.mrbikedoctor.cloud/";

  // Build final image URL
  const imageUrl = image.startsWith("http")
    ? image
    : `${BASE_URL}${image}`;

  return (
    <>
      {/* Thumbnail */}
      <img
        src={imageUrl}
        alt="Preview"
        width={100}
        height={50}
        style={{
          borderRadius: "6px",
          cursor: "pointer",
          objectFit: "cover",
        }}
        onClick={() => setIsOpen(true)}
        // onError={(e) => {
        //   e.target.src = "/placeholder.svg";
        // }}
      />

      {/* Full Screen Preview */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <img
            src={imageUrl}
            alt="Full Preview"
            style={{
              maxWidth: "90%",
              maxHeight: "90%",
              borderRadius: "10px",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            }}
          />
        </div>
      )}
    </>
  );
};

export default ImagePreview;

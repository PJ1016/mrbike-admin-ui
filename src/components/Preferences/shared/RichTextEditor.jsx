import React, { useMemo, useRef } from "react";
import { Box, FormHelperText } from "@mui/material";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// React Quill-based rich text editor. Value/onChange always work in raw
// HTML, matching what a CMS-style backend field (and the User App / Dealer
// App / Website renderers that consume it) expects. Used by every Legal
// document and FAQ answer field, so any prop change here must stay backward
// compatible with the existing (value, onChange, placeholder, minHeight,
// error, helperText, disabled) contract. `onUploadImage` is additive and
// optional — pass an async (file) => url to upload real files instead of
// the base64-embed fallback.

// Quill core has no <hr> format, so it silently strips <hr> on load/paste
// otherwise. A minimal block-embed blot round-trips it correctly.
const BlockEmbed = Quill.import("blots/block/embed");
class DividerBlot extends BlockEmbed {}
DividerBlot.blotName = "divider";
DividerBlot.tagName = "hr";
Quill.register(DividerBlot);

// Table blots (table/table-row/table-body/table-container) are registered
// as a side effect of importing "quill" itself — they just aren't in the
// default `formats` allowlist, so <table> gets flattened to <p> tags unless
// explicitly whitelisted below.
const FORMATS = [
  "header",
  "bold",
  "italic",
  "underline",
  "list",
  "blockquote",
  "link",
  "image",
  "divider",
  "table",
  "table-row",
  "table-body",
  "table-container",
];

const icons = Quill.import("ui/icons");
icons.table = "▦";
icons.divider = "―";

const TABLE_SKELETON_HTML =
  "<table><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table><p><br></p>";

function insertTableSkeleton(quill) {
  if (!quill) return;
  const range = quill.getSelection(true);
  const index = range ? range.index : quill.getLength();
  quill.clipboard.dangerouslyPasteHTML(index, TABLE_SKELETON_HTML, "user");
}

function insertDivider(quill) {
  if (!quill) return;
  const range = quill.getSelection(true);
  const index = range ? range.index : quill.getLength();
  quill.insertEmbed(index, "divider", true, "user");
  quill.setSelection(index + 1, 0, "user");
}

function buildImageHandler(quillRef, onUploadImage) {
  return function imageHandler() {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      if (onUploadImage) {
        try {
          const url = await onUploadImage(file);
          quill.insertEmbed(index, "image", url, "user");
          quill.setSelection(index + 1, 0, "user");
        } catch (err) {
          console.error("FAQ image upload failed:", err);
        }
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          quill.insertEmbed(index, "image", reader.result, "user");
          quill.setSelection(index + 1, 0, "user");
        };
        reader.readAsDataURL(file);
      }
    };
  };
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Start typing…",
  minHeight = 180,
  error = false,
  helperText,
  disabled = false,
  onUploadImage,
}) => {
  const quillRef = useRef(null);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "link", "image"],
          ["table", "divider"],
          ["clean"],
        ],
        handlers: {
          table: () => insertTableSkeleton(quillRef.current?.getEditor()),
          divider: () => insertDivider(quillRef.current?.getEditor()),
          image: buildImageHandler(quillRef, onUploadImage),
        },
      },
      clipboard: { matchVisual: false },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onUploadImage]
  );

  return (
    <Box
      sx={{
        "& .ql-container": {
          minHeight,
          fontSize: "0.9rem",
          borderBottomLeftRadius: 8,
          borderBottomRightRadius: 8,
          borderColor: error ? "#ef4444" : undefined,
        },
        "& .ql-toolbar": {
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderColor: error ? "#ef4444" : undefined,
        },
        "& .ql-editor": { minHeight },
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={FORMATS}
        readOnly={disabled}
      />
      {helperText && (
        <FormHelperText error={error} sx={{ mx: 1.75 }}>
          {helperText}
        </FormHelperText>
      )}
    </Box>
  );
};

export default RichTextEditor;

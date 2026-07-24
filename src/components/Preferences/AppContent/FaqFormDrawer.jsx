import React, { useEffect, useState } from "react";
import { Box, Divider, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import FormDrawer from "../shared/FormDrawer";
import RichTextEditor from "../shared/RichTextEditor";
import { uploadFaqImage } from "../../../api/preferences/appContentApi";

const ACCENT = "#0891b2";

// appType is stored on the backend as an array (["user"], ["dealer"], or
// both) so a single FAQ can target either or both apps; the admin only
// ever picks one of these three options though.
const APP_TYPE_OPTIONS = [
  { value: "user", label: "User App", appType: ["user"] },
  { value: "dealer", label: "Dealer App", appType: ["dealer"] },
  { value: "both", label: "Both Apps", appType: ["user", "dealer"] },
];

const toAppTypeOption = (appType) => {
  const list = Array.isArray(appType) ? appType : [];
  if (list.includes("user") && list.includes("dealer")) return "both";
  if (list.includes("dealer")) return "dealer";
  return "user";
};

// Accepts YouTube watch URLs, youtu.be short links, /shorts/, or embed URLs —
// authoritative validation/normalization still happens server-side.
const YOUTUBE_URL_PATTERN = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

const getYoutubeEmbedPreviewUrl = (url) => {
  const match = (url || "").match(YOUTUBE_URL_PATTERN);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

const emptyForm = {
  question: "",
  answer: "",
  category: "",
  appTypeOption: "both",
  videoUrl: "",
  displayOrder: "",
  isActive: true,
};

// Create/Edit drawer for a single FAQ entry. `faq` is null for create, or
// the normalized row object for edit. Mirrors PromoCodeFormDrawer.jsx —
// answers use RichTextEditor since FAQ answers can contain formatting/links.
const FaqFormDrawer = ({ open, faq, saving, onClose, onSave }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(
        faq
          ? {
              question: faq.question || "",
              answer: faq.answer || "",
              category: faq.category || "",
              appTypeOption: toAppTypeOption(faq.appType),
              videoUrl: faq.videoUrl || "",
              displayOrder: faq.displayOrder ?? "",
              isActive: faq.isActive ?? true,
            }
          : emptyForm
      );
      setErrors({});
    }
  }, [open, faq]);

  const handleChange = (field) => (e) => {
    const value = field === "isActive" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const isAnswerEmpty = (html) => !html || html === "<br>" || html.replace(/<[^>]*>/g, "").trim() === "";

  const validate = () => {
    const e = {};
    if (!form.question.trim()) e.question = "Question is required";
    if (isAnswerEmpty(form.answer)) e.answer = "Answer is required";
    if (form.videoUrl.trim() && !getYoutubeEmbedPreviewUrl(form.videoUrl)) {
      e.videoUrl = "Enter a valid YouTube watch, short, or embed URL";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleUploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const res = await uploadFaqImage(formData);
    return res?.url;
  };

  const handleSave = () => {
    if (!validate()) return;
    const appTypeMeta = APP_TYPE_OPTIONS.find((o) => o.value === form.appTypeOption);
    onSave({
      question: form.question.trim(),
      answer: form.answer,
      category: form.category.trim(),
      appType: appTypeMeta?.appType ?? ["user", "dealer"],
      videoUrl: form.videoUrl.trim() || null,
      displayOrder: form.displayOrder === "" ? 0 : Number(form.displayOrder),
      isActive: form.isActive,
    });
  };

  const videoPreviewUrl = getYoutubeEmbedPreviewUrl(form.videoUrl);

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={faq ? "Edit FAQ" : "Create FAQ"}
      subtitle="APP CONTENT"
      saving={saving}
      onSave={handleSave}
      saveLabel={faq ? "Update" : "Create"}
      accentColor={ACCENT}
    >
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          label="Question"
          value={form.question}
          onChange={handleChange("question")}
          error={!!errors.question}
          helperText={errors.question}
          placeholder="e.g. How do I reschedule a service?"
          size="small"
          multiline
          minRows={2}
          InputLabelProps={{ shrink: true }}
        />

        <Box>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ mb: 1 }}>
            Answer *
          </Typography>
          <RichTextEditor
            value={form.answer}
            onChange={(html) => {
              setForm((prev) => ({ ...prev, answer: html }));
              if (errors.answer) setErrors((prev) => ({ ...prev, answer: null }));
            }}
            placeholder="Write the answer…"
            minHeight={180}
            error={!!errors.answer}
            helperText={errors.answer}
            onUploadImage={handleUploadImage}
          />
        </Box>

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            fullWidth
            select
            label="App Type"
            value={form.appTypeOption}
            onChange={handleChange("appTypeOption")}
            size="small"
            InputLabelProps={{ shrink: true }}
          >
            {APP_TYPE_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Category"
            value={form.category}
            onChange={handleChange("category")}
            placeholder="General"
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
        </Stack>

        <Box>
          <TextField
            fullWidth
            label="YouTube Video URL (optional)"
            value={form.videoUrl}
            onChange={handleChange("videoUrl")}
            placeholder="https://www.youtube.com/watch?v=…"
            size="small"
            error={!!errors.videoUrl}
            helperText={errors.videoUrl || "Paste a watch, youtu.be, or embed URL"}
            InputLabelProps={{ shrink: true }}
          />
          {videoPreviewUrl && (
            <Box
              component="iframe"
              src={videoPreviewUrl}
              title="YouTube video preview"
              sx={{ mt: 1.5, width: "100%", aspectRatio: "16/9", border: "1px solid #e2e8f0", borderRadius: "8px" }}
              allowFullScreen
            />
          )}
        </Box>

        <Divider />

        <FormControlLabel
          control={<Switch checked={form.isActive} onChange={handleChange("isActive")} color="success" />}
          label={
            <Box>
              <Typography variant="body2" fontWeight={600}>Active Status</Typography>
              <Typography variant="caption" color="text.secondary">Inactive FAQs are hidden from the customer app</Typography>
            </Box>
          }
        />
      </Stack>
    </FormDrawer>
  );
};

export default FaqFormDrawer;

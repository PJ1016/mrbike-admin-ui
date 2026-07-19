import React, { useEffect, useState } from "react";
import { Box, Divider, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import FormDrawer from "../shared/FormDrawer";
import RichTextEditor from "../shared/RichTextEditor";

const ACCENT = "#0891b2";

const emptyForm = {
  question: "",
  answer: "",
  category: "",
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      question: form.question.trim(),
      answer: form.answer,
      category: form.category.trim(),
      displayOrder: form.displayOrder === "" ? 0 : Number(form.displayOrder),
      isActive: form.isActive,
    });
  };

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
          />
        </Box>

        <Divider />

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
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

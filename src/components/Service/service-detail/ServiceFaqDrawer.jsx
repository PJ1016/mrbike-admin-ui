import React, { useEffect, useState } from "react";
import { Box, Stack, TextField, Typography } from "@mui/material";
import FormDrawer from "../../Preferences/shared/FormDrawer";
import RichTextEditor from "../../Preferences/shared/RichTextEditor";

const ACCENT = "#2563eb";

const emptyForm = { question: "", answer: "" };

// Mirrors FaqFormDrawer.jsx (the app-wide FAQ editor) — same FormDrawer
// shell, same RichTextEditor for the answer, same emptiness rule — but
// without category/appType/videoUrl/isActive, none of which apply to a FAQ
// that belongs to one service. Ordering is positional (drag on the list
// behind this drawer), so there is no display-order field either.
const ServiceFaqDrawer = ({ open, faq, onClose, onSave }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(faq ? { question: faq.question || "", answer: faq.answer || "" } : emptyForm);
      setErrors({});
    }
  }, [open, faq]);

  // Quill emits "<p><br></p>" for an untouched editor, so a truthiness check
  // would treat an empty answer as filled in. Same rule the backend applies.
  const isAnswerEmpty = (html) => !html || html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() === "";

  const handleSave = () => {
    const nextErrors = {};
    if (!form.question.trim()) nextErrors.question = "Question is required";
    if (isAnswerEmpty(form.answer)) nextErrors.answer = "Answer is required";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    onSave({ question: form.question.trim(), answer: form.answer });
  };

  return (
    <FormDrawer
      open={open}
      onClose={onClose}
      title={faq ? "Edit FAQ" : "Add FAQ"}
      subtitle="SERVICE DETAIL"
      onSave={handleSave}
      saveLabel={faq ? "Update" : "Add"}
      accentColor={ACCENT}
    >
      <Stack spacing={2.5}>
        <TextField
          fullWidth
          size="small"
          label="Question"
          value={form.question}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, question: e.target.value }));
            if (errors.question) setErrors((prev) => ({ ...prev, question: null }));
          }}
          error={!!errors.question}
          helperText={errors.question}
          placeholder="e.g. How long does this service take?"
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
            minHeight={200}
            error={!!errors.answer}
            helperText={errors.answer}
          />
        </Box>
      </Stack>
    </FormDrawer>
  );
};

export default ServiceFaqDrawer;

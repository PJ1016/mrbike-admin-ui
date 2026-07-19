import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  MenuItem,
  Popover,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  FormatAlignJustify,
  Link as LinkIcon,
  LinkOff,
  TableChart,
  TableRows,
  ViewColumn,
  DeleteOutline,
  Image as ImageIcon,
  FormatColorText,
  FormatColorFill,
  Undo,
  Redo,
  FormatClear,
  Code,
  Fullscreen,
  FullscreenExit,
  UploadFile,
} from "@mui/icons-material";

// Production-grade contentEditable rich text editor — no external RTE
// dependency. Value/onChange always work in raw HTML, matching what a
// CMS-style backend field (and the User App / Dealer App / Website renderers
// that consume it) expects. Used by every Legal document and FAQ answer
// field, so any prop change here must stay backward compatible with the
// existing (value, onChange, placeholder, minHeight, error, helperText,
// disabled) contract — fullscreen/source-view/tables/images/color are all
// purely additive toolbar capabilities.

const BLOCK_OPTIONS = [
  { value: "P", label: "Paragraph" },
  { value: "H1", label: "Heading 1" },
  { value: "H2", label: "Heading 2" },
  { value: "H3", label: "Heading 3" },
  { value: "H4", label: "Heading 4" },
  { value: "H5", label: "Heading 5" },
  { value: "H6", label: "Heading 6" },
  { value: "BLOCKQUOTE", label: "Quote" },
];

const escapeHtml = (str = "") =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const findAncestor = (node, tagNames) => {
  let el = node;
  while (el) {
    if (el.nodeType === 1 && tagNames.includes(el.tagName)) return el;
    el = el.parentNode;
  }
  return null;
};

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Start typing…",
  minHeight = 240,
  error,
  helperText,
  disabled = false,
}) => {
  const editorRef = useRef(null);
  const colorInputRef = useRef(null);
  const bgColorInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const savedRangeRef = useRef(null);

  const [activeStates, setActiveStates] = useState({});
  const [fullscreen, setFullscreen] = useState(false);
  const [sourceView, setSourceView] = useState(false);

  const [linkAnchor, setLinkAnchor] = useState(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);

  const [tableAnchor, setTableAnchor] = useState(null);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const [imageAnchor, setImageAnchor] = useState(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el || sourceView) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== (value || "")) {
      el.innerHTML = value || "";
    }
  }, [value, sourceView]);

  // Keeps toolbar toggle buttons (bold/italic/list/align) and the block
  // format dropdown in sync with wherever the caret currently sits.
  useEffect(() => {
    const update = () => {
      const el = editorRef.current;
      const sel = window.getSelection();
      if (!el || !sel || !sel.anchorNode || !el.contains(sel.anchorNode)) return;
      try {
        setActiveStates({
          bold: document.queryCommandState("bold"),
          italic: document.queryCommandState("italic"),
          underline: document.queryCommandState("underline"),
          insertUnorderedList: document.queryCommandState("insertUnorderedList"),
          insertOrderedList: document.queryCommandState("insertOrderedList"),
          justifyLeft: document.queryCommandState("justifyLeft"),
          justifyCenter: document.queryCommandState("justifyCenter"),
          justifyRight: document.queryCommandState("justifyRight"),
          justifyFull: document.queryCommandState("justifyFull"),
          formatBlock: (document.queryCommandValue("formatBlock") || "P").toUpperCase(),
        });
      } catch {
        // queryCommandState can throw in some browsers for detached selections — ignore
      }
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [fullscreen]);

  const syncChange = () => onChange?.(editorRef.current?.innerHTML || "");

  const captureSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const closeAllPopovers = () => {
    setLinkAnchor(null);
    setTableAnchor(null);
    setImageAnchor(null);
  };

  const exec = (cmd, arg) => {
    if (disabled) return;
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    syncChange();
  };

  // --- Link -----------------------------------------------------------
  const openLinkPopover = (e) => {
    captureSelection();
    setLinkUrl("");
    setLinkText(window.getSelection()?.toString() || "");
    setLinkNewTab(true);
    closeAllPopovers();
    setLinkAnchor(e.currentTarget);
  };
  const insertLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection();
    const text = linkText.trim() || linkUrl.trim();
    const target = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    document.execCommand("insertHTML", false, `<a href="${escapeHtml(linkUrl.trim())}"${target}>${escapeHtml(text)}</a>`);
    syncChange();
    setLinkAnchor(null);
  };
  const removeLink = () => exec("unlink");

  // --- Table ------------------------------------------------------------
  const openTablePopover = (e) => {
    captureSelection();
    closeAllPopovers();
    setTableAnchor(e.currentTarget);
  };
  const insertTable = () => {
    const rows = Math.min(Math.max(Number(tableRows) || 1, 1), 20);
    const cols = Math.min(Math.max(Number(tableCols) || 1, 1), 12);
    restoreSelection();
    let html = '<table style="border-collapse:collapse;width:100%;margin:12px 0;">';
    for (let r = 0; r < rows; r++) {
      html += "<tr>";
      for (let c = 0; c < cols; c++) {
        html +=
          r === 0
            ? `<td style="border:1px solid #cbd5e1;padding:8px;min-width:60px;background:#f8fafc;font-weight:700;">&nbsp;</td>`
            : `<td style="border:1px solid #cbd5e1;padding:8px;min-width:60px;">&nbsp;</td>`;
      }
      html += "</tr>";
    }
    html += "</table><p><br></p>";
    document.execCommand("insertHTML", false, html);
    syncChange();
    setTableAnchor(null);
  };

  const getSelectedCell = () => {
    const sel = window.getSelection();
    if (!sel?.anchorNode || !editorRef.current?.contains(sel.anchorNode)) return null;
    return findAncestor(sel.anchorNode, ["TD", "TH"]);
  };

  const withTableContext = (fn) => () => {
    if (disabled) return;
    const cell = getSelectedCell();
    if (!cell) return;
    const row = findAncestor(cell, ["TR"]);
    const table = findAncestor(cell, ["TABLE"]);
    if (!row || !table) return;
    fn({ cell, row, table });
    syncChange();
    editorRef.current?.focus();
  };

  const addRow = withTableContext(({ row }) => {
    const clone = row.cloneNode(true);
    Array.from(clone.children).forEach((cell) => {
      cell.innerHTML = "&nbsp;";
      cell.removeAttribute("style"); // header shading shouldn't carry to new rows
      cell.setAttribute("style", "border:1px solid #cbd5e1;padding:8px;min-width:60px;");
    });
    row.parentNode.insertBefore(clone, row.nextSibling);
  });

  const addColumn = withTableContext(({ cell, table }) => {
    const row = findAncestor(cell, ["TR"]);
    const index = Array.from(row.children).indexOf(cell);
    table.querySelectorAll("tr").forEach((tr) => {
      const ref = tr.children[index];
      const newCell = document.createElement(ref?.tagName === "TH" ? "th" : "td");
      newCell.innerHTML = "&nbsp;";
      newCell.setAttribute("style", ref?.getAttribute("style") || "border:1px solid #cbd5e1;padding:8px;min-width:60px;");
      if (ref) ref.after(newCell);
      else tr.appendChild(newCell);
    });
  });

  const deleteRow = withTableContext(({ row, table }) => {
    if (table.querySelectorAll("tr").length <= 1) return;
    row.remove();
  });

  const deleteColumn = withTableContext(({ cell, row, table }) => {
    const index = Array.from(row.children).indexOf(cell);
    if (row.children.length <= 1) return;
    table.querySelectorAll("tr").forEach((tr) => {
      tr.children[index]?.remove();
    });
  });

  const deleteTable = withTableContext(({ table }) => table.remove());

  // --- Image ------------------------------------------------------------
  const openImagePopover = (e) => {
    captureSelection();
    setImageUrl("");
    closeAllPopovers();
    setImageAnchor(e.currentTarget);
  };
  const insertImageFromUrl = () => {
    if (!imageUrl.trim()) return;
    restoreSelection();
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${escapeHtml(imageUrl.trim())}" style="max-width:100%;height:auto;border-radius:4px;" alt="" />`
    );
    syncChange();
    setImageAnchor(null);
  };
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      restoreSelection();
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${reader.result}" style="max-width:100%;height:auto;border-radius:4px;" alt="" />`
      );
      syncChange();
      setImageAnchor(null);
    };
    reader.readAsDataURL(file);
  };

  // --- Color --------------------------------------------------------------
  const applyTextColor = (e) => exec("foreColor", e.target.value);
  const applyBgColor = (e) => exec("backColor", e.target.value);

  const isEmpty = !value || value === "<br>" || value.replace(/<[^>]*>/g, "").trim() === "";

  const iconBtnSx = (active) => ({
    color: active ? "#2563eb" : "inherit",
    bgcolor: active ? "#eff6ff" : "transparent",
  });

  const toolbarDisabled = disabled || sourceView;

  const containerSx = fullscreen
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        bgcolor: "#fff",
        display: "flex",
        flexDirection: "column",
        border: "none",
        borderRadius: 0,
      }
    : {
        border: `1px solid ${error ? "#d32f2f" : "#e2e8f0"}`,
        borderRadius: "10px",
        overflow: "hidden",
        bgcolor: disabled ? "#f8fafc" : "#fff",
      };

  const toolbar = useMemo(
    () => (
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={0.25} sx={{ p: 0.75, bgcolor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
        <Tooltip title="Undo">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("undo")}>
              <Undo fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("redo")}>
              <Redo fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Select
          size="small"
          disabled={toolbarDisabled}
          value={BLOCK_OPTIONS.some((o) => o.value === activeStates.formatBlock) ? activeStates.formatBlock : "P"}
          onMouseDown={captureSelection}
          onChange={(e) => exec("formatBlock", `<${e.target.value}>`)}
          sx={{ fontSize: "0.8rem", height: 32, minWidth: 128, bgcolor: "#fff" }}
        >
          {BLOCK_OPTIONS.map((o) => (
            <MenuItem key={o.value} value={o.value} sx={{ fontSize: "0.8rem" }}>
              {o.label}
            </MenuItem>
          ))}
        </Select>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Tooltip title="Bold">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} sx={iconBtnSx(activeStates.bold)}>
              <FormatBold fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Italic">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} sx={iconBtnSx(activeStates.italic)}>
              <FormatItalic fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Underline">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} sx={iconBtnSx(activeStates.underline)}>
              <FormatUnderlined fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Tooltip title="Text color">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => colorInputRef.current?.click()}>
              <FormatColorText fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <input ref={colorInputRef} type="color" onChange={applyTextColor} style={{ width: 0, height: 0, opacity: 0, position: "absolute" }} />
        <Tooltip title="Background color">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => bgColorInputRef.current?.click()}>
              <FormatColorFill fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <input ref={bgColorInputRef} type="color" onChange={applyBgColor} style={{ width: 0, height: 0, opacity: 0, position: "absolute" }} />

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Tooltip title="Bullet list">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} sx={iconBtnSx(activeStates.insertUnorderedList)}>
              <FormatListBulleted fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Numbered list">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} sx={iconBtnSx(activeStates.insertOrderedList)}>
              <FormatListNumbered fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Tooltip title="Align left">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyLeft")} sx={iconBtnSx(activeStates.justifyLeft)}>
              <FormatAlignLeft fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Align center">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyCenter")} sx={iconBtnSx(activeStates.justifyCenter)}>
              <FormatAlignCenter fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Align right">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyRight")} sx={iconBtnSx(activeStates.justifyRight)}>
              <FormatAlignRight fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Justify">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("justifyFull")} sx={iconBtnSx(activeStates.justifyFull)}>
              <FormatAlignJustify fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Tooltip title="Insert link">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={openLinkPopover}>
              <LinkIcon fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Remove link">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={removeLink}>
              <LinkOff fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Tooltip title="Insert table">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={openTablePopover}>
              <TableChart fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Add row below (click inside a table first)">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={addRow}>
              <TableRows fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Add column right (click inside a table first)">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={addColumn}>
              <ViewColumn fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete row">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={deleteRow}>
              <DeleteOutline fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete column">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={deleteColumn}>
              <DeleteOutline fontSize="small" sx={{ fontSize: 18, transform: "rotate(90deg)" }} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Delete table">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={deleteTable} sx={{ color: "#dc2626" }}>
              <DeleteOutline fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Tooltip title="Insert image">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={openImagePopover}>
              <ImageIcon fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 0.75 }} />

        <Tooltip title="Clear formatting">
          <span>
            <IconButton size="small" disabled={toolbarDisabled} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("removeFormat")}>
              <FormatClear fontSize="small" sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>

        <Box sx={{ flex: 1 }} />

        <Tooltip title={sourceView ? "Back to visual editor" : "View/edit HTML source"}>
          <IconButton size="small" disabled={disabled} onClick={() => setSourceView((v) => !v)} sx={iconBtnSx(sourceView)}>
            <Code fontSize="small" sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
          <IconButton size="small" disabled={disabled} onClick={() => setFullscreen((v) => !v)}>
            {fullscreen ? <FullscreenExit fontSize="small" sx={{ fontSize: 18 }} /> : <Fullscreen fontSize="small" sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Stack>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeStates, toolbarDisabled, sourceView, fullscreen, disabled]
  );

  return (
    <Box>
      <Box sx={containerSx}>
        {toolbar}

        {sourceView ? (
          <Box
            component="textarea"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={`<p>${placeholder}</p>`}
            sx={{
              flex: fullscreen ? 1 : "none",
              width: "100%",
              minHeight: fullscreen ? undefined : minHeight,
              border: "none",
              outline: "none",
              resize: fullscreen ? "none" : "vertical",
              p: "12px 14px",
              fontFamily: "monospace",
              fontSize: "0.82rem",
              lineHeight: 1.6,
              color: "#1e293b",
              bgcolor: "#0f172a08",
            }}
          />
        ) : (
          <Box sx={{ position: "relative", flex: fullscreen ? 1 : "none", overflowY: fullscreen ? "auto" : "visible" }}>
            {isEmpty && (
              <Typography variant="body2" sx={{ position: "absolute", top: 12, left: 14, color: "#94a3b8", pointerEvents: "none" }}>
                {placeholder}
              </Typography>
            )}
            <Box
              ref={editorRef}
              contentEditable={!disabled}
              suppressContentEditableWarning
              onInput={(e) => onChange?.(e.currentTarget.innerHTML)}
              onBlur={(e) => onChange?.(e.currentTarget.innerHTML)}
              sx={{
                minHeight: fullscreen ? "100%" : minHeight,
                p: "12px 14px",
                fontSize: "0.9rem",
                lineHeight: 1.6,
                color: "#1e293b",
                outline: "none",
                overflowY: "auto",
                "& h1": { fontSize: "1.6rem", fontWeight: 700, my: 1 },
                "& h2": { fontSize: "1.35rem", fontWeight: 700, my: 1 },
                "& h3": { fontSize: "1.15rem", fontWeight: 700, my: 1 },
                "& h4, & h5, & h6": { fontWeight: 700, my: 1 },
                "& blockquote": { borderLeft: "3px solid #cbd5e1", pl: 1.5, ml: 0, color: "#64748b" },
                "& ul, & ol": { pl: 3 },
                "& a": { color: "#2563eb" },
                "& table": { borderCollapse: "collapse" },
                "& img": { maxWidth: "100%" },
              }}
            />
          </Box>
        )}
      </Box>

      {(error || helperText) && (
        <Typography variant="caption" sx={{ mt: 0.5, ml: 0.5, display: "block", color: error ? "#d32f2f" : "#94a3b8" }}>
          {error || helperText}
        </Typography>
      )}

      <Popover
        open={Boolean(linkAnchor)}
        anchorEl={linkAnchor}
        onClose={() => setLinkAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" fontWeight={700}>Insert Link</Typography>
          <TextField size="small" label="URL" placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} autoFocus />
          <TextField size="small" label="Link text (optional)" value={linkText} onChange={(e) => setLinkText(e.target.value)} />
          <FormControlLabel
            control={<Checkbox size="small" checked={linkNewTab} onChange={(e) => setLinkNewTab(e.target.checked)} />}
            label={<Typography variant="caption">Open in new tab</Typography>}
          />
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={() => setLinkAnchor(null)}>Cancel</Button>
            <Button size="small" variant="contained" onClick={insertLink} disabled={!linkUrl.trim()}>Insert</Button>
          </Stack>
        </Stack>
      </Popover>

      <Popover
        open={Boolean(tableAnchor)}
        anchorEl={tableAnchor}
        onClose={() => setTableAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2" fontWeight={700}>Insert Table</Typography>
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" type="number" label="Rows" value={tableRows} onChange={(e) => setTableRows(e.target.value)} inputProps={{ min: 1, max: 20 }} />
            <TextField size="small" type="number" label="Columns" value={tableCols} onChange={(e) => setTableCols(e.target.value)} inputProps={{ min: 1, max: 12 }} />
          </Stack>
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={() => setTableAnchor(null)}>Cancel</Button>
            <Button size="small" variant="contained" onClick={insertTable}>Insert</Button>
          </Stack>
        </Stack>
      </Popover>

      <Popover
        open={Boolean(imageAnchor)}
        anchorEl={imageAnchor}
        onClose={() => setImageAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" fontWeight={700}>Insert Image</Typography>
          <TextField size="small" label="Image URL" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} autoFocus />
          <Stack direction="row" justifyContent="flex-end" spacing={1}>
            <Button size="small" onClick={() => setImageAnchor(null)}>Cancel</Button>
            <Button size="small" variant="contained" onClick={insertImageFromUrl} disabled={!imageUrl.trim()}>Insert from URL</Button>
          </Stack>
          <Divider>or</Divider>
          <Button size="small" component="label" startIcon={<UploadFile fontSize="small" />} variant="outlined">
            Upload from device
            <input ref={fileInputRef} type="file" hidden accept="image/*" onChange={handleImageFile} />
          </Button>
        </Stack>
      </Popover>
    </Box>
  );
};

export default RichTextEditor;

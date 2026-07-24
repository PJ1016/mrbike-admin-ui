import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, Grid, Stack, Tooltip, Typography } from "@mui/material";
import { Delete, ToggleOff, ToggleOn } from "@mui/icons-material";
import DOMPurify from "dompurify";
import Swal from "sweetalert2";

import PrefHeader from "../shared/PrefHeader";
import FilterSelect from "../shared/FilterSelect";
import BulkActionBar from "../shared/BulkActionBar";
import StatusSwitch from "../shared/StatusSwitch";
import ConfirmDialog from "../shared/ConfirmDialog";
import FormDrawer from "../shared/FormDrawer";
import SupportSearch from "../../Support/SupportSearch";
import SupportTable from "../../Support/SupportTable";
import SupportEmptyState from "../../Support/SupportEmptyState";
import FaqFormDrawer from "./FaqFormDrawer";
import {
  getFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
  toggleFaqStatus,
  bulkDeleteFaqs,
} from "../../../api/preferences/appContentApi";

const ACCENT = "#0891b2";

const truncate = (text, len = 60) => {
  const plain = text || "";
  return plain.length > len ? `${plain.slice(0, len)}…` : plain;
};

const formatAppType = (appType) => {
  const list = Array.isArray(appType) ? appType : [];
  const hasUser = list.includes("user");
  const hasDealer = list.includes("dealer");
  if (hasUser && hasDealer) return "Both Apps";
  if (hasDealer) return "Dealer App";
  return "User App";
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

const normalize = (f) => ({
  id: f._id || f.id,
  question: f.question || "",
  answer: f.answer || "",
  category: f.category || "",
  appType: Array.isArray(f.appType) && f.appType.length ? f.appType : ["user", "dealer"],
  videoUrl: f.videoUrl || null,
  displayOrder: f.displayOrder ?? 0,
  isActive: f.isActive ?? true,
  createdAt: f.createdAt || null,
  updatedAt: f.updatedAt || null,
});

// Generic CRUD table+drawer for FAQ entries. Mirrors PromoCodes.jsx / the
// AppPopupsManager pattern; Category filter options are derived from the
// loaded rows (no fixed enum exists on the backend for this field), same
// approach TransactionFilters.jsx uses for dealerOptions.
const FaqManager = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [appTypeFilter, setAppTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [saving, setSaving] = useState(false);

  const [viewFaq, setViewFaq] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, mode: null, ids: [] });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFaqs();
      const list = res?.data || res?.faqs || (Array.isArray(res) ? res : []);
      setRows(list.map(normalize));
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load FAQs. This module needs its backend endpoints connected.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryOptions = useMemo(
    () => Array.from(new Set(rows.map((r) => r.category).filter(Boolean))),
    [rows]
  );

  const filtered = useMemo(() => {
    let list = [...rows];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.question.toLowerCase().includes(q));
    }
    if (category) list = list.filter((r) => r.category === category);
    if (status) list = list.filter((r) => (status === "active" ? r.isActive : !r.isActive));
    if (appTypeFilter) list = list.filter((r) => r.appType.includes(appTypeFilter));
    return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [rows, search, category, status, appTypeFilter]);

  useEffect(() => setPage(1), [search, category, status, appTypeFilter]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const hasActiveFilters = Boolean(search || category || status || appTypeFilter);
  const clearAllFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
    setAppTypeFilter("");
  };

  const openCreate = () => {
    setEditingFaq(null);
    setDrawerOpen(true);
  };
  const openEdit = (row) => {
    setEditingFaq(row);
    setDrawerOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editingFaq) {
        await updateFaq(editingFaq.id, payload);
      } else {
        await createFaq(payload);
      }
      setDrawerOpen(false);
      await load();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Save failed", text: e?.response?.data?.message || "Something went wrong. Backend endpoint may not be connected yet." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (row, next) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: next } : r)));
    try {
      await toggleFaqStatus(row.id, next);
    } catch (e) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: !next } : r)));
      Swal.fire({ icon: "error", title: "Could not update status", text: e?.response?.data?.message || "Something went wrong." });
    }
  };

  const requestDelete = (ids) => setConfirmState({ open: true, mode: "delete", ids });
  const requestBulkStatus = (ids, nextStatus) => setConfirmState({ open: true, mode: nextStatus ? "activate" : "deactivate", ids, nextStatus });

  const handleConfirm = async () => {
    const { mode, ids, nextStatus } = confirmState;
    setConfirmLoading(true);
    try {
      if (mode === "delete") {
        if (ids.length > 1) await bulkDeleteFaqs(ids);
        else await deleteFaq(ids[0]);
      } else {
        await Promise.all(ids.map((id) => toggleFaqStatus(id, nextStatus)));
      }
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setConfirmState({ open: false, mode: null, ids: [] });
      await load();
    } catch (e) {
      Swal.fire({ icon: "error", title: "Action failed", text: e?.response?.data?.message || "Something went wrong." });
    } finally {
      setConfirmLoading(false);
    }
  };

  const toggleRow = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelectedIds((prev) => (prev.length === paged.length ? [] : paged.map((r) => r.id)));

  const columns = [
    {
      key: "question",
      label: "Question",
      render: (r) => (
        <Tooltip title={r.question} placement="top-start">
          <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 340 }}>
            {truncate(r.question)}
          </Typography>
        </Tooltip>
      ),
    },
    {
      key: "appType",
      label: "App Type",
      render: (r) => <Chip label={formatAppType(r.appType)} size="small" sx={{ bgcolor: "#eef2ff", color: "#4338ca", fontWeight: 600 }} />,
    },
    {
      key: "category",
      label: "Category",
      render: (r) => (r.category ? <Chip label={r.category} size="small" sx={{ bgcolor: "#ecfeff", color: "#0e7490", fontWeight: 600 }} /> : "—"),
    },
    { key: "displayOrder", label: "Order" },
    { key: "status", label: "Status", render: (r) => <StatusSwitch checked={r.isActive} onChange={(v) => handleToggleStatus(r, v)} /> },
    {
      key: "hasVideo",
      label: "Has Video",
      render: (r) => (r.videoUrl ? <Chip label="✓" size="small" sx={{ bgcolor: "#ecfdf5", color: "#047857", fontWeight: 700 }} /> : "—"),
    },
    {
      key: "updatedAt",
      label: "Updated At",
      render: (r) => <Typography variant="caption" color="text.secondary">{formatDate(r.updatedAt)}</Typography>,
    },
  ];

  const getRowActions = (row) => [
    { label: "View", onClick: () => setViewFaq(row) },
    { label: "Edit", onClick: () => openEdit(row) },
    { label: row.isActive ? "Deactivate" : "Activate", onClick: () => handleToggleStatus(row, !row.isActive) },
    { label: "Delete", color: "#ef4444", onClick: () => requestDelete([row.id]) },
  ];

  return (
    <Box>
      <PrefHeader
        title="FAQ"
        count={rows.length}
        countLabel="FAQ"
        onRefresh={load}
        onAdd={openCreate}
        addLabel="Add FAQ"
      />

      {error && (
        <Box sx={{ mb: 2.5, p: 2, borderRadius: "12px", bgcolor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600 }}>
          {error}
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <SupportSearch value={search} onChange={setSearch} placeholder="Search by question…" />
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <FilterSelect
          label="App Type"
          value={appTypeFilter}
          onChange={setAppTypeFilter}
          options={[
            { value: "user", label: "User App" },
            { value: "dealer", label: "Dealer App" },
          ]}
        />
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={categoryOptions.map((c) => ({ value: c, label: c }))}
        />
        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
          ]}
        />
        {hasActiveFilters && (
          <Chip label="Clear all" size="small" onClick={clearAllFilters} onDelete={clearAllFilters} sx={{ bgcolor: "#f1f5f9", fontWeight: 600, color: "#475569" }} />
        )}
      </Stack>

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={[
          { label: "Activate", icon: <ToggleOn fontSize="small" />, onClick: () => requestBulkStatus(selectedIds, true) },
          { label: "Deactivate", icon: <ToggleOff fontSize="small" />, onClick: () => requestBulkStatus(selectedIds, false) },
          { label: "Delete", icon: <Delete fontSize="small" />, color: "error", onClick: () => requestDelete(selectedIds) },
        ]}
      />

      <SupportTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        getRowActions={getRowActions}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        emptyState={<SupportEmptyState filtered={rows.length > 0} accentColor={ACCENT} onClearFilters={clearAllFilters} />}
      />

      <FaqFormDrawer open={drawerOpen} faq={editingFaq} saving={saving} onClose={() => setDrawerOpen(false)} onSave={handleSave} />

      <FormDrawer
        open={Boolean(viewFaq)}
        onClose={() => setViewFaq(null)}
        title={viewFaq?.question}
        subtitle="FAQ DETAILS"
        hideFooter
        accentColor={ACCENT}
      >
        {viewFaq && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">App Type</Typography>
                <Typography variant="body1" fontWeight={700}>{formatAppType(viewFaq.appType)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Category</Typography>
                <Typography variant="body1" fontWeight={700}>{viewFaq.category || "—"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Display Order</Typography>
                <Typography variant="body1" fontWeight={700}>{viewFaq.displayOrder}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box><StatusSwitch checked={viewFaq.isActive} onChange={(v) => handleToggleStatus(viewFaq, v)} /></Box>
              </Grid>
            </Grid>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Answer</Typography>
              <Box
                sx={{
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  color: "#1e293b",
                  "& h1, & h2, & h3, & h4, & h5, & h6": { fontWeight: 700, my: 1 },
                  "& blockquote": { borderLeft: "3px solid #cbd5e1", pl: 1.5, ml: 0, color: "#64748b" },
                  "& ul, & ol": { pl: 3 },
                  "& a": { color: "#2563eb" },
                  "& table": { borderCollapse: "collapse", width: "100%" },
                  "& td, & th": { border: "1px solid #e2e8f0", padding: "6px 8px" },
                  "& img": { maxWidth: "100%" },
                  "& hr": { border: 0, borderTop: "1px solid #e2e8f0", my: 2 },
                }}
                // Sanitized client-side too (defense in depth) — the backend
                // already strips scripts/handlers on save, but any answer
                // rendered here goes through DOMPurify regardless of source.
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewFaq.answer) }}
              />
            </Box>
            {viewFaq.videoUrl && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>Video</Typography>
                <Box
                  component="iframe"
                  src={viewFaq.videoUrl}
                  title="FAQ video"
                  allowFullScreen
                  sx={{ width: "100%", aspectRatio: "16/9", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                />
              </Box>
            )}
          </Stack>
        )}
      </FormDrawer>

      <ConfirmDialog
        open={confirmState.open}
        loading={confirmLoading}
        title={confirmState.mode === "delete" ? "Delete FAQ(s)?" : confirmState.mode === "activate" ? "Activate FAQ(s)?" : "Deactivate FAQ(s)?"}
        message={
          confirmState.mode === "delete"
            ? `This will permanently delete ${confirmState.ids.length} FAQ(s). This action cannot be undone.`
            : `This will ${confirmState.mode} ${confirmState.ids.length} FAQ(s).`
        }
        confirmLabel={confirmState.mode === "delete" ? "Delete" : "Confirm"}
        confirmColor={confirmState.mode === "delete" ? "error" : "primary"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, mode: null, ids: [] })}
      />
    </Box>
  );
};

export default FaqManager;

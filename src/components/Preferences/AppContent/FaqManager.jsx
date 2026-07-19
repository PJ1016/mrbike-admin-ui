import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, Grid, Stack, Tooltip, Typography } from "@mui/material";
import { Delete, ToggleOff, ToggleOn } from "@mui/icons-material";
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

const normalize = (f) => ({
  id: f._id || f.id,
  question: f.question || "",
  answer: f.answer || "",
  category: f.category || "",
  displayOrder: f.displayOrder ?? 0,
  isActive: f.isActive ?? true,
  createdAt: f.createdAt || null,
});

// Generic CRUD table+drawer for FAQ entries. Mirrors PromoCodes.jsx / the
// AppBannerManager pattern; Category filter options are derived from the
// loaded rows (no fixed enum exists on the backend for this field), same
// approach TransactionFilters.jsx uses for dealerOptions.
const FaqManager = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
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
    return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [rows, search, category, status]);

  useEffect(() => setPage(1), [search, category, status]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const hasActiveFilters = Boolean(search || category || status);
  const clearAllFilters = () => {
    setSearch("");
    setCategory("");
    setStatus("");
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
      key: "category",
      label: "Category",
      render: (r) => (r.category ? <Chip label={r.category} size="small" sx={{ bgcolor: "#ecfeff", color: "#0e7490", fontWeight: 600 }} /> : "—"),
    },
    { key: "displayOrder", label: "Order" },
    { key: "status", label: "Status", render: (r) => <StatusSwitch checked={r.isActive} onChange={(v) => handleToggleStatus(r, v)} /> },
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
                  "& h3": { fontSize: "1.05rem", fontWeight: 700, my: 1 },
                  "& blockquote": { borderLeft: "3px solid #cbd5e1", pl: 1.5, ml: 0, color: "#64748b" },
                  "& ul, & ol": { pl: 3 },
                  "& a": { color: "#2563eb" },
                }}
                dangerouslySetInnerHTML={{ __html: viewFaq.answer }}
              />
            </Box>
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

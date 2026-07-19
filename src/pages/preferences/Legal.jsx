import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Stack } from "@mui/material";
import { ToggleOff, ToggleOn } from "@mui/icons-material";
import Swal from "sweetalert2";

import PrefHeader from "../../components/Preferences/shared/PrefHeader";
import FilterSelect from "../../components/Preferences/shared/FilterSelect";
import BulkActionBar from "../../components/Preferences/shared/BulkActionBar";
import StatusSwitch from "../../components/Preferences/shared/StatusSwitch";
import ConfirmDialog from "../../components/Preferences/shared/ConfirmDialog";
import SupportSearch from "../../components/Support/SupportSearch";
import SupportTable from "../../components/Support/SupportTable";
import SupportEmptyState from "../../components/Support/SupportEmptyState";
import LegalDocumentDrawer from "../../components/Preferences/Legal/LegalDocumentDrawer";
import LegalDocumentViewDrawer from "../../components/Preferences/Legal/LegalDocumentViewDrawer";
import {
  LEGAL_DOC_TYPES,
  getLegalDocuments,
  updateLegalDocument,
  toggleLegalDocumentStatus,
} from "../../api/preferences/legalApi";

const ACCENT = "#0f766e";

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const audienceColor = (audience) =>
  audience === "User" ? "#2563eb" : audience === "Dealer" ? "#9333ea" : ACCENT;

// The row list is ALWAYS the 8 fixed legal document types — this is the real
// catalog this page manages, not placeholder data. Each type is merged with
// whatever content/status/updatedAt the API returned for it (matched by
// docType/type/key), or safe empty defaults if the API call fails or the
// document hasn't been created on the backend yet.
const mergeWithApiDocs = (apiDocs) =>
  LEGAL_DOC_TYPES.map((docType) => {
    const match = (apiDocs || []).find(
      (d) => (d?.docType || d?.type || d?.key) === docType.key
    );
    return {
      id: docType.key,
      key: docType.key,
      label: docType.label,
      audience: docType.audience,
      content: match?.content || "",
      isPublished: match?.isPublished ?? false,
      updatedAt: match?.updatedAt || null,
    };
  });

const Legal = () => {
  const [rows, setRows] = useState(mergeWithApiDocs([]));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [audience, setAudience] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [saving, setSaving] = useState(false);

  const [viewDoc, setViewDoc] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, mode: null, ids: [] });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    let apiDocs = [];
    try {
      const res = await getLegalDocuments();
      apiDocs = res?.data || res?.documents || (Array.isArray(res) ? res : []);
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          "Could not load legal documents. This module needs its backend endpoints connected."
      );
      apiDocs = [];
    }
    setRows(mergeWithApiDocs(apiDocs));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.label.toLowerCase().includes(q));
    }
    if (audience) list = list.filter((r) => r.audience === audience);
    return list;
  }, [rows, search, audience]);

  // Fixed catalog of 8 documents — every row always fits on a single page,
  // so there's no real pagination to wire up beyond satisfying SupportTable's
  // props.
  const page = 1;
  const pageSize = 20;
  const total = filtered.length;
  const paged = filtered;

  const hasActiveFilters = Boolean(search || audience);
  const clearAllFilters = () => {
    setSearch("");
    setAudience("");
  };

  const openEdit = (row) => {
    setEditingDoc(row);
    setDrawerOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      await updateLegalDocument(editingDoc.key, payload);
      setDrawerOpen(false);
      await load();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Save failed",
        text: e?.response?.data?.message || "Something went wrong. Backend endpoint may not be connected yet.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (row, next) => {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isPublished: next } : r)));
    try {
      await toggleLegalDocumentStatus(row.key, next);
    } catch (e) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isPublished: !next } : r)));
      Swal.fire({
        icon: "error",
        title: "Could not update status",
        text: e?.response?.data?.message || "Something went wrong.",
      });
    }
  };

  const requestBulkStatus = (ids, nextStatus) =>
    setConfirmState({ open: true, mode: nextStatus ? "publish" : "unpublish", ids, nextStatus });

  const handleConfirm = async () => {
    const { ids, nextStatus } = confirmState;
    setConfirmLoading(true);
    try {
      await Promise.all(ids.map((id) => toggleLegalDocumentStatus(id, nextStatus)));
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      setConfirmState({ open: false, mode: null, ids: [] });
      await load();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Action failed",
        text: e?.response?.data?.message || "Something went wrong.",
      });
    } finally {
      setConfirmLoading(false);
    }
  };

  const toggleRow = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelectedIds((prev) => (prev.length === paged.length ? [] : paged.map((r) => r.id)));

  const columns = [
    { key: "label", label: "Document Name", render: (r) => <strong>{r.label}</strong> },
    {
      key: "audience",
      label: "Audience",
      render: (r) => (
        <Chip
          label={r.audience}
          size="small"
          sx={{ bgcolor: `${audienceColor(r.audience)}15`, color: audienceColor(r.audience), fontWeight: 700 }}
        />
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <StatusSwitch
          checked={r.isPublished}
          onChange={(v) => handleToggleStatus(r, v)}
          activeLabel="Published"
          inactiveLabel="Draft"
        />
      ),
    },
    { key: "updatedAt", label: "Last Updated", render: (r) => fmtDate(r.updatedAt) },
  ];

  const getRowActions = (row) => [
    { label: "View", onClick: () => setViewDoc(row) },
    { label: "Edit", onClick: () => openEdit(row) },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <PrefHeader
        title="Legal"
        subtitle="Manage legal documents and policies"
        onRefresh={load}
      />

      {error && (
        <Box
          sx={{
            mb: 2.5,
            p: 2,
            borderRadius: "12px",
            bgcolor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          {error}
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <SupportSearch value={search} onChange={setSearch} placeholder="Search by document name…" />
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <FilterSelect
          label="Audience"
          value={audience}
          onChange={setAudience}
          options={[
            { value: "User", label: "User" },
            { value: "Dealer", label: "Dealer" },
            { value: "Both", label: "Both" },
          ]}
        />
        {hasActiveFilters && (
          <Chip
            label="Clear all"
            size="small"
            onClick={clearAllFilters}
            onDelete={clearAllFilters}
            sx={{ bgcolor: "#f1f5f9", fontWeight: 600, color: "#475569" }}
          />
        )}
      </Stack>

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        actions={[
          { label: "Publish", icon: <ToggleOn fontSize="small" />, onClick: () => requestBulkStatus(selectedIds, true) },
          { label: "Unpublish", icon: <ToggleOff fontSize="small" />, onClick: () => requestBulkStatus(selectedIds, false) },
        ]}
      />

      <SupportTable
        columns={columns}
        rows={paged}
        loading={loading}
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        getRowActions={getRowActions}
        selectable
        selectedIds={selectedIds}
        onToggleRow={toggleRow}
        onToggleAll={toggleAll}
        emptyState={<SupportEmptyState filtered={rows.length > 0} accentColor={ACCENT} onClearFilters={clearAllFilters} />}
      />

      <LegalDocumentDrawer
        open={drawerOpen}
        doc={editingDoc}
        saving={saving}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />

      <LegalDocumentViewDrawer open={Boolean(viewDoc)} doc={viewDoc} onClose={() => setViewDoc(null)} />

      <ConfirmDialog
        open={confirmState.open}
        loading={confirmLoading}
        title={confirmState.mode === "publish" ? "Publish document(s)?" : "Unpublish document(s)?"}
        message={`This will ${confirmState.mode} ${confirmState.ids.length} legal document(s).`}
        confirmLabel="Confirm"
        confirmColor="primary"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, mode: null, ids: [] })}
      />
    </Box>
  );
};

export default Legal;

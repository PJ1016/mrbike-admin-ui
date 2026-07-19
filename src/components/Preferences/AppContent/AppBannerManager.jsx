import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { Delete, Image as ImageIcon, ToggleOff, ToggleOn } from "@mui/icons-material";
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
import BannerFormDrawer from "./BannerFormDrawer";
import {
  BANNER_TYPES,
  getAppBanners,
  createAppBanner,
  updateAppBanner,
  deleteAppBanner,
  toggleAppBannerStatus,
  bulkDeleteAppBanners,
} from "../../../api/preferences/appContentApi";

const ACCENTS = {
  [BANNER_TYPES.HOME]: "#2563eb",
  [BANNER_TYPES.POPUP]: "#7c3aed",
  [BANNER_TYPES.ANNOUNCEMENT]: "#ea580c",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "");

const fmtSchedule = (row) => {
  if (!row.scheduleStart && !row.scheduleEnd) return "Always";
  return `${fmtDate(row.scheduleStart) || "—"} – ${fmtDate(row.scheduleEnd) || "—"}`;
};

const normalize = (b) => ({
  id: b._id || b.id,
  image: b.image || b.imageUrl || "",
  title: b.title || "",
  linkUrl: b.linkUrl || "",
  displayOrder: b.displayOrder ?? 0,
  scheduleStart: b.scheduleStart || null,
  scheduleEnd: b.scheduleEnd || null,
  isActive: b.isActive ?? true,
  createdAt: b.createdAt || null,
});

// Generic, reusable CRUD table+drawer for a single app-content banner
// collection. `bannerType` selects which collection (home / popup /
// announcement) this instance manages — AppContent.jsx mounts one of these
// per tab. Mirrors the PromoCodes.jsx page pattern, packaged as a component
// instead of a page so it can be reused across the three banner tabs.
const AppBannerManager = ({ bannerType, title }) => {
  const ACCENT = ACCENTS[bannerType] || "#2563eb";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  const [viewBanner, setViewBanner] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, mode: null, ids: [] });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAppBanners(bannerType);
      const list = res?.data || res?.banners || (Array.isArray(res) ? res : []);
      setRows(list.map(normalize));
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load banners. This module needs its backend endpoints connected.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerType]);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (status) list = list.filter((r) => (status === "active" ? r.isActive : !r.isActive));
    return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [rows, search, status]);

  useEffect(() => setPage(1), [search, status, bannerType]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const hasActiveFilters = Boolean(search || status);
  const clearAllFilters = () => {
    setSearch("");
    setStatus("");
  };

  const openCreate = () => {
    setEditingBanner(null);
    setDrawerOpen(true);
  };
  const openEdit = (row) => {
    setEditingBanner(row);
    setDrawerOpen(true);
  };

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      if (editingBanner) {
        await updateAppBanner(bannerType, editingBanner.id, formData);
      } else {
        await createAppBanner(bannerType, formData);
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
      await toggleAppBannerStatus(bannerType, row.id, next);
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
        if (ids.length > 1) await bulkDeleteAppBanners(bannerType, ids);
        else await deleteAppBanner(bannerType, ids[0]);
      } else {
        await Promise.all(ids.map((id) => toggleAppBannerStatus(bannerType, id, nextStatus)));
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
      key: "thumbnail",
      label: "Thumbnail",
      render: (r) =>
        r.image ? (
          <Box component="img" src={r.image} alt={r.title} sx={{ width: 48, height: 48, objectFit: "cover", borderRadius: "6px" }} />
        ) : (
          <Box sx={{ width: 48, height: 48, borderRadius: "6px", bgcolor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
            <ImageIcon fontSize="small" />
          </Box>
        ),
    },
    { key: "title", label: "Title", render: (r) => <strong>{r.title}</strong> },
    {
      key: "linkUrl",
      label: "Link URL",
      render: (r) => (r.linkUrl ? <Typography variant="body2" sx={{ color: "#2563eb", maxWidth: 220 }} noWrap>{r.linkUrl}</Typography> : "—"),
    },
    { key: "displayOrder", label: "Display Order" },
    { key: "schedule", label: "Schedule", render: (r) => fmtSchedule(r) },
    { key: "status", label: "Status", render: (r) => <StatusSwitch checked={r.isActive} onChange={(v) => handleToggleStatus(r, v)} /> },
  ];

  const getRowActions = (row) => [
    { label: "View", onClick: () => setViewBanner(row) },
    { label: "Edit", onClick: () => openEdit(row) },
    { label: row.isActive ? "Deactivate" : "Activate", onClick: () => handleToggleStatus(row, !row.isActive) },
    { label: "Delete", color: "#ef4444", onClick: () => requestDelete([row.id]) },
  ];

  return (
    <Box>
      <PrefHeader
        title={title}
        count={rows.length}
        countLabel="banner"
        onRefresh={load}
        onAdd={openCreate}
        addLabel="Add Banner"
      />

      {error && (
        <Box sx={{ mb: 2.5, p: 2, borderRadius: "12px", bgcolor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600 }}>
          {error}
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <SupportSearch value={search} onChange={setSearch} placeholder="Search by banner title…" />
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
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

      <BannerFormDrawer
        open={drawerOpen}
        banner={editingBanner}
        bannerType={bannerType}
        saving={saving}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />

      <FormDrawer
        open={Boolean(viewBanner)}
        onClose={() => setViewBanner(null)}
        title={viewBanner?.title}
        subtitle="BANNER DETAILS"
        hideFooter
        accentColor={ACCENT}
      >
        {viewBanner && (
          <Stack spacing={2}>
            {viewBanner.image ? (
              <Box component="img" src={viewBanner.image} alt={viewBanner.title} sx={{ width: "100%", borderRadius: "10px", border: "1px solid #f1f5f9" }} />
            ) : (
              <Box sx={{ width: "100%", height: 140, borderRadius: "10px", bgcolor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                <ImageIcon />
              </Box>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Link URL</Typography>
                <Typography variant="body1" fontWeight={700}>{viewBanner.linkUrl || "—"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Display Order</Typography>
                <Typography variant="body1" fontWeight={700}>{viewBanner.displayOrder}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box><StatusSwitch checked={viewBanner.isActive} onChange={(v) => handleToggleStatus(viewBanner, v)} /></Box>
              </Grid>
            </Grid>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Schedule</Typography>
              <Typography variant="body1" fontWeight={700}>{fmtSchedule(viewBanner)}</Typography>
            </Box>
          </Stack>
        )}
      </FormDrawer>

      <ConfirmDialog
        open={confirmState.open}
        loading={confirmLoading}
        title={confirmState.mode === "delete" ? "Delete banner(s)?" : confirmState.mode === "activate" ? "Activate banner(s)?" : "Deactivate banner(s)?"}
        message={
          confirmState.mode === "delete"
            ? `This will permanently delete ${confirmState.ids.length} banner(s). This action cannot be undone.`
            : `This will ${confirmState.mode} ${confirmState.ids.length} banner(s).`
        }
        confirmLabel={confirmState.mode === "delete" ? "Delete" : "Confirm"}
        confirmColor={confirmState.mode === "delete" ? "error" : "primary"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, mode: null, ids: [] })}
      />
    </Box>
  );
};

export default AppBannerManager;

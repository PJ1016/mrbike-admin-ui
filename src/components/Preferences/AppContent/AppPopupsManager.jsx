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

const ACCENT = "#7c3aed";

const TYPE_META = {
  [BANNER_TYPES.HOME]: { label: "Home Hero", bg: "#dbeafe", color: "#2563eb" },
  [BANNER_TYPES.POPUP]: { label: "Popup", bg: "#ede9fe", color: "#7c3aed" },
  [BANNER_TYPES.ANNOUNCEMENT]: { label: "Announcement", bg: "#ffedd5", color: "#ea580c" },
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const normalize = (b, fallbackType) => ({
  id: b._id || b.id,
  bannerType: b.bannerType || fallbackType,
  image: b.image || b.imageUrl || "",
  title: b.title || "",
  description: b.description || "",
  linkUrl: b.linkUrl || "",
  displayOrder: b.displayOrder ?? 0,
  scheduleStart: b.scheduleStart || null,
  scheduleEnd: b.scheduleEnd || null,
  locationType: b.locationType || "all",
  placeName: b.placeName || "",
  latitude: b.latitude ?? null,
  longitude: b.longitude ?? null,
  radiusKm: b.radiusKm ?? 10,
  isActive: b.isActive ?? true,
  createdAt: b.createdAt || null,
});

// App Popups — merges the former "Popup Banners" and "Announcement Banners"
// tabs into a single workspace. Both are the same AppBanner collection,
// discriminated only by bannerType ("popup" / "announcement"), so this
// component fetches both collections and presents them as one list with a
// Type filter/column. Reuses the shared BannerFormDrawer (which has its own
// Type field) so create/edit still goes through the same, unchanged backend
// endpoints per type.
const AppPopupsManager = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
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
      const [homeRes, popupRes, announcementRes] = await Promise.all([
        getAppBanners(BANNER_TYPES.HOME),
        getAppBanners(BANNER_TYPES.POPUP),
        getAppBanners(BANNER_TYPES.ANNOUNCEMENT),
      ]);
      const toList = (res) => res?.data || res?.banners || (Array.isArray(res) ? res : []);
      setRows([
        ...toList(homeRes).map((b) => normalize(b, BANNER_TYPES.HOME)),
        ...toList(popupRes).map((b) => normalize(b, BANNER_TYPES.POPUP)),
        ...toList(announcementRes).map((b) => normalize(b, BANNER_TYPES.ANNOUNCEMENT)),
      ]);
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load popups. This module needs its backend endpoints connected.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = [...rows];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q));
    }
    if (typeFilter) list = list.filter((r) => r.bannerType === typeFilter);
    if (status) list = list.filter((r) => (status === "active" ? r.isActive : !r.isActive));
    return list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [rows, search, typeFilter, status]);

  useEffect(() => setPage(1), [search, typeFilter, status]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const hasActiveFilters = Boolean(search || typeFilter || status);
  const clearAllFilters = () => {
    setSearch("");
    setTypeFilter("");
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

  const handleSave = async (formData, selectedType) => {
    setSaving(true);
    try {
      if (editingBanner) {
        await updateAppBanner(editingBanner.bannerType, editingBanner.id, formData);
      } else {
        await createAppBanner(selectedType || BANNER_TYPES.POPUP, formData);
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
      await toggleAppBannerStatus(row.bannerType, row.id, next);
    } catch (e) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: !next } : r)));
      Swal.fire({ icon: "error", title: "Could not update status", text: e?.response?.data?.message || "Something went wrong." });
    }
  };

  const requestDelete = (ids) => setConfirmState({ open: true, mode: "delete", ids });
  const requestBulkStatus = (ids, nextStatus) => setConfirmState({ open: true, mode: nextStatus ? "activate" : "deactivate", ids, nextStatus });

  // Selected ids can span both bannerType collections, so bulk actions are
  // grouped by type before hitting the (per-type) bulk/toggle endpoints.
  const groupIdsByType = (ids) => {
    const groups = { [BANNER_TYPES.HOME]: [], [BANNER_TYPES.POPUP]: [], [BANNER_TYPES.ANNOUNCEMENT]: [] };
    ids.forEach((id) => {
      const row = rows.find((r) => r.id === id);
      if (row) groups[row.bannerType].push(id);
    });
    return groups;
  };

  const handleConfirm = async () => {
    const { mode, ids, nextStatus } = confirmState;
    setConfirmLoading(true);
    try {
      const groups = groupIdsByType(ids);
      if (mode === "delete") {
        await Promise.all(
          Object.entries(groups).map(([type, typeIds]) => {
            if (!typeIds.length) return null;
            return typeIds.length > 1 ? bulkDeleteAppBanners(type, typeIds) : deleteAppBanner(type, typeIds[0]);
          })
        );
      } else {
        await Promise.all(
          Object.entries(groups).flatMap(([type, typeIds]) => typeIds.map((id) => toggleAppBannerStatus(type, id, nextStatus)))
        );
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
      key: "image",
      label: "Image",
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
      key: "type",
      label: "Type",
      render: (r) => (
        <Chip
          label={TYPE_META[r.bannerType]?.label || r.bannerType}
          size="small"
          sx={{ bgcolor: TYPE_META[r.bannerType]?.bg, color: TYPE_META[r.bannerType]?.color, fontWeight: 700 }}
        />
      ),
    },
    { key: "status", label: "Status", render: (r) => <StatusSwitch checked={r.isActive} onChange={(v) => handleToggleStatus(r, v)} /> },
    { key: "displayOrder", label: "Display Order" },
    { key: "scheduleStart", label: "Start Date", render: (r) => fmtDate(r.scheduleStart) },
    { key: "scheduleEnd", label: "End Date", render: (r) => fmtDate(r.scheduleEnd) },
    { key: "createdBy", label: "Created By", render: () => "—" },
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
        title="App Popups"
        count={rows.length}
        countLabel="item"
        onRefresh={load}
        onAdd={openCreate}
        addLabel="Add Popup"
      />

      {error && (
        <Box sx={{ mb: 2.5, p: 2, borderRadius: "12px", bgcolor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600 }}>
          {error}
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <SupportSearch value={search} onChange={setSearch} placeholder="Search by title…" />
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <FilterSelect
          label="Type"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: BANNER_TYPES.HOME, label: "Home Hero" },
            { value: BANNER_TYPES.POPUP, label: "Popup" },
            { value: BANNER_TYPES.ANNOUNCEMENT, label: "Announcement" },
          ]}
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

      <BannerFormDrawer
        open={drawerOpen}
        banner={editingBanner}
        saving={saving}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />

      <FormDrawer
        open={Boolean(viewBanner)}
        onClose={() => setViewBanner(null)}
        title={viewBanner?.title}
        subtitle="APP POPUPS"
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
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Box>
                  <Chip
                    label={TYPE_META[viewBanner.bannerType]?.label || viewBanner.bannerType}
                    size="small"
                    sx={{ bgcolor: TYPE_META[viewBanner.bannerType]?.bg, color: TYPE_META[viewBanner.bannerType]?.color, fontWeight: 700 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box><StatusSwitch checked={viewBanner.isActive} onChange={(v) => handleToggleStatus(viewBanner, v)} /></Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">Link URL</Typography>
                <Typography variant="body1" fontWeight={700}>{viewBanner.linkUrl || "—"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Display Order</Typography>
                <Typography variant="body1" fontWeight={700}>{viewBanner.displayOrder}</Typography>
              </Grid>
            </Grid>
            <Divider />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Start Date</Typography>
                <Typography variant="body1" fontWeight={700}>{fmtDate(viewBanner.scheduleStart)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">End Date</Typography>
                <Typography variant="body1" fontWeight={700}>{fmtDate(viewBanner.scheduleEnd)}</Typography>
              </Grid>
            </Grid>
          </Stack>
        )}
      </FormDrawer>

      <ConfirmDialog
        open={confirmState.open}
        loading={confirmLoading}
        title={confirmState.mode === "delete" ? "Delete item(s)?" : confirmState.mode === "activate" ? "Activate item(s)?" : "Deactivate item(s)?"}
        message={
          confirmState.mode === "delete"
            ? `This will permanently delete ${confirmState.ids.length} item(s). This action cannot be undone.`
            : `This will ${confirmState.mode} ${confirmState.ids.length} item(s).`
        }
        confirmLabel={confirmState.mode === "delete" ? "Delete" : "Confirm"}
        confirmColor={confirmState.mode === "delete" ? "error" : "primary"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, mode: null, ids: [] })}
      />
    </Box>
  );
};

export default AppPopupsManager;

import React, { useEffect, useMemo, useState } from "react";
import { Box, Chip, Divider, Grid, Stack, Typography } from "@mui/material";
import { Delete, ToggleOff, ToggleOn } from "@mui/icons-material";
import Swal from "sweetalert2";

import PrefHeader from "../../components/Preferences/shared/PrefHeader";
import FilterSelect from "../../components/Preferences/shared/FilterSelect";
import BulkActionBar from "../../components/Preferences/shared/BulkActionBar";
import StatusSwitch from "../../components/Preferences/shared/StatusSwitch";
import ConfirmDialog from "../../components/Preferences/shared/ConfirmDialog";
import FormDrawer from "../../components/Preferences/shared/FormDrawer";
import SupportSearch from "../../components/Support/SupportSearch";
import SupportTable from "../../components/Support/SupportTable";
import SupportEmptyState from "../../components/Support/SupportEmptyState";
import PromoCodeFormDrawer from "../../components/Preferences/PromoCodes/PromoCodeFormDrawer";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  togglePromoCodeStatus,
  bulkDeletePromoCodes,
  bulkUpdatePromoCodeStatus,
} from "../../api/preferences/promoCodeApi";

const ACCENT = "#7c3aed";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const fmtDiscount = (row) => (row.discountType === "percentage" ? `${row.discountValue}%` : `₹${row.discountValue}`);

const normalize = (p) => ({
  id: p._id || p.id,
  code: p.code || "",
  discountType: p.discountType || "percentage",
  discountValue: p.discountValue ?? 0,
  maxDiscount: p.maxDiscount ?? null,
  minOrder: p.minOrder ?? null,
  usageLimit: p.usageLimit ?? 0,
  usedCount: p.usedCount ?? 0,
  perUserLimit: p.perUserLimit ?? 0,
  validFrom: p.validFrom || null,
  validTo: p.validTo || null,
  isActive: p.isActive ?? true,
  createdAt: p.createdAt || null,
});

const PromoCodes = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [discountType, setDiscountType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);

  const [viewPromo, setViewPromo] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, mode: null, ids: [] });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getPromoCodes();
      const list = res?.data || res?.promoCodes || (Array.isArray(res) ? res : []);
      setRows(list.map(normalize));
    } catch (e) {
      setError(e?.response?.data?.message || "Could not load promo codes. This module needs its backend endpoints connected.");
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
      list = list.filter((r) => r.code.toLowerCase().includes(q));
    }
    if (discountType) list = list.filter((r) => r.discountType === discountType);
    if (status) list = list.filter((r) => (status === "active" ? r.isActive : !r.isActive));
    return list;
  }, [rows, search, discountType, status]);

  useEffect(() => setPage(1), [search, discountType, status]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const hasActiveFilters = Boolean(search || discountType || status);
  const clearAllFilters = () => {
    setSearch("");
    setDiscountType("");
    setStatus("");
  };

  const openCreate = () => {
    setEditingPromo(null);
    setDrawerOpen(true);
  };
  const openEdit = (row) => {
    setEditingPromo(row);
    setDrawerOpen(true);
  };

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (editingPromo) {
        await updatePromoCode(editingPromo.id, payload);
      } else {
        await createPromoCode(payload);
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
      await togglePromoCodeStatus(row.id, next);
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
        if (ids.length > 1) await bulkDeletePromoCodes(ids);
        else await deletePromoCode(ids[0]);
      } else {
        if (ids.length > 1) await bulkUpdatePromoCodeStatus(ids, nextStatus);
        else await togglePromoCodeStatus(ids[0], nextStatus);
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
      key: "code",
      label: "Promo Code",
      render: (r) => (
        <Chip label={r.code} size="small" sx={{ fontFamily: "monospace", fontWeight: 700, bgcolor: "#f5f3ff", color: "#7c3aed" }} />
      ),
    },
    { key: "discount", label: "Discount", render: (r) => <strong>{fmtDiscount(r)}</strong> },
    { key: "maxDiscount", label: "Max Discount", render: (r) => (r.maxDiscount != null ? `₹${r.maxDiscount}` : "—") },
    { key: "minOrder", label: "Min Order", render: (r) => (r.minOrder != null ? `₹${r.minOrder}` : "—") },
    { key: "usage", label: "Usage", render: (r) => `${r.usedCount || 0} / ${r.usageLimit || "∞"}` },
    { key: "perUserLimit", label: "Per User Limit" },
    { key: "validity", label: "Validity", render: (r) => `${fmtDate(r.validFrom)} – ${fmtDate(r.validTo)}` },
    { key: "status", label: "Status", render: (r) => <StatusSwitch checked={r.isActive} onChange={(v) => handleToggleStatus(r, v)} /> },
  ];

  const getRowActions = (row) => [
    { label: "View", onClick: () => setViewPromo(row) },
    { label: "Edit", onClick: () => openEdit(row) },
    { label: row.isActive ? "Deactivate" : "Activate", onClick: () => handleToggleStatus(row, !row.isActive) },
    { label: "Delete", color: "#ef4444", onClick: () => requestDelete([row.id]) },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <PrefHeader
        title="Promo Codes"
        count={rows.length}
        countLabel="promo code"
        onRefresh={load}
        onAdd={openCreate}
        addLabel="Add Promo Code"
      />

      {error && (
        <Box sx={{ mb: 2.5, p: 2, borderRadius: "12px", bgcolor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.85rem", fontWeight: 600 }}>
          {error}
        </Box>
      )}

      <Box sx={{ mb: 2 }}>
        <SupportSearch value={search} onChange={setSearch} placeholder="Search by promo code…" />
      </Box>

      <Stack direction="row" flexWrap="wrap" gap={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <FilterSelect
          label="Discount Type"
          value={discountType}
          onChange={setDiscountType}
          options={[
            { value: "percentage", label: "Percentage" },
            { value: "flat", label: "Flat Amount" },
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

      <PromoCodeFormDrawer open={drawerOpen} promo={editingPromo} saving={saving} onClose={() => setDrawerOpen(false)} onSave={handleSave} />

      <FormDrawer
        open={Boolean(viewPromo)}
        onClose={() => setViewPromo(null)}
        title={viewPromo?.code}
        subtitle="PROMO CODE DETAILS"
        hideFooter
        accentColor={ACCENT}
      >
        {viewPromo && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Discount</Typography>
                <Typography variant="body1" fontWeight={700}>{fmtDiscount(viewPromo)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Max Discount</Typography>
                <Typography variant="body1" fontWeight={700}>{viewPromo.maxDiscount != null ? `₹${viewPromo.maxDiscount}` : "No cap"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Minimum Order</Typography>
                <Typography variant="body1" fontWeight={700}>{viewPromo.minOrder != null ? `₹${viewPromo.minOrder}` : "None"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Usage</Typography>
                <Typography variant="body1" fontWeight={700}>{viewPromo.usedCount || 0} / {viewPromo.usageLimit || "∞"}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Per User Limit</Typography>
                <Typography variant="body1" fontWeight={700}>{viewPromo.perUserLimit}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Box><StatusSwitch checked={viewPromo.isActive} onChange={(v) => handleToggleStatus(viewPromo, v)} /></Box>
              </Grid>
            </Grid>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary">Validity Window</Typography>
              <Typography variant="body1" fontWeight={700}>{fmtDate(viewPromo.validFrom)} – {fmtDate(viewPromo.validTo)}</Typography>
            </Box>
          </Stack>
        )}
      </FormDrawer>

      <ConfirmDialog
        open={confirmState.open}
        loading={confirmLoading}
        title={confirmState.mode === "delete" ? "Delete promo code(s)?" : confirmState.mode === "activate" ? "Activate promo code(s)?" : "Deactivate promo code(s)?"}
        message={
          confirmState.mode === "delete"
            ? `This will permanently delete ${confirmState.ids.length} promo code(s). This action cannot be undone.`
            : `This will ${confirmState.mode} ${confirmState.ids.length} promo code(s).`
        }
        confirmLabel={confirmState.mode === "delete" ? "Delete" : "Confirm"}
        confirmColor={confirmState.mode === "delete" ? "error" : "primary"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, mode: null, ids: [] })}
      />
    </Box>
  );
};

export default PromoCodes;

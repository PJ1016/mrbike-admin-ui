import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Grid, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Add, Delete, Refresh, ToggleOff, ToggleOn } from "@mui/icons-material";
import Swal from "sweetalert2";

import BulkActionBar from "../shared/BulkActionBar";
import StatusSwitch from "../shared/StatusSwitch";
import ConfirmDialog from "../shared/ConfirmDialog";
import FormDrawer from "../shared/FormDrawer";
import SupportSearch from "../../Support/SupportSearch";
import SupportTable from "../../Support/SupportTable";
import SupportEmptyState from "../../Support/SupportEmptyState";
import RuleFormDrawer from "./RuleFormDrawer";
import {
  getRewardRules,
  createRewardRule,
  updateRewardRule,
  deleteRewardRule,
  toggleRewardRuleStatus,
  bulkDeleteRewardRules,
  bulkUpdateRewardRuleStatus,
} from "../../../api/preferences/rewardRuleApi";

// One generic, config-driven CRUD table + drawer, reused for all five
// reward-rule tabs on the Rewards & Referral page. Mirrors the PromoCodes.jsx
// page pattern (search/pagination/bulk-select/bulk-actions/confirm-dialog/
// view-drawer) almost exactly, but as a component parameterized by
// `ruleType` + `fields` + `columns` instead of a one-off page per rule type.
const normalizeRow = (r) => ({
  ...r,
  id: r._id || r.id,
  isActive: r.isActive ?? true,
});

const RewardRuleManager = ({
  ruleType,
  title,
  accentColor = "#059669",
  fields = [],
  columns = [],
  searchFields = [],
  emptyMessage,
}) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [saving, setSaving] = useState(false);

  const [viewRule, setViewRule] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, mode: null, ids: [] });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getRewardRules(ruleType);
      const list = res?.data || res?.rules || (Array.isArray(res) ? res : []);
      setRows((Array.isArray(list) ? list : []).map(normalizeRow));
    } catch (e) {
      setError(
        e?.response?.data?.message ||
          `Could not load ${title.toLowerCase()}. This module needs its backend endpoints connected.`
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleType]);

  const filtered = useMemo(() => {
    if (!search.trim() || !searchFields.length) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => searchFields.some((key) => String(r[key] ?? "").toLowerCase().includes(q)));
  }, [rows, search, searchFields]);

  useEffect(() => setPage(1), [search]);

  const total = filtered.length;
  const paged = useMemo(() => filtered.slice((page - 1) * pageSize, page * pageSize), [filtered, page, pageSize]);

  const openCreate = () => {
    setEditingRule(null);
    setDrawerOpen(true);
  };
  const openEdit = (row) => {
    setEditingRule(row);
    setDrawerOpen(true);
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = { ...values };
      fields.forEach((f) => {
        if (f.type === "number" && payload[f.key] !== "" && payload[f.key] !== null && payload[f.key] !== undefined) {
          payload[f.key] = Number(payload[f.key]);
        }
      });
      if (editingRule) {
        await updateRewardRule(ruleType, editingRule.id, payload);
      } else {
        await createRewardRule(ruleType, payload);
      }
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
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: next } : r)));
    try {
      await toggleRewardRuleStatus(ruleType, row.id, next);
    } catch (e) {
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, isActive: !next } : r)));
      Swal.fire({ icon: "error", title: "Could not update status", text: e?.response?.data?.message || "Something went wrong." });
    }
  };

  const requestDelete = (ids) => setConfirmState({ open: true, mode: "delete", ids });
  const requestBulkStatus = (ids, nextStatus) =>
    setConfirmState({ open: true, mode: nextStatus ? "activate" : "deactivate", ids, nextStatus });

  const handleConfirm = async () => {
    const { mode, ids, nextStatus } = confirmState;
    setConfirmLoading(true);
    try {
      if (mode === "delete") {
        if (ids.length > 1) await bulkDeleteRewardRules(ruleType, ids);
        else await deleteRewardRule(ruleType, ids[0]);
      } else {
        if (ids.length > 1) await bulkUpdateRewardRuleStatus(ruleType, ids, nextStatus);
        else await toggleRewardRuleStatus(ruleType, ids[0], nextStatus);
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
  const clearSearch = () => setSearch("");

  const tableColumns = [
    ...columns,
    { key: "status", label: "Status", render: (r) => <StatusSwitch checked={r.isActive} onChange={(v) => handleToggleStatus(r, v)} /> },
  ];

  const getRowActions = (row) => [
    { label: "View", onClick: () => setViewRule(row) },
    { label: "Edit", onClick: () => openEdit(row) },
    { label: row.isActive ? "Deactivate" : "Activate", onClick: () => handleToggleStatus(row, !row.isActive) },
    { label: "Delete", color: "#ef4444", onClick: () => requestDelete([row.id]) },
  ];

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b", mt: 0.25 }}>
            {rows.length} rule{rows.length === 1 ? "" : "s"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Tooltip title="Refresh">
            <IconButton onClick={load} sx={{ bgcolor: "white", border: "1px solid #f1f5f9", "&:hover": { bgcolor: "#f8fafc" } }}>
              <Refresh sx={{ fontSize: 18, color: "#64748b" }} />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreate}
            sx={{
              borderRadius: "10px",
              fontWeight: 700,
              boxShadow: "none",
              bgcolor: accentColor,
              "&:hover": { boxShadow: "none", bgcolor: accentColor, filter: "brightness(0.94)" },
            }}
          >
            Add Rule
          </Button>
        </Stack>
      </Stack>

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

      <Box sx={{ mb: 2.5 }}>
        <SupportSearch value={search} onChange={setSearch} placeholder="Search rules…" />
      </Box>

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
        columns={tableColumns}
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
        emptyState={<SupportEmptyState filtered={rows.length > 0} accentColor={accentColor} onClearFilters={clearSearch} />}
      />

      {emptyMessage && !loading && rows.length === 0 && !error && (
        <Typography variant="caption" sx={{ display: "block", mt: 1.5, color: "#94a3b8", textAlign: "center" }}>
          {emptyMessage}
        </Typography>
      )}

      <RuleFormDrawer
        open={drawerOpen}
        title={editingRule ? `Edit ${title}` : `Create ${title}`}
        fields={fields}
        record={editingRule}
        saving={saving}
        accentColor={accentColor}
        onClose={() => setDrawerOpen(false)}
        onSave={handleSave}
      />

      <FormDrawer
        open={Boolean(viewRule)}
        onClose={() => setViewRule(null)}
        title={(viewRule && fields[0] && viewRule[fields[0].key]) || title}
        subtitle="RULE DETAILS"
        hideFooter
        accentColor={accentColor}
      >
        {viewRule && (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              {fields.map((f) => (
                <Grid item xs={6} key={f.key}>
                  <Typography variant="caption" color="text.secondary">
                    {f.label}
                  </Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {f.type === "switch"
                      ? viewRule[f.key]
                        ? "Yes"
                        : "No"
                      : viewRule[f.key] !== undefined && viewRule[f.key] !== null && viewRule[f.key] !== ""
                      ? `${viewRule[f.key]}${f.adornment ? ` ${f.adornment}` : ""}`
                      : "—"}
                  </Typography>
                </Grid>
              ))}
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box>
                  <StatusSwitch checked={viewRule.isActive} onChange={(v) => handleToggleStatus(viewRule, v)} />
                </Box>
              </Grid>
            </Grid>
          </Stack>
        )}
      </FormDrawer>

      <ConfirmDialog
        open={confirmState.open}
        loading={confirmLoading}
        title={confirmState.mode === "delete" ? "Delete rule(s)?" : confirmState.mode === "activate" ? "Activate rule(s)?" : "Deactivate rule(s)?"}
        message={
          confirmState.mode === "delete"
            ? `This will permanently delete ${confirmState.ids.length} rule(s). This action cannot be undone.`
            : `This will ${confirmState.mode} ${confirmState.ids.length} rule(s).`
        }
        confirmLabel={confirmState.mode === "delete" ? "Delete" : "Confirm"}
        confirmColor={confirmState.mode === "delete" ? "error" : "primary"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState({ open: false, mode: null, ids: [] })}
      />
    </Box>
  );
};

export default RewardRuleManager;

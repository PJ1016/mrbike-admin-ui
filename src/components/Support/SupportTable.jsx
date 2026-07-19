import React, { useState } from "react";
import {
  Checkbox,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import SupportPagination from "./SupportPagination";

const RowActions = ({ row, getRowActions }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const actions = getRowActions(row) || [];
  if (!actions.length) return null;

  return (
    <>
      <IconButton
        size="small"
        aria-label="Row actions"
        onClick={(e) => {
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
      >
        <MoreVert fontSize="small" />
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} onClick={(e) => e.stopPropagation()}>
        {actions.map((a) => (
          <MenuItem
            key={a.label}
            onClick={() => {
              setAnchorEl(null);
              a.onClick(row);
            }}
            sx={{ fontSize: "0.85rem", color: a.color }}
          >
            {a.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

const SupportTable = ({
  columns,
  rows,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  onRowClick,
  getRowActions,
  emptyState,
  sortKey,
  sortDirection = "asc",
  onSortChange,
  selectable = false,
  selectedIds = [],
  onToggleRow,
  onToggleAll,
  getRowId = (row) => row.id,
}) => (
  <Paper elevation={0} sx={{ borderRadius: "14px", border: "1px solid #f1f5f9", overflow: "hidden" }}>
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table sx={{ minWidth: 900 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: "#f8fafc" }}>
            {selectable && (
              <TableCell padding="checkbox">
                <Checkbox
                  size="small"
                  indeterminate={selectedIds.length > 0 && selectedIds.length < rows.length}
                  checked={rows.length > 0 && selectedIds.length === rows.length}
                  onChange={() => onToggleAll?.()}
                />
              </TableCell>
            )}
            {columns.map((col) => (
              <TableCell
                key={col.key}
                sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}
                style={{ minWidth: col.minWidth }}
              >
                {col.sortable && onSortChange ? (
                  <TableSortLabel
                    active={sortKey === col.key}
                    direction={sortKey === col.key ? sortDirection : "asc"}
                    onClick={() => onSortChange(col.key)}
                    sx={{ "&.MuiTableSortLabel-root": { color: "inherit" }, "&.Mui-active": { color: "#2563eb" }, "& .MuiTableSortLabel-icon": { opacity: sortKey === col.key ? 1 : 0.4 } }}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : (
                  col.label
                )}
              </TableCell>
            ))}
            {getRowActions && <TableCell sx={{ width: 48 }} />}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {selectable && <TableCell padding="checkbox" />}
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                ))}
                {getRowActions && <TableCell />}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + (getRowActions ? 1 : 0) + (selectable ? 1 : 0)} sx={{ border: "none" }}>
                {emptyState}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const rowId = getRowId(row);
              return (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => onRowClick?.(row)}
                  selected={selectable && selectedIds.includes(rowId)}
                  sx={{ cursor: onRowClick ? "pointer" : "default", "&:last-child td": { borderBottom: "none" } }}
                >
                  {selectable && (
                    <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                      <Checkbox size="small" checked={selectedIds.includes(rowId)} onChange={() => onToggleRow?.(rowId)} />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key} sx={{ fontSize: "0.82rem", color: "#334155" }}>
                      {col.render ? col.render(row) : row[col.key]}
                    </TableCell>
                  ))}
                  {getRowActions && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActions row={row} getRowActions={getRowActions} />
                    </TableCell>
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
    {!loading && rows.length > 0 && (
      <SupportPagination page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />
    )}
  </Paper>
);

export default SupportTable;

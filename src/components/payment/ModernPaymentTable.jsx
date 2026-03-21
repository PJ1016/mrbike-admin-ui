import React from "react";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from "@mui/x-data-grid";
import { Chip, Button, Box, Typography, Stack } from "@mui/material";
import {
  Visibility,
  CreditCard,
  AccountBalance,
  QrCode,
} from "@mui/icons-material";

const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case "SUCCESS":
      return "success";
    case "PENDING":
      return "warning";
    case "FAILED":
    case "CANCELLED":
      return "error";
    default:
      return "default";
  }
};

const getMethodIcon = (method) => {
  const m = method?.toLowerCase();
  if (m?.includes("upi")) return <QrCode sx={{ mr: 1, fontSize: 18 }} />;
  if (m?.includes("card")) return <CreditCard sx={{ mr: 1, fontSize: 18 }} />;
  return <AccountBalance sx={{ mr: 1, fontSize: 18 }} />;
};

const CustomToolbar = () => (
  <GridToolbarContainer sx={{ p: 2, justifyContent: "space-between" }}>
    <GridToolbarQuickFilter
      placeholder="Search Payments..."
      sx={{
        width: 300,
        "& .MuiInputBase-root": {
          borderRadius: "8px",
          bgcolor: "background.paper",
        },
      }}
    />
    <Box>
      <GridToolbarExport
        sx={{
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
        }}
      />
    </Box>
  </GridToolbarContainer>
);

const ModernPaymentTable = ({ data = [], onRowClick, loading }) => {
  const columns = [
    {
      field: "booking_id",
      headerName: "Booking ID",
      width: 150,
      valueGetter: (params, row) =>
        row.booking_id?._id || row.booking_id || "N/A",
      renderCell: (params) => (
        <Typography
          variant="body2"
          fontWeight={600}
          color="primary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "user_name",
      headerName: "Customer",
      width: 250,
      valueGetter: (params, row) =>
        row.user_id
          ? `${row.user_id.first_name || ""} ${row.user_id.last_name || ""}`.trim()
          : "N/A",
      renderCell: (params) => (
        <Stack
          direction="column"
          spacing={0}
          justifyContent="center"
          height="100%"
        >
          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>
            {params.value}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ lineHeight: 1.2 }}
          >
            {params.api.getRow(params.id).user_id?.email || ""}
          </Typography>
        </Stack>
      ),
    },
    {
      field: "orderAmount",
      headerName: "Amount",
      width: 120,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2" fontWeight={700}>
            ₹{params.value?.toLocaleString("en-IN")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "payment_method",
      headerName: "Method",
      width: 150,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          {getMethodIcon(params.value)}
          <Typography variant="body2">{params.value || "N/A"}</Typography>
        </Box>
      ),
    },
    {
      field: "order_status",
      headerName: "Status",
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Chip
            label={params.value}
            color={getStatusColor(params.value)}
            size="small"
            sx={{
              fontWeight: 700,
              borderRadius: "6px",
              textTransform: "uppercase",
              fontSize: "0.65rem",
            }}
          />
        </Box>
      ),
    },
    {
      field: "transaction_id",
      headerName: "Transaction ID",
      width: 180,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography
            variant="caption"
            sx={{ fontFamily: "monospace", color: "text.secondary" }}
          >
            {params.value || "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: "Date",
      width: 180,
      valueFormatter: (params) =>
        params ? new Date(params).toLocaleString("en-IN") : "N/A",
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography variant="body2">
            {params.value
              ? new Date(params.value).toLocaleString("en-IN")
              : "N/A"}
          </Typography>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Visibility />}
            onClick={(e) => {
              e.stopPropagation();
              onRowClick(params.row);
            }}
            sx={{
              textTransform: "none",
              borderRadius: "6px",
              fontSize: "0.75rem",
            }}
          >
            Details
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box
      sx={{
        height: 650,
        width: "100%",
        "& .MuiDataGrid-root": {
          border: "none",
          bgcolor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        },
        "& .MuiDataGrid-cell": {
          borderBottom: "1px solid",
          borderColor: "divider",
        },
        "& .MuiDataGrid-columnHeaders": {
          bgcolor: "#f8fafc",
          borderBottom: "2px solid",
          borderColor: "divider",
        },
      }}
    >
      <DataGrid
        rows={data}
        columns={columns}
        getRowId={(row) => row._id}
        loading={loading}
        rowHeight={70}
        pageSizeOptions={[10, 25, 50]}
        initialState={{
          pagination: {
            paginationModel: { pageSize: 10, page: 0 },
          },
        }}
        slots={{
          toolbar: CustomToolbar,
        }}
        disableRowSelectionOnClick
        onRowClick={(params) => onRowClick(params.row)}
      />
    </Box>
  );
};

export default ModernPaymentTable;

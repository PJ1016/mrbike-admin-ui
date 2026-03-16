import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  TablePagination,
  TextField,
  InputAdornment,
  TableSortLabel,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  VerifiedUser as VerifiedIcon,
  FiberManualRecord as DotIcon,
  Business as BusinessIcon,
  AccountBalance as BankIcon,
  LocationOn as LocationIcon,
  CloudDone as SuccessDocIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { approveDealer, deleteDealer, verifyDealerDocument } from "../../api";

const API_BASE_URL = "https://api.mrbikedoctor.cloud";

const DealerVerficationTable = ({ datas, loading, onRefresh }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [docVerification, setDocVerification] = useState({});

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredData = useMemo(() => {
    let result = datas || [];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.shopName?.toLowerCase().includes(term) ||
          item.ownerName?.toLowerCase().includes(term) ||
          item.email?.toLowerCase().includes(term) ||
          item.personalEmail?.toLowerCase().includes(term) ||
          item.shopEmail?.toLowerCase().includes(term) ||
          item.phone?.toLowerCase().includes(term) ||
          item.shopContact?.toLowerCase().includes(term) ||
          item._id?.toLowerCase().includes(term),
      );
    }

    return [...result].sort((a, b) => {
      let valueA = a[orderBy] || "";
      let valueB = b[orderBy] || "";

      if (orderBy === "createdAt" || orderBy === "updatedAt") {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }

      if (order === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueB < valueA ? -1 : valueB > valueA ? 1 : 0;
      }
    });
  }, [datas, searchTerm, order, orderBy]);

  const currentData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusConfig = (status, type) => {
    if (type === "verification") {
      return status
        ? {
            label: "Verified",
            color: "success",
            icon: <VerifiedIcon fontSize="small" />,
          }
        : {
            label: "Unverified",
            color: "warning",
            icon: <PendingIcon fontSize="small" />,
          };
    }
    if (type === "registration") {
      const s = status?.toLowerCase() || "";
      if (s === "pending")
        return { color: "warning", icon: <DotIcon fontSize="small" /> };
      if (s === "approved")
        return { color: "success", icon: <CheckCircleIcon fontSize="small" /> };
      return { color: "default", icon: <InfoIcon fontSize="small" /> };
    }
    return { color: "default" };
  };

  const headers = [
    { id: "id", label: "#", sortable: false },
    { id: "shopName", label: "Shop Details", sortable: true },
    { id: "ownerName", label: "Owner Info", sortable: true },
    { id: "docs", label: "Documents Status", sortable: false },
    { id: "createdAt", label: "Requested On", sortable: true },
    { id: "actions", label: "Action", sortable: false },
  ];

  const handleActionClick = (event, dealer) => {
    setAnchorEl(event.currentTarget);
    setSelectedDealer(dealer);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
  };

  const handleOpenReview = () => {
    setReviewDialogOpen(true);
    setDocVerification(selectedDealer?.documentVerification || {});
    handleActionClose();
  };

  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}/${path}`;
  };

  const handleDocVerify = async (docType, status) => {
    if (!selectedDealer) return;
    try {
      await verifyDealerDocument(selectedDealer._id, docType, status);
      setDocVerification((prev) => ({ ...prev, [docType]: status }));
    } catch (error) {
      setActionError(
        error?.response?.data?.message || "Failed to update document status.",
      );
    }
  };

  const allDocsVerified = (dv) =>
    ["aadharFront", "aadharBack", "pan", "shop", "face", "passbook"].every(
      (k) => dv[k] === "verified",
    );

  const executeConfirmedAction = async () => {
    if (!selectedDealer || !confirmAction) return;
    setActionLoading(true);
    setActionError(null);
    try {
      if (confirmAction === "approve") {
        await approveDealer(selectedDealer._id);
        setConfirmAction(null);
        setReviewDialogOpen(false);
        navigate("/dealers");
      } else if (confirmAction === "reject") {
        await deleteDealer(selectedDealer._id);
        setConfirmAction(null);
        setReviewDialogOpen(false);
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Action failed:", error);
      const msg =
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      setActionError(msg);
      setConfirmAction(null);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 2 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search by Shop, Owner, or Phone..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          sx={{ width: { xs: "100%", sm: 350 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer
        component={Paper}
        elevation={3}
        sx={{
          borderRadius: 2,
          overflowX: "auto",
        }}
      >
        <Table id="dealer-verify-table" sx={{ minWidth: 1200 }}>
          <TableHead sx={{ backgroundColor: "#2e83ff" }}>
            <TableRow>
              {headers.map((header) => (
                <TableCell
                  key={header.id}
                  sx={{
                    color: "white",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                  }}
                >
                  {header.sortable ? (
                    <TableSortLabel
                      active={orderBy === header.id}
                      direction={orderBy === header.id ? order : "asc"}
                      onClick={() => handleRequestSort(header.id)}
                      sx={{
                        color: "white !important",
                        "&.MuiTableSortLabel-active": {
                          color: "white !important",
                        },
                        "& .MuiTableSortLabel-icon": {
                          color: "white !important",
                        },
                      }}
                    >
                      {header.label}
                    </TableSortLabel>
                  ) : (
                    header.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    Loading Dealers...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 10 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontStyle: "italic", color: "text.secondary" }}
                  >
                    No dealer verification requests found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              currentData.map((dealer, index) => {
                const isDocsComplete = dealer.isDoc;
                const verifyStatus = getStatusConfig(
                  dealer.isVerify,
                  "verification",
                );
                const regStatus = getStatusConfig(
                  dealer.registrationStatus,
                  "registration",
                );

                return (
                  <TableRow key={dealer._id} hover>
                    <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {dealer.shopName || "N/A"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontStyle: "italic" }}
                        >
                          {dealer.fullAddress ||
                            dealer.permanentAddress?.address ||
                            dealer.presentAddress?.address ||
                            "No Address"}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                        >
                          {dealer.city ||
                            dealer.permanentAddress?.city ||
                            dealer.presentAddress?.city ||
                            "N/A"}
                          ,{" "}
                          {dealer.state ||
                            dealer.permanentAddress?.state ||
                            dealer.presentAddress?.state ||
                            "N/A"}
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Typography
                            variant="caption"
                            display="block"
                            color="primary"
                            sx={{ fontWeight: "bold" }}
                          >
                            {dealer.shopContact || "No Contact"}
                          </Typography>
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            {dealer.shopEmail || "No Email"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {dealer.ownerName || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {dealer.personalEmail || dealer.email || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="primary" display="block" sx={{ fontWeight: "bold" }}>
                          {dealer.alternatePhone || dealer.phone || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 0.5,
                        }}
                      >
                        {[
                          {
                            key: "aadharFront",
                            label: "Aadhar Front",
                          },
                          {
                            key: "aadharBack",
                            label: "Aadhar Back",
                          },
                          {
                            key: "pan",
                            label: "PAN",
                          },
                          {
                            key: "shop",
                            label: "Shop",
                          },
                          {
                            key: "face",
                            label: "Face",
                          },
                          {
                            key: "passbook",
                            label: "Passbook",
                          },
                        ].map((doc) => {
                          const status =
                            dealer.documentVerification?.[doc.key] || "none";
                          return (
                            <Box
                              key={doc.label}
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              {status === "verified" ? (
                                <CheckCircleIcon
                                  sx={{
                                    fontSize: 13,
                                    color: "#22c55e",
                                    flexShrink: 0,
                                  }}
                                />
                              ) : status === "rejected" ? (
                                <CancelIcon
                                  sx={{
                                    fontSize: 13,
                                    color: "#ef4444",
                                    flexShrink: 0,
                                  }}
                                />
                              ) : status === "pending" ? (
                                <PendingIcon
                                  sx={{
                                    fontSize: 13,
                                    color: "#f59e0b",
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <DotIcon
                                  sx={{
                                    fontSize: 13,
                                    color: "#94a3b8",
                                    flexShrink: 0,
                                  }}
                                />
                              )}
                              <Typography
                                variant="caption"
                                sx={{
                                  color:
                                    status === "verified"
                                      ? "#15803d"
                                      : status === "rejected"
                                        ? "#b91c1c"
                                        : status === "pending"
                                          ? "#92400e"
                                          : "#64748b",
                                  fontWeight: 600,
                                  lineHeight: 1,
                                }}
                              >
                                {doc.label}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Box>
                      {Object.entries(dealer.documentVerification || {})
                        .filter(([_, v]) => v === "rejected")
                        .length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#ef4444",
                              fontWeight: "bold",
                              display: "block",
                              fontSize: "0.65rem",
                              textTransform: "uppercase",
                            }}
                          >
                            Rejected:{" "}
                            {Object.entries(dealer.documentVerification)
                              .filter(([_, v]) => v === "rejected")
                              .map(([k, _]) => {
                                const labels = {
                                  aadharFront: "Aadhar Front",
                                  aadharBack: "Aadhar Back",
                                  pan: "PAN",
                                  shop: "Shop Cert",
                                  face: "Face/ID",
                                  passbook: "Passbook",
                                };
                                return labels[k] || k;
                              })
                              .join(", ")}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {new Date(dealer.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleActionClick(e, dealer)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleOpenReview}>
          <VisibilityIcon
            fontSize="small"
            sx={{ mr: 1, color: "primary.main" }}
          />{" "}
          Review Profile
        </MenuItem>
      </Menu>

      {/* Dealer Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => {
          if (!actionLoading) {
            setReviewDialogOpen(false);
            setActionError(null);
          }
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "#f8faff",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar sx={{ bgcolor: "primary.main" }}>
              {selectedDealer?.shopName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6">{selectedDealer?.shopName}</Typography>
              <Typography variant="caption" color="text.secondary">
                Dealer ID: {selectedDealer?._id}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={selectedDealer?.registrationStatus || "Pending"}
            color={
              getStatusConfig(
                selectedDealer?.registrationStatus,
                "registration",
              ).color
            }
            size="small"
          />
        </DialogTitle>

        {/* Inline error alert */}
        {actionError && (
          <Alert
            severity="error"
            onClose={() => setActionError(null)}
            sx={{ mx: 3, mt: 2, borderRadius: 2 }}
          >
            {actionError}
          </Alert>
        )}
        <DialogContent dividers sx={{ p: 4 }}>
          {selectedDealer && (
            <Grid container spacing={4}>
              {/* LEFT COLUMN */}
              <Grid item xs={12} md={6}>
                {/* Business Profile */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <BusinessIcon color="primary" fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      BUSINESS PROFILE
                    </Typography>
                  </Box>
                  {[
                    { label: "Shop Name", value: selectedDealer.shopName },
                    { label: "Owner Name", value: selectedDealer.ownerName },
                    { label: "Gender", value: selectedDealer.gender },
                    { label: "Phone", value: selectedDealer.phone },
                    { label: "Shop Phone", value: selectedDealer.shopContact },
                    {
                      label: "Personal Email",
                      value:
                        selectedDealer.personalEmail || selectedDealer.email,
                    },
                    { label: "Shop Email", value: selectedDealer.shopEmail },
                    {
                      label: "Alt. Phone",
                      value: selectedDealer.alternatePhone,
                    },
                    {
                      label: "Commission",
                      value:
                        selectedDealer.commission != null
                          ? `${selectedDealer.commission}%`
                          : null,
                    },
                    {
                      label: "Tax",
                      value:
                        selectedDealer.tax != null
                          ? `${selectedDealer.tax}%`
                          : null,
                    },
                    { label: "Holiday", value: selectedDealer.holiday },
                    {
                      label: "Shop Pincode",
                      value: selectedDealer.shopPincode,
                    },
                    {
                      label: "Opening Date",
                      value: selectedDealer.shopOpeningDate
                        ? new Date(
                            selectedDealer.shopOpeningDate,
                          ).toLocaleDateString("en-GB")
                        : null,
                    },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: "flex", mb: 0.75 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          minWidth: 110,
                          color: "text.secondary",
                        }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography variant="caption">
                        {item.value || "N/A"}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Address */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <LocationIcon color="primary" fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      ADDRESS & LOCATION
                    </Typography>
                  </Box>
                  {[
                    {
                      label: "Full Address",
                      value:
                        selectedDealer.fullAddress ||
                        selectedDealer.permanentAddress?.address ||
                        selectedDealer.presentAddress?.address,
                    },
                    {
                      label: "City / State",
                      value: `${selectedDealer.city || selectedDealer.permanentAddress?.city || selectedDealer.presentAddress?.city || "N/A"}, ${selectedDealer.state || selectedDealer.permanentAddress?.state || selectedDealer.presentAddress?.state || "N/A"}`,
                    },
                    {
                      label: "Present Addr.",
                      value: selectedDealer.presentAddress?.address,
                    },
                    {
                      label: "GPS",
                      value: selectedDealer.latitude
                        ? `${selectedDealer.latitude}, ${selectedDealer.longitude}`
                        : null,
                    },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: "flex", mb: 0.75 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          minWidth: 110,
                          color: "text.secondary",
                        }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ wordBreak: "break-word" }}
                      >
                        {item.value || "N/A"}
                      </Typography>
                    </Box>
                  ))}
                  {selectedDealer.latitude && (
                    <Button
                      variant="text"
                      size="small"
                      startIcon={<LocationIcon />}
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedDealer.latitude},${selectedDealer.longitude}`}
                      target="_blank"
                      sx={{ textTransform: "none", mt: 0.5 }}
                    >
                      View on Google Maps
                    </Button>
                  )}
                </Box>

                {/* Banking */}
                <Box sx={{ mb: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <BankIcon color="primary" fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      BANKING DETAILS
                    </Typography>
                  </Box>
                  {[
                    {
                      label: "Account Holder",
                      value: selectedDealer.bankDetails?.accountHolderName,
                    },
                    {
                      label: "Bank Name",
                      value: selectedDealer.bankDetails?.bankName,
                    },
                    {
                      label: "Account No.",
                      value: selectedDealer.bankDetails?.accountNumber,
                    },
                    {
                      label: "IFSC Code",
                      value: selectedDealer.bankDetails?.ifscCode,
                    },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: "flex", mb: 0.75 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          minWidth: 110,
                          color: "text.secondary",
                        }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography variant="caption">
                        {item.value || "N/A"}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* ID Numbers */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1.5,
                    }}
                  >
                    <VisibilityIcon color="primary" fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      IDENTITY NUMBERS
                    </Typography>
                  </Box>
                  {[
                    { label: "Aadhar No.", value: selectedDealer.aadharCardNo },
                    { label: "PAN No.", value: selectedDealer.panCardNo },
                  ].map((item) => (
                    <Box key={item.label} sx={{ display: "flex", mb: 0.75 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: "bold",
                          minWidth: 110,
                          color: "text.secondary",
                        }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ fontFamily: "monospace", letterSpacing: 1 }}
                      >
                        {item.value || "N/A"}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* RIGHT COLUMN: Documents */}
              <Grid item xs={12} md={6}>
                {/* Header + progress summary */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <VisibilityIcon color="primary" fontSize="small" />
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: "bold", color: "primary.main" }}
                    >
                      DOCUMENT REVIEW
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={`${["aadharFront", "aadharBack", "pan", "shop", "face", "passbook"].filter((k) => docVerification[k] === "verified").length} / 6 Approved`}
                    color={
                      allDocsVerified(docVerification) ? "success" : "warning"
                    }
                    icon={
                      allDocsVerified(docVerification) ? (
                        <CheckCircleIcon fontSize="small" />
                      ) : (
                        <PendingIcon fontSize="small" />
                      )
                    }
                    sx={{ fontWeight: 800, fontSize: "0.7rem" }}
                  />
                </Box>

                {/* Instruction banner */}
                {Object.values(docVerification).some(
                  (v) => v === "rejected",
                ) ? (
                  <Alert
                    severity="error"
                    sx={{ mb: 2, py: 0.5, fontSize: "0.75rem" }}
                  >
                    <strong>Needs Attention:</strong> One or more documents have
                    been rejected. The dealer will need to re-upload these
                    before the profile can be fully approved.
                  </Alert>
                ) : !allDocsVerified(docVerification) ? (
                  <Alert
                    severity="info"
                    sx={{ mb: 2, py: 0.5, fontSize: "0.75rem" }}
                  >
                    Review each document below. Click the image to enlarge.
                    Approve or Reject each one before you can approve the
                    dealer.
                  </Alert>
                ) : (
                  <Alert
                    severity="success"
                    sx={{ mb: 2, py: 0.5, fontSize: "0.75rem" }}
                  >
                    All documents verified! You can now approve this dealer.
                  </Alert>
                )}

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {[
                    {
                      label: "Aadhar Card (Front)",
                      path: selectedDealer.documents?.aadharFront,
                      docKey: "aadharFront",
                    },
                    {
                      label: "Aadhar Card (Back)",
                      path: selectedDealer.documents?.aadharBack,
                      docKey: "aadharBack",
                    },
                    {
                      label: "PAN Card",
                      path: selectedDealer.documents?.panCardFront,
                      docKey: "pan",
                    },
                    {
                      label: "Shop Certificate",
                      path: selectedDealer.documents?.shopCertificate,
                      docKey: "shop",
                    },
                    {
                      label: "Face / Selfie",
                      path: selectedDealer.documents?.faceVerificationImage,
                      docKey: "face",
                    },
                    {
                      label: "Passbook / Cheque",
                      path: selectedDealer.bankDetails?.passbookImage,
                      docKey: "passbook",
                    },
                    {
                      label: "Shop Photo",
                      path: selectedDealer.shopImages?.[0],
                      docKey: null,
                    },
                  ].map((doc) => {
                    const status = doc.docKey
                      ? docVerification[doc.docKey]
                      : null;
                    const borderColor =
                      status === "verified"
                        ? "#22c55e"
                        : status === "rejected"
                          ? "#ef4444"
                          : status === "pending"
                            ? "#f59e0b"
                            : "#e2e8f0";
                    const bgColor =
                      status === "verified"
                        ? "#f0fdf4"
                        : status === "rejected"
                          ? "#fef2f2"
                          : status === "pending"
                            ? "#fffbeb"
                            : "#fcfcfc";
                    return (
                      <Paper
                        key={doc.label}
                        elevation={0}
                        sx={{
                          border: "1.5px solid",
                          borderColor,
                          borderRadius: 2,
                          overflow: "hidden",
                          bgcolor: bgColor,
                          transition: "border-color 0.2s, background 0.2s",
                        }}
                      >
                        {/* Doc header row */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            px: 1.5,
                            py: 1,
                            borderBottom: "1px solid",
                            borderColor: "divider",
                            bgcolor: "rgba(0,0,0,0.02)",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {doc.docKey && status === "verified" && (
                              <CheckCircleIcon
                                sx={{ fontSize: 15, color: "#22c55e" }}
                              />
                            )}
                            {doc.docKey && status === "rejected" && (
                              <CancelIcon
                                sx={{ fontSize: 15, color: "#ef4444" }}
                              />
                            )}
                            {doc.docKey &&
                              (status === "pending" || status === "none") && (
                                <PendingIcon
                                  sx={{ fontSize: 15, color: "#f59e0b" }}
                                />
                              )}
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700 }}
                            >
                              {doc.label}
                            </Typography>
                          </Box>
                          {doc.docKey && (
                            <Chip
                              size="small"
                              label={
                                status === "verified"
                                  ? "Approved"
                                  : status === "rejected"
                                    ? "Rejected"
                                    : "Pending Review"
                              }
                              color={
                                status === "verified"
                                  ? "success"
                                  : status === "rejected"
                                    ? "error"
                                    : "warning"
                              }
                              variant={
                                status === "verified" || status === "rejected"
                                  ? "filled"
                                  : "outlined"
                              }
                              sx={{
                                fontSize: "0.6rem",
                                fontWeight: 800,
                                height: 20,
                              }}
                            />
                          )}
                        </Box>

                        {/* Image */}
                        {doc.path ? (
                          <Box
                            component="img"
                            src={getImageUrl(doc.path)}
                            alt={doc.label}
                            onClick={() =>
                              window.open(getImageUrl(doc.path), "_blank")
                            }
                            sx={{
                              width: "100%",
                              height: 120,
                              objectFit: "contain",
                              cursor: "pointer",
                              display: "block",
                              "&:hover": { opacity: 0.85 },
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              height: 60,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Not uploaded
                            </Typography>
                          </Box>
                        )}

                        {/* Approve / Reject buttons */}
                        {doc.docKey && doc.path && (
                          <Box
                            sx={{
                              display: "flex",
                              borderTop: "1px solid",
                              borderColor: "divider",
                            }}
                          >
                            <Button
                              fullWidth
                              size="small"
                              variant={
                                status === "verified" ? "contained" : "text"
                              }
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() =>
                                handleDocVerify(doc.docKey, "verified")
                              }
                              sx={{
                                borderRadius: 0,
                                py: 0.75,
                                fontWeight: 800,
                                fontSize: "0.72rem",
                              }}
                            >
                              Approve
                            </Button>
                            <Divider orientation="vertical" flexItem />
                            <Button
                              fullWidth
                              size="small"
                              variant={
                                status === "rejected" ? "contained" : "text"
                              }
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() =>
                                handleDocVerify(doc.docKey, "rejected")
                              }
                              sx={{
                                borderRadius: 0,
                                py: 0.75,
                                fontWeight: 800,
                                fontSize: "0.72rem",
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                      </Paper>
                    );
                  })}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 0,
            flexDirection: "column",
            alignItems: "stretch",
            bgcolor: "#f8faff",
          }}
        >
          {/* Inline confirmation strip — shown when an action is pending */}
          {confirmAction && (
            <Box
              sx={{
                px: 3,
                py: 2,
                bgcolor: confirmAction === "approve" ? "#e8f5e9" : "#fdecea",
                borderTop: "1px solid",
                borderColor:
                  confirmAction === "approve" ? "#a5d6a7" : "#ef9a9a",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: confirmAction === "approve" ? "#2e7d32" : "#c62828",
                }}
              >
                {confirmAction === "approve"
                  ? `Confirm approval of "${selectedDealer?.shopName}"?`
                  : `Permanently delete "${selectedDealer?.shopName}"? This cannot be undone.`}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="inherit"
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color={confirmAction === "approve" ? "success" : "error"}
                  onClick={executeConfirmedAction}
                  disabled={actionLoading}
                  startIcon={
                    actionLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : null
                  }
                >
                  {confirmAction === "approve" ? "Yes, Approve" : "Yes, Delete"}
                </Button>
              </Box>
            </Box>
          )}

          {/* Main action buttons */}
          <Box
            sx={{
              display: "flex",
              p: 2,
              gap: 1,
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Left: pending checklist hint */}
            {!allDocsVerified(docVerification) && (
              <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                {[
                  { key: "aadharFront", label: "Aadhar Front" },
                  { key: "aadharBack", label: "Aadhar Back" },
                  { key: "pan", label: "PAN" },
                  { key: "shop", label: "Shop Cert" },
                  { key: "face", label: "Face/ID" },
                ].map(({ key, label }) => (
                  <Chip
                    key={key}
                    size="small"
                    label={label}
                    icon={
                      docVerification[key] === "verified" ? (
                        <CheckCircleIcon fontSize="small" />
                      ) : docVerification[key] === "rejected" ? (
                        <CancelIcon fontSize="small" />
                      ) : (
                        <PendingIcon fontSize="small" />
                      )
                    }
                    color={
                      docVerification[key] === "verified"
                        ? "success"
                        : docVerification[key] === "rejected"
                          ? "error"
                          : "default"
                    }
                    variant={
                      docVerification[key] === "verified" ||
                      docVerification[key] === "rejected"
                        ? "filled"
                        : "outlined"
                    }
                    sx={{ fontSize: "0.65rem", fontWeight: 700 }}
                  />
                ))}
              </Box>
            )}
            {allDocsVerified(docVerification) && (
              <Typography
                variant="caption"
                sx={{ color: "success.main", fontWeight: 700 }}
              >
                ✓ All documents reviewed — ready to approve
              </Typography>
            )}

            {/* Right: action buttons */}
            <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
              <Button
                onClick={() => {
                  setReviewDialogOpen(false);
                  setConfirmAction(null);
                }}
                variant="outlined"
                color="inherit"
                disabled={actionLoading}
              >
                Close
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setConfirmAction("reject")}
                disabled={actionLoading || confirmAction === "reject"}
              >
                Reject Application
              </Button>
              <Tooltip
                title={
                  !allDocsVerified(docVerification)
                    ? "Review and approve all documents first"
                    : ""
                }
              >
                <span>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => setConfirmAction("approve")}
                    // disabled={actionLoading || selectedDealer?.isVerify || confirmAction === "approve" || !allDocsVerified(docVerification)}
                  >
                    {selectedDealer?.isVerify
                      ? "Already Verified"
                      : "Approve Dealer"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DealerVerficationTable;

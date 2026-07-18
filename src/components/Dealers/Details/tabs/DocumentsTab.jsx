import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import VerifiedIcon from "@mui/icons-material/Verified";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import PendingIcon from "@mui/icons-material/Pending";
import { ImagePreview, SectionHeader, InfoField } from "../DealerShared";
import { verifyDealerDocument } from "../../../../api";

const StatusChip = ({ uploaded }) => (
  <Chip
    label={uploaded ? "Uploaded" : "Pending"}
    color={uploaded ? "success" : "warning"}
    size="small"
    sx={{ fontWeight: 700, fontSize: "0.7rem" }}
  />
);

const VERIFICATION_STATUS_MAP = {
  verified: { label: "Verified", color: "success" },
  pending: { label: "Pending Review", color: "warning" },
  rejected: { label: "Rejected", color: "error" },
  none: { label: "Not Reviewed", color: "default" },
};

const VerificationChip = ({ status }) => {
  const { label, color } = VERIFICATION_STATUS_MAP[status] || VERIFICATION_STATUS_MAP.none;
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant={status === "verified" || status === "rejected" || status === "pending" ? "filled" : "outlined"}
      sx={{ fontWeight: 700, fontSize: "0.7rem" }}
    />
  );
};

const DOC_KEYS = ["aadharFront", "aadharBack", "pan", "shop", "face", "passbook"];

const allDocsVerified = (dv) => DOC_KEYS.every((k) => dv[k] === "verified");

// Reuses the same verify/reject action pattern as DealerVerficationTable's document review panel.
const DocumentVerificationCard = ({ label, src, status, pendingStatus, disabled, onVerify }) => {
  const borderColor =
    status === "verified" ? "success.main" : status === "rejected" ? "error.main" : "divider";

  return (
    <Card
      elevation={0}
      sx={{ border: "1.5px solid", borderColor, borderRadius: 3, overflow: "hidden" }}
    >
      <CardContent sx={{ p: 2 }}>
        <ImagePreview src={src} label={label} showDownload />
        <Box sx={{ mt: 1.5 }}>
          <VerificationChip status={status} />
        </Box>
      </CardContent>

      {src && (
        <Box sx={{ display: "flex", borderTop: "1px solid", borderColor: "divider" }}>
          <Button
            fullWidth
            size="small"
            variant={status === "verified" ? "contained" : "text"}
            color="success"
            disabled={disabled}
            startIcon={
              pendingStatus === "verified" ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CheckCircleIcon fontSize="small" />
              )
            }
            onClick={() => onVerify("verified")}
            sx={{ borderRadius: 0, py: 1, fontWeight: 800, fontSize: "0.72rem" }}
          >
            Verify
          </Button>
          <Divider orientation="vertical" flexItem />
          <Button
            fullWidth
            size="small"
            variant={status === "rejected" ? "contained" : "text"}
            color="error"
            disabled={disabled}
            startIcon={
              pendingStatus === "rejected" ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <CancelIcon fontSize="small" />
              )
            }
            onClick={() => onVerify("rejected")}
            sx={{ borderRadius: 0, py: 1, fontWeight: 800, fontSize: "0.72rem" }}
          >
            Reject
          </Button>
        </Box>
      )}
    </Card>
  );
};

const DocumentsTab = ({ dealer }) => {
  const docs = dealer.documents || {};
  const bank = dealer.bankDetails || {};

  const [docVerification, setDocVerification] = useState(dealer.documentVerification || {});
  const [pendingDoc, setPendingDoc] = useState(null); // { key, status } | null
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    setDocVerification(dealer.documentVerification || {});
  }, [dealer.documentVerification]);

  const handleDocVerify = async (docKey, status) => {
    setActionError(null);
    setPendingDoc({ key: docKey, status });
    try {
      await verifyDealerDocument(dealer._id, docKey, status);
      setDocVerification((prev) => ({ ...prev, [docKey]: status }));
    } catch (error) {
      setActionError(
        error?.response?.data?.message || "Failed to update document status. Please try again."
      );
    } finally {
      setPendingDoc(null);
    }
  };

  const docStatus = [
    { name: "Aadhar Card (Front)", uploaded: !!docs.aadharFront, verifyKey: "aadharFront", src: docs.aadharFront },
    { name: "Aadhar Card (Back)", uploaded: !!docs.aadharBack, verifyKey: "aadharBack", src: docs.aadharBack },
    { name: "PAN Card", uploaded: !!docs.panCardFront, verifyKey: "pan", src: docs.panCardFront },
    { name: "Shop Certificate", uploaded: !!docs.shopCertificate, verifyKey: "shop", src: docs.shopCertificate },
    { name: "Face Verification", uploaded: !!docs.faceVerificationImage, verifyKey: "face", src: docs.faceVerificationImage },
    { name: "Passbook / Cheque", uploaded: !!bank.passbookImage, verifyKey: "passbook", src: bank.passbookImage },
  ];

  const verifiedCount = DOC_KEYS.filter((k) => docVerification[k] === "verified").length;
  const hasRejected = Object.values(docVerification).some((v) => v === "rejected");

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Grid container spacing={3}>

        {/* Rejection Reason (if backend has recorded one for the application) */}
        {dealer.rejectionReason && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <strong>Rejection Reason:</strong> {dealer.rejectionReason}
            </Alert>
          </Grid>
        )}

        {/* KYC Numbers */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, bgcolor: "#fafbff" }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<FingerprintIcon />} title="Identity Numbers" />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <InfoField label="Aadhar Card No." value={dealer.aadharCardNo} mono />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <InfoField label="PAN Card No." value={dealer.panCardNo?.toUpperCase()} mono />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="700"
                      sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      Identity Status
                    </Typography>
                    <Chip
                      label={dealer.isVerify ? "KYC Verified" : "KYC Pending"}
                      color={dealer.isVerify ? "success" : "warning"}
                      icon={<VerifiedIcon />}
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Document Review */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <SectionHeader icon={<ArticleIcon />} title="KYC Documents" />
                <Chip
                  size="small"
                  label={`${verifiedCount} / ${DOC_KEYS.length} Verified`}
                  color={allDocsVerified(docVerification) ? "success" : "warning"}
                  icon={allDocsVerified(docVerification) ? <CheckCircleIcon fontSize="small" /> : <PendingIcon fontSize="small" />}
                  sx={{ fontWeight: 800, fontSize: "0.7rem" }}
                />
              </Box>

              {actionError && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
                  {actionError}
                </Alert>
              )}

              {hasRejected ? (
                <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: "0.75rem" }}>
                  <strong>Needs Attention:</strong> One or more documents have been rejected. The
                  dealer will need to re-upload these.
                </Alert>
              ) : !allDocsVerified(docVerification) ? (
                <Alert severity="info" sx={{ mb: 2, py: 0.5, fontSize: "0.75rem" }}>
                  Review each document below. Click the image to enlarge, then Verify or Reject.
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2, py: 0.5, fontSize: "0.75rem" }}>
                  All documents verified.
                </Alert>
              )}

              <Grid container spacing={3}>
                {docStatus.map((row) => (
                  <Grid item xs={12} sm={6} md={4} key={row.verifyKey}>
                    <DocumentVerificationCard
                      label={row.name}
                      src={row.src}
                      status={docVerification[row.verifyKey] || "none"}
                      pendingStatus={pendingDoc?.key === row.verifyKey ? pendingDoc.status : null}
                      disabled={!!pendingDoc}
                      onVerify={(status) => handleDocVerify(row.verifyKey, status)}
                    />
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Verification Status Table */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<VerifiedIcon />} title="Verification Status" />
              <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "grey.50" }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        Document
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                        Verification
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {docStatus.map((row) => (
                      <TableRow key={row.name} hover>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                          {row.name}
                        </TableCell>
                        <TableCell>
                          <StatusChip uploaded={row.uploaded} />
                        </TableCell>
                        <TableCell>
                          <VerificationChip status={docVerification[row.verifyKey] || "none"} />
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        Shop Profile
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={dealer.isProfile ? "Completed" : "Incomplete"}
                          color={dealer.isProfile ? "success" : "warning"}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                    <TableRow hover>
                      <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        Identity Verification
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={dealer.isVerify ? "Verified" : "Unverified"}
                          color={dealer.isVerify ? "success" : "error"}
                          size="small"
                          sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentsTab;

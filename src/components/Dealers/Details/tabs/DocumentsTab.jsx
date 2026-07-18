import React from "react";
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
  Stack,
} from "@mui/material";
import ArticleIcon from "@mui/icons-material/Article";
import VerifiedIcon from "@mui/icons-material/Verified";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import { ImagePreview, SectionHeader, InfoField } from "../DealerShared";

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

const DocumentsTab = ({ dealer }) => {
  const docs = dealer.documents || {};
  const bank = dealer.bankDetails || {};

  const docVerification = dealer.documentVerification || {};

  const docStatus = [
    { name: "Aadhar Card (Front)", uploaded: !!docs.aadharFront, verifyKey: "aadharFront" },
    { name: "Aadhar Card (Back)", uploaded: !!docs.aadharBack, verifyKey: "aadharBack" },
    { name: "PAN Card", uploaded: !!docs.panCardFront, verifyKey: "pan" },
    { name: "Shop Certificate", uploaded: !!docs.shopCertificate, verifyKey: "shop" },
    { name: "Face Verification", uploaded: !!docs.faceVerificationImage, verifyKey: "face" },
    { name: "Passbook / Cheque", uploaded: !!bank.passbookImage, verifyKey: "passbook" },
  ];

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Grid container spacing={3}>

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

        {/* Document Images */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<ArticleIcon />} title="KYC Documents" />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <ImagePreview
                    src={docs.aadharFront}
                    label="Aadhar Front"
                    showDownload
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <ImagePreview
                    src={docs.aadharBack}
                    label="Aadhar Back"
                    showDownload
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <ImagePreview
                    src={docs.panCardFront}
                    label="PAN Card"
                    showDownload
                  />
                </Grid>

                {docs.shopCertificate && (
                  <Grid item xs={12} sm={6} md={4}>
                    <ImagePreview
                      src={docs.shopCertificate}
                      label="Shop Certificate"
                      showDownload
                    />
                  </Grid>
                )}

                {docs.faceVerificationImage && (
                  <Grid item xs={12} sm={6} md={4}>
                    <ImagePreview
                      src={docs.faceVerificationImage}
                      label="Face Verification"
                      showDownload
                    />
                  </Grid>
                )}

                <Grid item xs={12} sm={6} md={4}>
                  <ImagePreview
                    src={bank.passbookImage}
                    label="Passbook / Cancelled Cheque"
                    showDownload
                  />
                </Grid>
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

import React from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  Typography,
  Divider,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { InfoField, ImagePreview, SectionHeader } from "../DealerShared";

const BankingTab = ({ dealer }) => {
  const bank = dealer.bankDetails || {};

  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Grid container spacing={3}>

        {/* Bank Account Details */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<AccountBalanceIcon />} title="Settlement Account" />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InfoField
                    label="Account Holder Name"
                    value={bank.accountHolderName || "Unspecified"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoField
                    label="Bank Name"
                    value={bank.bankName || "Unspecified"}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoField
                    label="Account Number"
                    value={bank.accountNumber || "Unspecified"}
                    mono
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      fontWeight="700"
                      sx={{ display: "block", mb: 0.5, textTransform: "uppercase", letterSpacing: 0.5 }}
                    >
                      IFSC Code
                    </Typography>
                    {bank.ifscCode ? (
                      <Chip
                        label={bank.ifscCode}
                        sx={{ fontWeight: 800, bgcolor: "grey.100", fontFamily: "monospace", px: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" fontWeight="600" color="text.secondary">
                        N/A
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoField
                    label="UPI ID"
                    value={bank.upiId || "Not provided"}
                    mono
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <ImagePreview
                src={bank.passbookImage}
                label="Passbook / Cancelled Cheque"
                showDownload
              />

              <Alert
                severity="info"
                variant="outlined"
                icon={<AccountBalanceIcon />}
                sx={{ mt: 3, borderRadius: 2, borderStyle: "dashed" }}
              >
                <Typography variant="caption" fontWeight="700" sx={{ display: "block" }}>
                  Audit Note
                </Typography>
                <Typography variant="caption">
                  Ensure the account holder name matches the identity documents in the Documents tab.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Wallet Settings */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<AccountBalanceWalletIcon />} title="Wallet Settings" />
              <Box
                sx={{
                  p: 2.5,
                  bgcolor: "primary.50",
                  border: "1px solid",
                  borderColor: "primary.100",
                  borderRadius: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight="700" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1 }}>
                  Minimum Wallet Amount
                </Typography>
                <Typography variant="h4" fontWeight="800" color={dealer.minWalletAmount ? "primary.main" : "text.disabled"}>
                  ₹{dealer.minWalletAmount ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                  Minimum balance required in dealer wallet
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BankingTab;

import React, { forwardRef } from "react";
import { Box, Typography, Divider, Table, TableHead, TableBody, TableRow, TableCell } from "@mui/material";
import { formatCurrency, formatDateTime, formatGST } from "./invoiceFormatters";

const SectionTitle = ({ children }) => (
  <Typography
    sx={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.6, color: "#8a8a8a", mb: 0.75 }}
  >
    {children}
  </Typography>
);

const Row = ({ label, value, bold }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.4 }}>
    <Typography sx={{ fontSize: 13, color: "#555", fontWeight: bold ? 800 : 400 }}>{label}</Typography>
    <Typography sx={{ fontSize: 13, color: bold ? "#000" : "#1a1a1a", fontWeight: bold ? 800 : 600 }}>{value}</Typography>
  </Box>
);

const SectionDivider = () => <Divider sx={{ my: 1.75, borderStyle: "dashed" }} />;

// Same field order as buildInvoiceHtml.ts / InvoiceDocument.tsx in the User
// & Dealer apps — the one template rendered identically across all three
// surfaces. forwardRef so InvoiceModal can capture this exact node for the
// PDF export (guaranteeing the PDF can never drift from this preview).
const InvoiceDocument = forwardRef(({ invoice }, ref) => {
  const { dealer, customer, bike, services, charges, tax, settlement } = invoice;
  const isCancelled = invoice.paymentStatus === "cancelled";

  return (
    <Box
      ref={ref}
      sx={{
        bgcolor: "#fff",
        borderRadius: 3,
        p: 3,
        width: "100%",
        maxWidth: 640,
        mx: "auto",
        fontFamily: "inherit",
      }}
    >
      <Box sx={{ textAlign: "center", mb: 0.5 }}>
        {dealer.logoUrl && (
          <Box component="img" src={dealer.logoUrl} alt="logo" sx={{ height: 56, mb: 0.75, objectFit: "contain" }} />
        )}
        <Typography sx={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a" }}>
          {dealer.name || "MR Bike Service Center"}
        </Typography>
        {dealer.address && <Typography sx={{ fontSize: 11.5, color: "#666" }}>{dealer.address}</Typography>}
        {dealer.phone && <Typography sx={{ fontSize: 11.5, color: "#666" }}>Ph: {dealer.phone}</Typography>}
        {dealer.gstNumber && <Typography sx={{ fontSize: 11.5, color: "#666" }}>GSTIN: {dealer.gstNumber}</Typography>}
      </Box>

      <SectionDivider />
      <Typography sx={{ textAlign: "center", fontSize: 16, fontWeight: 800, letterSpacing: 2, mb: 1.25 }}>
        TAX INVOICE
      </Typography>
      <Row label="Invoice No" value={invoice.invoiceNumber} bold />
      <Row label="Booking ID" value={invoice.bookingNumber || "—"} />
      <Row label="Invoice Date" value={formatDateTime(invoice.invoiceDate)} />
      <Row label="Payment Method" value={invoice.paymentMethod || "—"} />

      <SectionDivider />
      <SectionTitle>Customer Details</SectionTitle>
      <Row label="Name" value={customer.name || "—"} />
      <Row label="Mobile" value={customer.mobile || "—"} />

      <SectionDivider />
      <SectionTitle>Bike Details</SectionTitle>
      <Row label="Company" value={bike.company || "—"} />
      <Row label="Model" value={bike.model || "—"} />
      <Row label="Registration No." value={bike.registrationNumber || "—"} />
      <Row label="Engine CC" value={bike.engineCc ? `${bike.engineCc} cc` : "—"} />

      <SectionDivider />
      <SectionTitle>Service Details</SectionTitle>
      <Table size="small" sx={{ "& td, & th": { border: 0, px: 0.5 } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontSize: 10, fontWeight: 800, color: "#888", textTransform: "uppercase" }}>
              Service
            </TableCell>
            <TableCell align="center" sx={{ fontSize: 10, fontWeight: 800, color: "#888", textTransform: "uppercase" }}>
              Qty
            </TableCell>
            <TableCell align="right" sx={{ fontSize: 10, fontWeight: 800, color: "#888", textTransform: "uppercase" }}>
              Rate
            </TableCell>
            <TableCell align="right" sx={{ fontSize: 10, fontWeight: 800, color: "#888", textTransform: "uppercase" }}>
              Amount
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {services.map((s, i) => (
            <TableRow key={i}>
              <TableCell sx={{ fontSize: 12 }}>{s.name}</TableCell>
              <TableCell align="center" sx={{ fontSize: 12 }}>{s.quantity}</TableCell>
              <TableCell align="right" sx={{ fontSize: 12 }}>{formatCurrency(s.price)}</TableCell>
              <TableCell align="right" sx={{ fontSize: 12 }}>{formatCurrency(s.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SectionDivider />
      <Row label="Subtotal" value={formatCurrency(invoice.subtotal)} />
      {charges.pickupCharge > 0 && <Row label="Pickup Charges" value={formatCurrency(charges.pickupCharge)} />}
      {charges.dropCharge > 0 && <Row label="Drop Charges" value={formatCurrency(charges.dropCharge)} />}

      <SectionDivider />
      <Row label={`GST (${formatGST(tax.rate)})`} value={formatCurrency(tax.amount)} />

      <SectionDivider />
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Total Paid By Customer</Typography>
        <Typography sx={{ fontSize: 20, fontWeight: 900, color: "#0D1952" }}>
          {formatCurrency(invoice.totalPaid)}
        </Typography>
      </Box>

      <SectionDivider />
      <SectionTitle>Settlement Details</SectionTitle>
      <Row
        label={`Platform Commission (${formatGST(settlement.commissionRate)})`}
        value={formatCurrency(settlement.commissionAmount)}
      />
      <Row label="Net Dealer Payout" value={formatCurrency(settlement.dealerPayout)} bold />

      <SectionDivider />
      <Box sx={{ textAlign: "center" }}>
        <Box
          component="span"
          sx={{
            display: "inline-block",
            border: "2px solid",
            borderColor: isCancelled ? "#c62828" : "#1e8e3e",
            color: isCancelled ? "#c62828" : "#1e8e3e",
            fontWeight: 900,
            letterSpacing: 3,
            borderRadius: 1.5,
            px: 3,
            py: 0.75,
          }}
        >
          {isCancelled ? "CANCELLED" : "PAID"}
        </Box>
      </Box>

      <SectionDivider />
      <SectionTitle>Notes</SectionTitle>
      <Typography sx={{ fontSize: 11, color: "#777", mb: 0.5 }}>• GST is collected as per applicable tax rules.</Typography>
      <Typography sx={{ fontSize: 11, color: "#777" }}>
        • Dealer payout is calculated after deducting platform commission.
      </Typography>

      <SectionDivider />
      <Typography sx={{ textAlign: "center", fontSize: 13, fontWeight: 700 }}>
        Thank you for choosing MR Bike.
      </Typography>
    </Box>
  );
});

InvoiceDocument.displayName = "InvoiceDocument";

export default InvoiceDocument;

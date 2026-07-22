import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogActions, Button, Box, CircularProgress, Typography } from "@mui/material";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getBookingInvoice } from "../../api";
import InvoiceDocument from "./InvoiceDocument";

// Same GET /invoice/booking/:bookingId the User App and Dealer App call —
// one invoice per booking, fetched fresh every time this opens (never
// regenerated/renumbered on the backend).
const InvoiceModal = ({ open, bookingId, onClose }) => {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    if (!open || !bookingId) return;
    setInvoice(null);
    setError(null);
    setLoading(true);
    getBookingInvoice(bookingId)
      .then((res) => {
        if (res?.success && res.data) {
          setInvoice(res.data);
        } else {
          setError(res?.message || "Invoice not available yet");
        }
      })
      .catch((err) => setError(err?.message || "Failed to fetch invoice"))
      .finally(() => setLoading(false));
  }, [open, bookingId]);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
      pdf.save(`${invoice?.invoiceNumber || "invoice"}.pdf`);
    } catch (err) {
      console.error("Invoice PDF error:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Print-only scoping: hide everything except the invoice node when
          printing, so "Print Invoice" (browser print) never prints the rest
          of the admin dashboard behind the dialog. */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print-area, #invoice-print-area * { visibility: visible; }
          #invoice-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogContent sx={{ bgcolor: "#f4f5f7", py: 4 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress />
            </Box>
          ) : error || !invoice ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography color="text.secondary">{error || "Invoice is not available yet."}</Typography>
            </Box>
          ) : (
            <Box id="invoice-print-area">
              <InvoiceDocument invoice={invoice} ref={printRef} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, bgcolor: "#fff", borderTop: "1px solid #eee" }}>
          <Button onClick={onClose} sx={{ textTransform: "none", fontWeight: 700 }}>
            Close
          </Button>
          <Button
            variant="outlined"
            disabled={!invoice || pdfLoading}
            onClick={handleDownloadPdf}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {pdfLoading ? "Preparing…" : "Download PDF"}
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={!invoice}
            onClick={handlePrint}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Print Invoice
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InvoiceModal;

import React, { useState, useEffect } from "react";
import { Container, Box, Typography, Fade, Alert, CircularProgress } from "@mui/material";
import { getAllPayment } from "../../api";
import SummaryCards from "../../components/payment/SummaryCards";
import ModernPaymentTable from "../../components/payment/ModernPaymentTable";
import PaymentDetailsDrawer from "../../components/payment/PaymentDetailsDrawer";
import PaymentAnalytics from "../../components/payment/PaymentAnalytics";

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllPayment();
      if (response.success && Array.isArray(response.data)) {
        setPayments(response.data);
      } else {
        setPayments([]);
        setError("No payments found or invalid response format.");
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError("Failed to load payment data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRowClick = (payment) => {
    setSelectedPayment(payment);
    setDrawerOpen(true);
  };

  if (loading && payments.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom>
              Payments & Transactions
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Monitor and manage all payment activities for Mr Bike
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="info" sx={{ mb: 4, borderRadius: "12px" }}>
            {error}
          </Alert>
        )}

        <Fade in timeout={500}>
          <Box>
            {/* Summary Cards Section */}
            <SummaryCards data={payments} />

            {/* Analytics Section */}
            <PaymentAnalytics data={payments} />

            {/* Main Table Section */}
            <ModernPaymentTable 
              data={payments} 
              onRowClick={handleRowClick} 
              loading={loading} 
            />
          </Box>
        </Fade>

        {/* Details Drawer */}
        <PaymentDetailsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          payment={selectedPayment}
        />
      </Container>
    </Box>
  );
};

export default PaymentList;

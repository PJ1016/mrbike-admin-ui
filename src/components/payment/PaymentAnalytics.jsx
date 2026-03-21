import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";
import { Grid, Card, CardContent, Typography, Box } from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PaymentAnalytics = ({ data = [] }) => {
  // Line Chart Data: Payments per day for last 7 days
  const lineChartData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split("T")[0];
    });

    const dailyRevenue = last7Days.map((day) => {
      return data
        .filter((p) => p.order_status === "SUCCESS" && p.createdAt.startsWith(day))
        .reduce((sum, p) => sum + (p.orderAmount || 0), 0);
    });

    return {
      labels: last7Days.map(d => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })),
      datasets: [
        {
          label: "Revenue (₹)",
          data: dailyRevenue,
          borderColor: "#2563eb",
          backgroundColor: "rgba(37, 99, 235, 0.1)",
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: "#2563eb",
        },
      ],
    };
  }, [data]);

  // Doughnut Chart Data: Status Distribution
  const doughnutData = React.useMemo(() => {
    const success = data.filter((p) => p.order_status === "SUCCESS").length;
    const pending = data.filter((p) => p.order_status === "PENDING").length;
    const failed = data.filter((p) => ["FAILED", "CANCELLED"].includes(p.order_status)).length;

    return {
      labels: ["Success", "Pending", "Failed"],
      datasets: [
        {
          data: [success, pending, failed],
          backgroundColor: ["#10b981", "#f59e0b", "#ef4444"],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
      x: { grid: { display: false } },
    },
  };

  return (
    <Grid container spacing={3} mb={4}>
      <Grid item xs={12} md={8}>
        <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Revenue Trend (Last 7 Days)
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line data={lineChartData} options={options} />
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={4}>
        <Card sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700} mb={3}>
              Status Distribution
            </Typography>
            <Box sx={{ height: 300, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <Doughnut 
                data={doughnutData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } } 
                }} 
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default PaymentAnalytics;

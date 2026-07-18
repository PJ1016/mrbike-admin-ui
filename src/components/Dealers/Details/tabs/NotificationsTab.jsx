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
  CircularProgress,
  Alert,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import moment from "moment";
import { SectionHeader } from "../DealerShared";

const STATUS_COLOR = {
  sent: "success",
  pending: "warning",
  failed: "error",
};

const statusLabel = (status) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown";

const NotificationsTab = ({ notifications = [], loading = false, error = null }) => {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<NotificationsIcon />} title="Notifications" />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : notifications.length === 0 ? (
                <Alert severity="info" sx={{ py: 0.5, fontSize: "0.75rem" }}>
                  No notifications found.
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                          Time
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                          Title
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                          Message
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                          Status
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {notifications.map((n) => (
                        <TableRow key={n._id} hover>
                          <TableCell sx={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                            {n.createdAt ? moment(n.createdAt).format("DD MMM YYYY, hh:mm A") : "N/A"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                            {n.title || "—"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }}>
                            {n.body || (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusLabel(n.status)}
                              size="small"
                              color={STATUS_COLOR[n.status] || "default"}
                              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationsTab;

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
import HistoryIcon from "@mui/icons-material/History";
import moment from "moment";
import { SectionHeader } from "../DealerShared";

const ACTION_COLOR = {
  "Dealer Approved": "success",
  "Dealer Activated": "success",
  "Document Approved": "success",
  "Dealer Rejected": "error",
  "Dealer Blocked": "error",
  "Document Rejected": "error",
  "Dealer Inactivated": "default",
  "Document Requested": "warning",
};

const ActivityTab = ({ activity = [], loading = false, error = null }) => {
  return (
    <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<HistoryIcon />} title="Activity History" />

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : activity.length === 0 ? (
                <Alert severity="info" sx={{ py: 0.5, fontSize: "0.75rem" }}>
                  No activity recorded for this dealer yet.
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "grey.50" }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                          Timestamp
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                          Admin
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                          Action
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase" }}>
                          Reason
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activity.map((entry) => (
                        <TableRow key={entry._id} hover>
                          <TableCell sx={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                            {entry.timestamp ? moment(entry.timestamp).format("DD MMM YYYY, hh:mm A") : "N/A"}
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }}>
                            {entry.adminName || "System"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entry.action}
                              size="small"
                              color={ACTION_COLOR[entry.action] || "default"}
                              sx={{ fontWeight: 700, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.85rem" }}>
                            {entry.reason || (
                              <Typography variant="body2" color="text.secondary">
                                —
                              </Typography>
                            )}
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

export default ActivityTab;

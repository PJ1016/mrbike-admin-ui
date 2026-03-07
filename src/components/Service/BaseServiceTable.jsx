import { useState, useMemo } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { deleteBaseService } from "../../api";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Pagination,
  IconButton,
  Box,
  Typography,
  Avatar,
  Tooltip,
  Skeleton,
  TableSortLabel,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InventoryIcon from "@mui/icons-material/Inventory";
import { visuallyHidden } from "@mui/utils";

const BaseServiceTable = ({
  datas,
  onServiceDeleted,
  loading,
  tableHeaders,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleDelete = async (serviceId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await deleteBaseService(serviceId);
          if (response && response.status === true) {
            onServiceDeleted();
          }
        } catch (error) {
          console.error("Delete failed:", error);
        }
      }
    });
  };

  const filteredData = useMemo(() => {
    let dataList = Array.isArray(datas) ? [...datas] : [];

    // Filter logic
    if (searchTerm.trim()) {
      dataList = dataList.filter((item) =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Sort logic
    dataList.sort((a, b) => {
      let valA = a[orderBy];
      let valB = b[orderBy];

      if (orderBy === "createdAt") {
        valA = new Date(valA);
        valB = new Date(valB);
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valB < valA) {
        return order === "desc" ? -1 : 1;
      }
      if (valB > valA) {
        return order === "desc" ? 1 : -1;
      }
      return 0;
    });

    return dataList;
  }, [datas, searchTerm, order, orderBy]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const startIndex = (currentPage - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPage * rowsPerPage, filteredData.length);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: "12px", border: "1px solid #e0e0e0" }}
      >
        <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-end" }}>
          <TextField
            placeholder="Search service name..."
            size="small"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon
                      sx={{ color: "text.secondary", fontSize: 20 }}
                    />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: { xs: "100%", sm: 300 },
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }} size="small">
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                {tableHeaders.map((header) => {
                  const isSortable =
                    header === "Service Name" || header === "Created At";
                  const property =
                    header === "Service Name" ? "name" : "createdAt";

                  return (
                    <TableCell
                      key={header}
                      align={header === "Actions" ? "center" : "left"}
                      sortDirection={orderBy === property ? order : false}
                      sx={{ fontWeight: 700, py: 1.5, color: "text.secondary" }}
                    >
                      {isSortable ? (
                        <TableSortLabel
                          active={orderBy === property}
                          direction={orderBy === property ? order : "asc"}
                          onClick={() => handleRequestSort(property)}
                          sx={{
                            "&.Mui-active": { color: "primary.main" },
                            "& .MuiTableSortLabel-icon": {
                              color: "primary.main !important",
                            },
                          }}
                        >
                          {header}
                          {orderBy === property ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === "desc"
                                ? "sorted descending"
                                : "sorted ascending"}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      ) : (
                        header
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from(new Array(5)).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton width={20} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={40} height={40} />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="60%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton width="40%" />
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 1,
                        }}
                      >
                        <Skeleton variant="circular" width={28} height={28} />
                        <Skeleton variant="circular" width={28} height={28} />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : currentData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableHeaders.length}
                    align="center"
                    sx={{ py: 10 }}
                  >
                    <Box sx={{ opacity: 0.3, mb: 2 }}>
                      <InventoryIcon sx={{ fontSize: 64 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      color="text.secondary"
                      fontWeight={600}
                    >
                      No services found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or add a new service.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((service, index) => (
                  <TableRow key={service._id} hover>
                    <TableCell sx={{ py: 1 }}>
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Avatar
                        src={service.image}
                        variant="rounded"
                        sx={{
                          width: 40,
                          height: 40,
                          border: "1px solid #eee",
                          bgcolor: "#f5f5f5",
                          fontSize: "1rem",
                        }}
                      >
                        {service.name?.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="text.primary"
                      >
                        {service.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(service.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Tooltip title="Edit Service" arrow>
                          <IconButton
                            size="small"
                            sx={{
                              color: "primary.main",
                              "&:hover": { bgcolor: "primary.lighter" },
                            }}
                            onClick={() =>
                              navigate(`/edit-base-service/${service._id}`)
                            }
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Service" arrow>
                          <IconButton
                            size="small"
                            sx={{
                              color: "error.main",
                              ml: 1,
                              "&:hover": { bgcolor: "error.lighter" },
                            }}
                            onClick={() => handleDelete(service._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            mt: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {filteredData.length > 0 ? (
              <>
                Showing <b>{startIndex}</b> to <b>{endIndex}</b> of{" "}
                <b>{filteredData.length}</b> results
              </>
            ) : (
              "No results to display"
            )}
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            shape="rounded"
            size="medium"
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default BaseServiceTable;

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
  Menu,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Avatar,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const BaseServiceTable = ({
  datas,
  onServiceDeleted,
  loading,
  tableHeaders,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // State for Action Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const handleMenuOpen = (event, service) => {
    setAnchorEl(event.currentTarget);
    setSelectedService(service);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedService(null);
  };

  const handleDelete = async (serviceId) => {
    handleMenuClose();
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
    const dataList = Array.isArray(datas) ? datas : [];
    if (!searchTerm.trim()) return dataList;
    return dataList.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [datas, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

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
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ width: 300 }}
          />
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: "#F8FAFC" }}>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableCell key={header} sx={{ fontWeight: 600 }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={tableHeaders.length}
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    <Typography color="text.secondary">
                      Loading base services...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : currentData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={tableHeaders.length}
                    align="center"
                    sx={{ py: 8 }}
                  >
                    <Typography color="text.secondary" fontStyle="italic">
                      No services found matching your search.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((service, index) => (
                  <TableRow key={service._id} hover>
                    <TableCell>
                      {(currentPage - 1) * rowsPerPage + index + 1}
                    </TableCell>
                    <TableCell>
                      <Avatar
                        src={service.image}
                        variant="rounded"
                        sx={{
                          width: 48,
                          height: 48,
                          border: "1px solid #eee",
                          bgcolor: "#f5f5f5",
                        }}
                      >
                        {service.name?.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600} color="text.primary">
                        {service.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
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
                    <TableCell align="right">
                      <IconButton onClick={(e) => handleMenuOpen(e, service)}>
                        <MoreVertIcon />
                      </IconButton>
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
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Total Records: <b>{filteredData.length}</b>
          </Typography>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, page) => setCurrentPage(page)}
            color="primary"
            shape="rounded"
          />
        </Box>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            elevation: 2,
            sx: { minWidth: 150, borderRadius: "8px" },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            navigate(`/edit-base-service/${selectedService?._id}`);
            handleMenuClose();
          }}
          sx={{ gap: 1.5 }}
        >
          <EditIcon fontSize="small" sx={{ color: "text.secondary" }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleDelete(selectedService?._id)}
          sx={{ gap: 1.5, color: "error.main" }}
        >
          <DeleteIcon fontSize="small" />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default BaseServiceTable;

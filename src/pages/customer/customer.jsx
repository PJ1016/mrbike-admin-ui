import { Box, Typography } from "@mui/material";
import { PeopleAlt as PeopleIcon } from "@mui/icons-material";
import CustomerTable from "../../components/Customers/customers";
import { useGetCustomersQuery } from "../../redux/services/customerApi";

const CustomersPage = () => {
  const { data: customers = [], isLoading: loading, refetch } = useGetCustomersQuery();

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Page header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
            <PeopleIcon sx={{ color: "#2e83ff", fontSize: 28 }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
                Customers
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manage registered customer accounts
              </Typography>
            </Box>
          </Box>

          <CustomerTable
            datas={customers}
            loading={loading}
            onRefresh={refetch}
          />
        </Box>
      </div>
    </div>
  );
};

export default CustomersPage;

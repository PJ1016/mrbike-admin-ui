import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { PeopleAlt as PeopleIcon } from "@mui/icons-material";
import CustomerTable from "../../components/Customers/customers";
import { getCustomerList } from "../../api";

const CustomersPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const response = await getCustomerList();
        if (response.status === 200) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching customer list:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [refresh]);

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
            datas={data}
            loading={loading}
            onRefresh={() => setRefresh((prev) => !prev)}
          />
        </Box>
      </div>
    </div>
  );
};

export default CustomersPage;

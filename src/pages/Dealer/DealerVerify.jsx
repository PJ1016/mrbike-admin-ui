import React, { useRef, useState, useEffect } from "react";
import DealerVerficationTable from "../../components/Dealers/DealerVerficationTable";
import { Link } from "react-router-dom";
import { getBannerList, getDealersVerify } from "../../api";
import { Typography } from "@mui/material";

const DealerVerify = () => {
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  const tableHeaders = [
    "#",
    "Dealer ID",
    "Commission Charging (%)",
    "Tax Charging(%)",
    "Owner Name",
    "Owner Permanent Address",
    "Owner Present Address",
    "Aadhar Card No.",
    "Pan Card No.",
    "Shop Name",
    "Shop Email",
    "Shop Phone",
    "Shop Address",
    "Shop State",
    "Shop PinCode",
    "Is Verified",
    "Blocked?",
    "Created At",
    "Updated At",
    "City",
    "Beneficiary Name",
    "Beneficiary Account No",
    "Beneficiary IFSC",
    "Is Profile Completed?",
    "Is Document Added?",
    "Action",
  ];

  useEffect(() => {
    const fetchDealers = async () => {
      setLoading(true);
      try {
        const response = await getDealersVerify();
        if (response.success) {
          console.log("Response", response);
          setData(response.vendors);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDealers();
  }, [refresh]);

  const handleRefresh = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <div className="content-page-header">
            <h5>Dealer Verification Requests</h5>
            <Typography variant="body2" color="text.secondary">
              Review and approve dealer registration documents and profiles.
            </Typography>
          </div>
        </div>

        <DealerVerficationTable
          datas={data}
          loading={loading}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
};

export default DealerVerify;

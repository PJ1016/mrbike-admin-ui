import React, { useRef, useState, useEffect } from "react";
import ServiceTable from "../../components/reward/rewardTable"; // Reused table
import { getAllRewards } from "../../api"; // You must define this function in your API

const RewardList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const tableHeaders = [
    "#",
    "Reward ID",
    "User Name",
    "Booking ID",
    "Vendor Name",
    "Service Names",
    "Reward Points",
    "Scratched?",
    "Created At",
  ];

  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);

  useEffect(() => {
    const fetchRewards = async () => {
      setLoading(true)
      try {
        const response = await getAllRewards();
        if (response.status) {
          setData(response.rewards);
        }
      } catch (error) {
        console.error("Error fetching rewards:", error);
      } finally {
        setLoading(false)
      }
    };

    fetchRewards();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <div className="content-page-header">
            <h5>Rewards</h5>
            <div className="list-btn">
              <ul className="filter-list">
                <li>
                  <div className="dropdown dropdown-action">
                    <button className="btn btn-primary" data-bs-toggle="dropdown">
                      <span><i className="fe fe-download me-2" /></span>
                      Download
                    </button>
                    <div className="dropdown-menu dropdown-menu-end">
                      <ul className="d-block">
                        <li>
                          <button
                            className="download-item"
                            onClick={(e) => {
                              e.preventDefault();
                              if (triggerDownloadExcel.current) triggerDownloadExcel.current();
                            }}
                          >
                            <i className="far fa-file-excel me-2" /> EXCEL
                          </button>
                        </li>
                        <li>
                          <button
                            className="download-item"
                            onClick={(e) => {
                              e.preventDefault();
                              if (triggerDownloadPDF.current) triggerDownloadPDF.current();
                            }}
                          >
                            <i className="far fa-file-pdf me-2" /> PDF
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
                {/* <li>
                  <Link className="btn btn-primary" to="/banners">
                    <i className="fa fa-plus-circle me-2" /> Add New Reward
                  </Link>
                </li> */}
              </ul>
            </div>
          </div>
        </div>

        <ServiceTable
          loading={loading}
          datas={data}
          triggerDownloadExcel={triggerDownloadExcel}
          triggerDownloadPDF={triggerDownloadPDF}
          tableHeaders={tableHeaders}
          text={"Rewards"}
        />
      </div>
    </div>
  );
};

export default RewardList;

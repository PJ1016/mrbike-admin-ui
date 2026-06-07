import React, { useRef, useState, useEffect } from "react";
import WithdrawalManagementTable from "../../components/Dealers/DealerPayoutList";
import { getDealerPayouts } from "../../api";

const DealerPayoutList = () => {
  const [data, setData] = useState([]);
  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF   = useRef(null);

  const fetchData = async () => {
    try {
      const response = await getDealerPayouts();
      if (response.status === true) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <div className="content-page-header">
            <h5>Withdrawal Requests</h5>
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
                            onClick={(e) => { e.preventDefault(); if (triggerDownloadExcel.current) triggerDownloadExcel.current(); }}
                          >
                            <i className="far fa-file-excel me-2" /> EXCEL
                          </button>
                        </li>
                        <li>
                          <button
                            className="download-item"
                            onClick={(e) => { e.preventDefault(); if (triggerDownloadPDF.current) triggerDownloadPDF.current(); }}
                          >
                            <i className="far fa-file-pdf me-2" /> PDF
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <WithdrawalManagementTable
          datas={data}
          fetchLatest={fetchData}
          triggerDownloadExcel={triggerDownloadExcel}
          triggerDownloadPDF={triggerDownloadPDF}
        />
      </div>
    </div>
  );
};

export default DealerPayoutList;

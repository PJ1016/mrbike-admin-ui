import React, { useRef, useState, useEffect } from "react";
import BannerTable from "../../components/Banners/BannerTable";
import { Link } from "react-router-dom";
import { getBannerList } from "../../api";

const Banners = () => {
  const [data, setData] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [loading, setLoading] = useState(true);

  const tableHeaders = [
    "#",
    "Banner ID",
    "Banner Name",
    "Linked Service",
    "Display Order",
    "Banner Image",
    "From Date",
    "Expiry Date",
    "Created At",
    "Updated At",
    "Action",
  ];


  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        const response = await getBannerList();
        if (response.status === 200) {
          setData(response.data);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [refresh]);

  const handleRefresh = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <div className="content-page-header">
            <h5>Banners</h5>
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
                          <button className="download-item"
                            onClick={(e) => { e.preventDefault(); if (triggerDownloadExcel.current) triggerDownloadExcel.current(); }}>
                            <i className="far fa-file-excel me-2" /> EXCEL
                          </button>
                        </li>
                        <li>
                          <button className="download-item"
                            onClick={(e) => { e.preventDefault(); if (triggerDownloadPDF.current) triggerDownloadPDF.current(); }}>
                            <i className="far fa-file-pdf me-2" /> PDF
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </li>
                <li>
                  <Link className="btn btn-primary" to="/banners">
                    <i className="fa fa-plus-circle me-2" /> Add New Banner
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <BannerTable
          datas={data}
          loading={loading}
          triggerDownloadExcel={triggerDownloadExcel}
          triggerDownloadPDF={triggerDownloadPDF}
          tableHeaders={tableHeaders}
          text={"Banners"}
          onBannerDeleted={handleRefresh}
        />
      </div>
    </div>
  );
};

export default Banners;

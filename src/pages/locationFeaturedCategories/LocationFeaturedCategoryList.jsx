import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LocationFeaturedCategoryTable from "../../components/LocationFeaturedCategories/LocationFeaturedCategoryTable";
import { getLocationFeaturedCategories } from "../../api";

const LocationFeaturedCategoryList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [refresh, setRefresh] = useState(false);
  const triggerDownloadExcel = useRef(null);
  const triggerDownloadPDF = useRef(null);

  const tableHeaders = [
    "#",
    "Image",
    "Category Name",
    "Major Service",
    "Location",
    "Radius",
    "Status",
    "Created Date",
    "Actions",
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setLoadError("");
      try {
        // The API's global request validator allows at most 100 rows per page.
        const firstResponse = await getLocationFeaturedCategories({ limit: 100, page: 1 });
        if (!Array.isArray(firstResponse?.data)) {
          throw new Error("The server returned an invalid category list.");
        }

        const pageCount = Math.max(1, Number(firstResponse?.meta?.pages) || 1);
        const remainingResponses = pageCount > 1
          ? await Promise.all(
              Array.from({ length: pageCount - 1 }, (_, index) =>
                getLocationFeaturedCategories({ limit: 100, page: index + 2 })
              )
            )
          : [];

        const categories = remainingResponses.reduce(
          (items, response) => items.concat(Array.isArray(response?.data) ? response.data : []),
          firstResponse.data
        );
        setData(categories);
      } catch (error) {
        console.error("Error fetching location featured categories:", error);
        setData([]);
        setLoadError(error?.userMessage || error?.message || "Unable to load categories.");
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [refresh]);

  const handleRefresh = () => {
    setRefresh((prev) => !prev);
  };

  return (
    <div className="page-wrapper">
      <div className="content container-fluid">
        <div className="page-header">
          <div className="content-page-header">
            <h5>Location Based Featured Categories</h5>
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
                <li>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/location-featured-categories/add")}
                  >
                    <i className="fa fa-plus-circle me-2" />
                    Add New
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {loadError ? (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
            <span>{loadError}</span>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleRefresh}>
              Retry
            </button>
          </div>
        ) : (
          <LocationFeaturedCategoryTable
            datas={data}
            loading={loading}
            triggerDownloadExcel={triggerDownloadExcel}
            triggerDownloadPDF={triggerDownloadPDF}
            tableHeaders={tableHeaders}
            text="Location_Featured_Categories"
            onDeleted={handleRefresh}
          />
        )}
      </div>
    </div>
  );
};

export default LocationFeaturedCategoryList;

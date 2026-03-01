"use client"

import { useState, useMemo, useRef } from "react"
import Swal from "sweetalert2"
import { useDownloadExcel } from "react-export-table-to-excel"
import jsPDF from "jspdf"
import "jspdf-autotable"
import ImagePreview from "../Global/ImagePreview"
import { deleteAdminService } from "../../api"
import { useNavigate } from "react-router-dom"

const ServiceTable = ({
  triggerDownloadExcel,
  triggerDownloadPDF,
  tableHeaders,
  datas,
  text,
  onServiceDeleted,
  loading,
  error,
}) => {
  const navigate = useNavigate()
  const tableRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    _id: "",
    base_service_id: {},
    companies: [],
    dealer_id: {},
    bikes: [],
  })

  const handleView = (service) => {
    setEditFormData({
      _id: service._id,
      base_service_id: service.base_service_id || {},
      companies: service.companies || [],
      dealer_id: service.dealer_id || {},
      bikes: service.bikes || [],
    })
    setShowEditModal(true)
  }

  const rowsPerPage = 10

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Service_List",
    sheet: "Services",
  })

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("Service List", 14, 10)

    const table = tableRef.current
    if (!table) {
      console.error("Table not found!")
      return
    }

    doc.autoTable({
      html: "#example",
      startY: 20,
      theme: "striped",
    })

    doc.save(`${text}.pdf`)
  }

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
          const response = await deleteAdminService(serviceId)
          if (response && response.status === true) {
            onServiceDeleted()
          }
        } catch (error) {
          console.error("[v0] Delete failed in UI:", error)
        }
      }
    })
  }

  // Filtered data based on search
  const filteredData = useMemo(() => {
    const dataList = Array.isArray(datas) ? datas : []

    if (searchTerm.trim() === "") return dataList

    return dataList.filter((item) => {
      const search = searchTerm.toLowerCase()

      const serviceNameMatch = item.base_service_id?.name?.toLowerCase().includes(search) ?? false
      const companiesMatch = item.companies?.some((company) => company.name?.toLowerCase().includes(search)) ?? false

      return serviceNameMatch || companiesMatch
    })
  }, [datas, searchTerm])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [filteredData, currentPage])

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  triggerDownloadExcel.current = onDownload
  triggerDownloadPDF.current = exportToPDF

  const memoizedServiceList = currentData.map((data, index) => (
    <tr key={data._id}>
      <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
      <td>{data.serviceId || "N/A"}</td>
      <td>{data.base_service_id?.image ? <ImagePreview image={data.base_service_id.image} /> : "N/A"}</td>
      <td>{data.base_service_id?.name || "N/A"}</td>
      <td style={{ whiteSpace: "normal", wordBreak: "break-word", maxWidth: "300px" }}>
        {data.companies && data.companies.length > 0 ? (
          <div className="d-flex flex-wrap gap-1">
            {data.companies.map((company, idx) => (
              <span key={idx} className="badge bg-info text-dark">
                {company.name}
              </span>
            ))}
          </div>
        ) : (
          "N/A"
        )}
      </td>
      <td>
        {data.dealer_id ? (
          <span className="badge bg-success text-white">
            {typeof data.dealer_id === "object" ? data.dealer_id.shopName || "N/A" : "N/A"}
          </span>
        ) : (
          "N/A"
        )}
      </td>
      <td>
        {data.dealer_id ? (
          <span className="badge bg-secondary text-white">
            {typeof data.dealer_id === "object" ? data.dealer_id.dealerId || "N/A" : "N/A"}
          </span>
        ) : (
          "N/A"
        )}
      </td>
      {/* <td>
        {data.bikes && data.bikes.length > 0 ? (
          <ul className="mb-0 list-unstyled">
            {data.bikes
              .sort((a, b) => a.cc - b.cc)
              .map((bike, idx) => (
                <li key={idx} className="small">
                  ₹{bike.price}
                </li>
              ))}
          </ul>
        ) : (
          "N/A"
        )}
      </td> */}
      <td>{new Date(data.createdAt).toLocaleDateString()}</td>
      <td>{new Date(data.updatedAt).toLocaleDateString()}</td>
      <td className="d-flex align-items-center">
        <div className="dropdown">
          <a href="#" className="btn-action-icon" data-bs-toggle="dropdown">
            <i className="fas fa-ellipsis-v" />
          </a>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <button className="dropdown-item" onClick={() => handleView(data)}>
                <i className="far fa-eye me-2" /> View
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={() => navigate(`/edit-services/${data._id}`)}>
                <i className="far fa-edit me-2" /> Edit Pricing
              </button>
            </li>
            <li>
              <button className="dropdown-item" onClick={() => handleDelete(data._id)}>
                <i className="far fa-trash-alt me-2" /> Delete
              </button>
            </li>
          </ul>
        </div>
      </td>
    </tr>
  ))

  return (
    <>
      <div className="row">
        <div className="col-sm-12">
          <div className="card-table card p-2">
            <div className="card-body">
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by service name or company"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <div className="table-responsive">
                <table ref={tableRef} id="example" className="table table-striped">
                  <thead className="thead-light" style={{ backgroundColor: "#2e83ff" }}>
                    <tr>
                      {tableHeaders.map((header, index) => (
                        <th key={index}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="list">
                    {loading ? (
                      <tr>
                        <td colSpan={tableHeaders.length} className="text-center py-5">
                          <div className="d-flex justify-content-center align-items-center flex-column">
                            <div className="spinner-border text-primary" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <div className="mt-2">Loading services...</div>
                          </div>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td
                          colSpan={tableHeaders.length}
                          style={{
                            textAlign: "center",
                            color: "red",
                            padding: "20px",
                            fontWeight: "bold",
                          }}
                        >
                          {error}
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={tableHeaders.length}
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            fontStyle: "italic",
                            color: "#555",
                          }}
                        >
                          No Services found.
                        </td>
                      </tr>
                    ) : (
                      memoizedServiceList
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded shadow-sm">
                <div className="text-muted" style={{ fontWeight: "500", fontSize: "0.9rem" }}>
                  Total Records: <span className="text-primary fw-bold">{filteredData.length}</span>
                </div>

                <nav aria-label="Page navigation example">
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                      <button
                        className="page-link"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        aria-label="Previous"
                      >
                        &laquo;
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <li key={page} className={`page-item ${page === currentPage ? "active" : ""}`}>
                        <button className="page-link" onClick={() => handlePageChange(page)}>
                          {page}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)} aria-label="Next">
                        &raquo;
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">View Service Details</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>

              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Service Name (Read-Only)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editFormData.base_service_id?.name || ""}
                      disabled
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Companies (Read-Only)</label>
                    <div className="form-control" style={{ height: "auto", background: "#f8f9fa" }}>
                      {editFormData.companies && editFormData.companies.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {editFormData.companies.map((company, idx) => (
                            <span key={idx} className="badge bg-info text-dark">
                              {company.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">No companies</span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Dealer Name (Read-Only)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        editFormData.dealer_id && typeof editFormData.dealer_id === "object"
                          ? editFormData.dealer_id.shopName || "N/A"
                          : "N/A"
                      }
                      disabled
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Dealer ID (Read-Only)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={
                        editFormData.dealer_id && typeof editFormData.dealer_id === "object"
                          ? editFormData.dealer_id.dealerId || "N/A"
                          : "N/A"
                      }
                      disabled
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Bikes & Pricing</label>
                    {editFormData.bikes && editFormData.bikes.length > 0 ? (
                      <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
                        <table className="table table-sm table-bordered">
                          <thead className="table-light">
                            <tr>
                              <th>CC</th>
                              <th>Price (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editFormData.bikes
                              .sort((a, b) => a.cc - b.cc)
                              .map((bike, idx) => (
                                <tr key={idx}>
                                  <td>{bike.cc} CC</td>
                                  <td>₹{bike.price}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <span className="text-muted">No bikes</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ServiceTable

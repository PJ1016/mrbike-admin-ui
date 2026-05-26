"use client"

import { useState, useMemo, useRef } from "react"
import Swal from "sweetalert2"
import { useDownloadExcel } from "react-export-table-to-excel"
import jsPDF from "jspdf"
import "jspdf-autotable"
import ImagePreview from "../Global/ImagePreview"
import { deleteBanner } from "../../api"

const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL

const BannerTable = ({
  triggerDownloadExcel,
  triggerDownloadPDF,
  tableHeaders,
  datas,
  text,
  onBannerDeleted,
  loading,
}) => {
  const tableRef = useRef(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({
    _id: "",
    name: "",
    banner_image: "",
    from_date: "",
    expiry_date: "",
  })
  const [editLoading, setEditLoading] = useState(false)

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Banner_List",
    sheet: "Banners",
  })

  console.log("BannerTable rendered with datas:", datas)

  const handleEdit = (banner) => {
    setEditFormData({
      _id: banner._id,
      name: banner.name || "",
      banner_image: banner.banner_image || "",
      from_date: banner.from_date ? new Date(banner.from_date).toISOString().split("T")[0] : "",
      expiry_date: banner.expiry_date ? new Date(banner.expiry_date).toISOString().split("T")[0] : "",
    })
    setShowEditModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      // Add your API call to update banner here
      // Example: const response = await updateBanner(editFormData._id, editFormData);
      Swal.fire("Success!", "Banner updated successfully!", "success")
      setShowEditModal(false)
      onBannerDeleted() // Refresh the list
    } catch (error) {
      Swal.fire("Error!", "Failed to update banner", "error")
    } finally {
      setEditLoading(false)
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()
    doc.text("Banner List", 14, 10)

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

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return datas
    return datas.filter((item) =>
      [item.name, item._id].some((field) => field?.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [searchTerm, datas])

  const handleDelete = async (bannerId) => {
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
          const response = await deleteBanner(bannerId)
          if (response.status === 200) {
            // Remove deleted dealer from state
            const updatedData = datas.filter((banner) => banner._id !== bannerId)
            datas.splice(0, datas.length, ...updatedData) // Update parent state
            onBannerDeleted()
            Swal.fire("Deleted!", response.message || "Banner deleted successfully.", "success")
          } else {
            Swal.fire("Error!", response.message || "Deletion failed.", "error")
          }
        } catch (error) {
          Swal.fire("Error!", "Failed to delete banner.", "error")
        }
      }
    })
  }

  const rowsPerPage = 10

  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredData.slice(start, start + rowsPerPage)
  }, [filteredData, currentPage, rowsPerPage])

  triggerDownloadExcel.current = onDownload
  triggerDownloadPDF.current = exportToPDF

  const memoizedBannerList = useMemo(() => {
    return currentData.map((data, index) => (
      <tr key={data._id}>
        <td>{index + 1}</td>
        <td>{data.bannerId || "N/A"}</td>
        <td>{data.name || "N/A"}</td>
        <td>{data.banner_image ? <ImagePreview image={`${IMAGE_BASE_URL}${data.banner_image}`} /> : "N/A"}</td>
        <td>{data.from_date ? new Date(data.from_date).toLocaleDateString() : "N/A"}</td>
        <td>{data.expiry_date ? new Date(data.expiry_date).toLocaleDateString() : "N/A"}</td>
        <td>{new Date(data.createdAt).toLocaleDateString()}</td>
        <td>{new Date(data.updatedAt).toLocaleDateString()}</td>
        <td className="d-flex align-items-center">
          <div className="dropdown">
            <a href="#" className="btn-action-icon" data-bs-toggle="dropdown">
              <i className="fas fa-ellipsis-v" />
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <button
                  className="dropdown-item"
                  onClick={(e) => {
                    e.preventDefault()
                    handleEdit(data)
                  }}
                >
                  <i className="far fa-edit me-2" /> View
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={(e) => {
                    e.preventDefault()
                    handleDelete(data._id)
                  }}
                >
                  <i className="far fa-trash-alt me-2" /> Delete
                </button>
              </li>
            </ul>
          </div>
        </td>
      </tr>
    ))
  }, [currentData])

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
                  placeholder="Search by promo code, service or discount"
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
                          <div
                            className="spinner-border text-primary"
                            role="status"
                            style={{ width: "3rem", height: "3rem" }}
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          <div className="mt-2">Loading Banners...</div>
                        </td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={tableHeaders.length} className="text-center py-5">
                          <div className="d-flex flex-column align-items-center text-muted">
                            <i className="fa fa-box-open mb-3" style={{ fontSize: "2rem", color: "#adb5bd" }}></i>
                            <h6 className="mb-1" style={{ fontWeight: 600 }}>
                              No Banners Found
                            </h6>
                            <p style={{ fontSize: "0.9rem", color: "#6c757d", margin: 0 }}>Add a new banner.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      memoizedBannerList
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-muted">
                  Total Records: <span className="fw-bold text-primary">{filteredData.length}</span>
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

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <li
                        key={pageNum}
                        className={`page-item ${pageNum === currentPage ? "active" : ""}`}
                        aria-current={pageNum === currentPage ? "page" : undefined}
                      >
                        <button className="page-link" onClick={() => setCurrentPage(pageNum)}>
                          {pageNum}
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
        <div className="modal fade show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">View Banner</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowEditModal(false)}
                  disabled={editLoading}
                ></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  {editLoading ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Banner Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={editFormData.name}
                          onChange={handleInputChange}
                          required
                          disabled
                        />
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">From Date</label>
                          <input
                            type="date"
                            className="form-control"
                            name="from_date"
                            value={editFormData.from_date}
                            onChange={handleInputChange}
                            required
                            disabled
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Expiry Date</label>
                          <input
                            type="date"
                            className="form-control"
                            name="expiry_date"
                            value={editFormData.expiry_date}
                            onChange={handleInputChange}
                            required
                            disabled
                          />
                        </div>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Banner Image</label>
                        {editFormData.banner_image && (
                          <img
                            src={`${IMAGE_BASE_URL}${editFormData.banner_image}`}
                            alt="Banner Preview"
                            className="img-thumbnail mt-2"
                            style={{ maxHeight: "200px", width: "100%", objectFit: "contain" }}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default BannerTable

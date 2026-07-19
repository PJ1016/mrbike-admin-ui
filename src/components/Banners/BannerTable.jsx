"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Swal from "sweetalert2"
import { useDownloadExcel } from "react-export-table-to-excel"
import jsPDF from "jspdf"
import "jspdf-autotable"
import ImagePreview from "../Global/ImagePreview"
import { deleteBanner, updateBanner, getBaseServiceList } from "../../api"

const IMAGE_BASE_URL = process.env.REACT_APP_IMAGE_BASE_URL

const GOOGLE_MAPS_KEY = "AIzaSyCM15ry8lewwj6YZ-04_m7Z58dsQo_hBBA"

const loadGoogleMapsScript = (onReady) => {
  if (window.google?.maps?.places) { onReady(); return }
  if (document.querySelector("script[data-gmaps]")) {
    const wait = setInterval(() => {
      if (window.google?.maps?.places) { clearInterval(wait); onReady() }
    }, 100)
    return
  }
  window.__gmapsCallback = () => { delete window.__gmapsCallback; onReady() }
  const script = document.createElement("script")
  script.setAttribute("data-gmaps", "1")
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=__gmapsCallback`
  script.async = true
  document.head.appendChild(script)
}

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
    baseServiceId: "",
    locationType: "all",
    placeId: "",
    placeName: "",
    latitude: "",
    longitude: "",
    radius: "",
    displayOrder: "0",
  })
  const [editLoading, setEditLoading] = useState(false)
  const [services, setServices] = useState([])
  const [editLocationQuery, setEditLocationQuery] = useState("")
  const [googleReady, setGoogleReady] = useState(!!window.google?.maps?.places)
  const editSearchInputRef = useRef(null)
  const editAutocompleteRef = useRef(null)

  useEffect(() => {
    getBaseServiceList()
      .then((res) => { if (res?.data) setServices(res.data) })
      .catch(() => {})
  }, [])

  // Load Google Maps only when the modal is open and "Specific" location is selected
  useEffect(() => {
    if (!showEditModal || editFormData.locationType !== "specific") {
      editAutocompleteRef.current = null
      return
    }
    loadGoogleMapsScript(() => setGoogleReady(true))
  }, [showEditModal, editFormData.locationType])

  useEffect(() => {
    if (!googleReady || !showEditModal || editFormData.locationType !== "specific" || !editSearchInputRef.current || editAutocompleteRef.current) return
    editAutocompleteRef.current = new window.google.maps.places.Autocomplete(
      editSearchInputRef.current,
      { fields: ["place_id", "geometry", "name", "formatted_address"] }
    )
    editAutocompleteRef.current.addListener("place_changed", () => {
      const place = editAutocompleteRef.current.getPlace()
      if (!place?.geometry) return
      const name = place.name || editSearchInputRef.current.value
      setEditLocationQuery(name)
      setEditFormData((prev) => ({
        ...prev,
        placeId: place.place_id || "",
        placeName: name,
        latitude: String(place.geometry.location.lat()),
        longitude: String(place.geometry.location.lng()),
      }))
    })
  }, [googleReady, showEditModal, editFormData.locationType])

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
      baseServiceId: banner.baseServiceId?._id || banner.baseServiceId || "",
      locationType: banner.locationType || "all",
      placeId: banner.placeId || "",
      placeName: banner.placeName || "",
      latitude: banner.latitude != null ? String(banner.latitude) : "",
      longitude: banner.longitude != null ? String(banner.longitude) : "",
      radius: banner.radius != null ? String(banner.radius) : "",
      displayOrder: banner.displayOrder != null ? String(banner.displayOrder) : "0",
    })
    setEditLocationQuery(banner.placeName || "")
    setShowEditModal(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditFormData((prev) => {
      const updated = { ...prev, [name]: value }
      if (name === "locationType" && value === "all") {
        updated.placeId = ""
        updated.placeName = ""
        updated.latitude = ""
        updated.longitude = ""
        updated.radius = ""
      }
      return updated
    })
    if (name === "locationType" && value === "all") setEditLocationQuery("")
  }

  const handleEditLocationQueryChange = (e) => {
    const val = e.target.value
    setEditLocationQuery(val)
    if (!val.trim()) {
      setEditFormData((prev) => ({ ...prev, placeId: "", placeName: "", latitude: "", longitude: "" }))
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (editFormData.locationType === "specific") {
      const { placeName, latitude, longitude, radius } = editFormData
      if (!placeName || !latitude || !longitude || !radius || isNaN(Number(radius)) || Number(radius) <= 0) {
        Swal.fire("Error!", "Please select a location and enter a valid radius.", "error")
        return
      }
    }

    setEditLoading(true)
    try {
      await updateBanner(editFormData._id, {
        name: editFormData.name,
        banner_image: editFormData.banner_image,
        from_date: editFormData.from_date,
        expiry_date: editFormData.expiry_date,
        baseServiceId: editFormData.baseServiceId,
        locationType: editFormData.locationType,
        placeId: editFormData.placeId,
        placeName: editFormData.placeName,
        latitude: editFormData.latitude,
        longitude: editFormData.longitude,
        radius: editFormData.radius,
        displayOrder: editFormData.displayOrder,
      })
      setShowEditModal(false)
      onBannerDeleted() // Refresh the list
    } catch (error) {
      // error Swal already shown by updateBanner()
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
        <td>{data.baseServiceId?.name || "N/A"}</td>
        <td>{data.displayOrder ?? 0}</td>
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

                      <div className="mb-3">
                        <label className="form-label">Linked Service (optional)</label>
                        <select
                          className="form-control"
                          name="baseServiceId"
                          value={editFormData.baseServiceId}
                          onChange={handleInputChange}
                        >
                          <option value="">-- No Service Linked --</option>
                          {services.map((s) => (
                            <option key={s._id} value={s._id}>{s.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-3">
                        <label className="form-label">Location Type</label>
                        <select
                          className="form-control"
                          name="locationType"
                          value={editFormData.locationType}
                          onChange={handleInputChange}
                        >
                          <option value="all">All Locations</option>
                          <option value="specific">Specific Location</option>
                        </select>
                      </div>

                      {editFormData.locationType === "specific" && (
                        <div className="mb-3 border rounded p-3">
                          <label className="form-label">Search Location</label>
                          <input
                            ref={editSearchInputRef}
                            type="text"
                            className="form-control mb-2"
                            placeholder={googleReady ? "Type to search a place..." : "Loading Google Maps..."}
                            value={editLocationQuery}
                            onChange={handleEditLocationQueryChange}
                            disabled={!googleReady}
                          />
                          <div className="row">
                            <div className="col-md-4 mb-2">
                              <label className="form-label">Latitude</label>
                              <input type="text" className="form-control" value={editFormData.latitude} readOnly />
                            </div>
                            <div className="col-md-4 mb-2">
                              <label className="form-label">Longitude</label>
                              <input type="text" className="form-control" value={editFormData.longitude} readOnly />
                            </div>
                            <div className="col-md-4 mb-2">
                              <label className="form-label">Radius (km)</label>
                              <input
                                type="number"
                                name="radius"
                                className="form-control"
                                value={editFormData.radius}
                                onChange={handleInputChange}
                                min="0.1"
                                step="0.5"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        <label className="form-label">Display Order</label>
                        <input
                          type="number"
                          name="displayOrder"
                          className="form-control"
                          value={editFormData.displayOrder}
                          onChange={handleInputChange}
                          min="0"
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                    disabled={editLoading}
                  >
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save Changes"}
                  </button>
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

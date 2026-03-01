"use client"

import { useState, useEffect } from "react"
import Swal from "sweetalert2"
import {
  addService,
  getBikeCompanies,
  filterBikesByCompaniesMultiple,
  getDealerList,
  getBaseServiceList,
  getAdminServiceById,
  updateAdminService,
} from "../../api"
import { useNavigate } from "react-router-dom"

const ServiceForm = ({ serviceId }) => {
  const navigate = useNavigate()
  const isEditMode = !!serviceId
  const [isLoading, setIsLoading] = useState(isEditMode)

  const [formData, setFormData] = useState({
    base_service_id: "",
    description: "",
  })

  const [baseServices, setBaseServices] = useState([])
  const [bikes, setBikes] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedCompanies, setSelectedCompanies] = useState([])
  const [dealers, setDealers] = useState([])
  const [filteredDealers, setFilteredDealers] = useState([])
  const [dealerSearchTerm, setDealerSearchTerm] = useState("")
  const [selectedDealer, setSelectedDealer] = useState("")
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBaseService, setSelectedBaseService] = useState(null)
  const [showDealerDropdown, setShowDealerDropdown] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        const baseServicesResponse = await getBaseServiceList()
        setBaseServices(baseServicesResponse?.data || [])

        const companiesResponse = await getBikeCompanies()
        setCompanies(companiesResponse?.data || [])

        const dealersResponse = await getDealerList()
        setDealers(dealersResponse?.data || [])

        if (isEditMode) {
          const serviceResponse = await getAdminServiceById(serviceId)
          console.log("[v0] Service response:", serviceResponse)

          if (serviceResponse?.data || serviceResponse?.status === true) {
            const serviceData = serviceResponse.data
            console.log("[v0] Service data loaded:", serviceData)

           const baseServiceId =
  typeof serviceData.base_service_id === "string"
    ? serviceData.base_service_id
    : serviceData.base_service_id?._id || ""

setFormData({
  base_service_id: baseServiceId,
  description: serviceData.description || "",
})


            const dealerId = (serviceData.dealer || serviceData.dealers)
              ? (typeof (serviceData.dealer || serviceData.dealers) === "string"
                  ? (serviceData.dealer || serviceData.dealers)
                  : (serviceData.dealer || serviceData.dealers)?._id || "")
              : ""

setSelectedDealer(dealerId)

            const companyIds = (serviceData.companies || []).map(c =>
  typeof c === "string" ? c : c._id
)
setSelectedCompanies(companyIds)


            if (serviceData.companies && serviceData.companies.length > 0) {
const companyIds = serviceData.companies.map((c) =>
  typeof c === "string" ? c : c._id
)

const bikesResponse = await filterBikesByCompaniesMultiple(companyIds)

              if (bikesResponse?.data && Array.isArray(bikesResponse.data)) {
                const allBikes = bikesResponse.data.map((item) => ({
                  company_name: item.company_name,
                  model_name: item.model_name,
                  variant_name: item.variant_name,
                  cc: item.engine_cc,
                  price: null,
                  model_id: item.model_id,
                  variant_id: item.variant_id,
                }))

const mergedBikes = allBikes.map((bike) => {
  const existingBike = serviceData.bikes.find(
    (sb) =>
      (sb.model_id?._id || sb.model_id) === bike.model_id &&
      (sb.variant_id?._id || sb.variant_id) === bike.variant_id
  )

  return {
    ...bike,
    _id: existingBike?._id,
    price: existingBike?.price || null,
  }
})
mergedBikes.sort((a, b) => {
  if (a.price && !b.price) return -1
  if (!a.price && b.price) return 1
  return 0
})


                setBikes(mergedBikes)
              }
            } else {
              const transformedBikes = serviceData.bikes.map((bike) => ({
                _id: bike._id,
                company_name: "Unknown Company",
                model_name: bike.model_id?.model_name || "",
                variant_name: bike.variant_id?.variant_name || "",
                cc: bike.cc,
                price: bike.price || null,
                model_id: bike.model_id?._id || bike.model_id || "",
                variant_id: bike.variant_id?._id || bike.variant_id || "",
              }))
              setBikes(transformedBikes)
            }

            const baseServicesList = baseServicesResponse?.data || []
const selectedService = baseServicesResponse.data.find(
  (s) => s._id === baseServiceId
)
setSelectedBaseService(selectedService || null)
          } else {
            console.error("[v0] Failed to load service data:", serviceResponse)
            Swal.fire({
              icon: "error",
              title: "Error",
              text: "Failed to load service details. Redirecting...",
            })
            setTimeout(() => navigate("/services"), 2000)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        if (isEditMode) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to load service data: " + error.message,
          })
          setTimeout(() => navigate("/services"), 2000)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [serviceId, isEditMode, navigate])

  useEffect(() => {
    const fetchBikeDetails = async () => {
      if (selectedCompanies.length === 0) {
        if (!isEditMode || bikes.length === 0) {
          setBikes([])
        }
        return
      }

      try {
        const response = await filterBikesByCompaniesMultiple(selectedCompanies)

        if (response?.data && Array.isArray(response.data)) {
          const bikeRows = response.data.map((item) => ({
            company_name: item.company_name,
            model_name: item.model_name,
            variant_name: item.variant_name,
            cc: item.engine_cc,
            price: null,
            model_id: item.model_id,
            variant_id: item.variant_id,
          }))

setBikes((prevBikes) => {
  const map = new Map()

  // keep existing (with price)
  prevBikes.forEach((b) => {
    const key = `${b.model_id}_${b.variant_id}`
    map.set(key, b)
  })

  // add missing bikes
  bikeRows.forEach((b) => {
    const key = `${b.model_id}_${b.variant_id}`
    if (!map.has(key)) {
      map.set(key, b)
    }
  })

  const merged = Array.from(map.values())

  // ✅ SORT: priced bikes first
  merged.sort((a, b) => {
    if (a.price && !b.price) return -1
    if (!a.price && b.price) return 1
    return 0
  })

  return merged
})

        } else {
          setBikes([])
        }
      } catch (error) {
        console.error("Failed to fetch bike details", error)
        setBikes([])
      }
    }

    fetchBikeDetails()
  }, [selectedCompanies])

  const validate = () => {
    const errors = {}

    if (!formData.base_service_id) {
      errors.base_service_id = "Please select a base service"
    }

    if (!formData.description || formData.description.trim() === "") {
      errors.description = "Please enter a description"
    }

    if (selectedCompanies.length === 0) {
      errors.companies = "Please select at least one company"
    }

    if (selectedDealer === "" || !selectedDealer) {
      errors.dealer = "Please select a dealer"
    }

    const invalidBikes = bikes.filter(
      (bike) => bike.price !== null && bike.price !== "" && (isNaN(bike.price) || Number.parseFloat(bike.price) <= 0),
    )
    if (invalidBikes.length > 0) {
      errors.bikes = "Please enter valid positive prices for bikes"
    }

    const bikesWithPrice = bikes.filter(
      (bike) => bike.price !== null && bike.price !== "" && Number.parseFloat(bike.price) > 0,
    )
    if (bikesWithPrice.length === 0) {
      errors.noPrices = "At least one bike must have a valid price"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })

    if (name === "base_service_id" && value) {
      const service = baseServices.find((s) => s._id === value)
      setSelectedBaseService(service || null)
    } else if (name === "base_service_id" && !value) {
      setSelectedBaseService(null)
    }
  }

  const handleCompanyToggle = (companyId) => {
    setSelectedCompanies((prev) => {
      if (prev.includes(companyId)) {
        return prev.filter((id) => id !== companyId)
      } else {
        return [...prev, companyId]
      }
    })
  }

  const handleDealerSelect = (dealerId) => {
    setSelectedDealer(dealerId)
  }

  // Handle dealer search
  const handleDealerSearch = (e) => {
    const searchValue = e.target.value.toLowerCase()
    setDealerSearchTerm(searchValue)

    if (searchValue.trim() === "") {
      setFilteredDealers(dealers)
    } else {
      const filtered = dealers.filter((dealer) => {
        const shopName = (dealer.shopName || "").toLowerCase()
        const ownerName = (dealer.ownerName || "").toLowerCase()
        const phone = (dealer.phone || "").toLowerCase()
        const city = (dealer.city || "").toLowerCase()

        return (
          shopName.includes(searchValue) ||
          ownerName.includes(searchValue) ||
          phone.includes(searchValue) ||
          city.includes(searchValue)
        )
      })
      setFilteredDealers(filtered)
    }
  }

  // Update filtered dealers when dealers list changes
  useEffect(() => {
    setFilteredDealers(dealers)
  }, [dealers])

  const handleBikePriceChange = (index, value) => {
    const updatedBikes = [...bikes]
    updatedBikes[index].price = value === "" ? null : Number(value)
    setBikes(updatedBikes)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormErrors({})

    const isValid = validate()
    if (!isValid) return

    setIsSubmitting(true)

    const bikesForSubmission = bikes
      .filter((bike) => bike.price !== null && bike.price !== "")
      .map((bike) => {
        const bikeObj = {
          model_id: bike.model_id || null,
          variant_id: bike.variant_id || null,
          cc: Number(bike.cc),
          price: Number(bike.price),
        }
        if (bike._id) {
          bikeObj._id = bike._id
        }
        return bikeObj
      })

    const formPayload = {
      base_service_id: formData.base_service_id,
      description: formData.description,
      companies: JSON.stringify(selectedCompanies),
      dealer_id: selectedDealer,
      bikes: JSON.stringify(bikesForSubmission),
    }

    try {
      let response

      if (isEditMode) {
        response = await updateAdminService(serviceId, formPayload)
      } else {
        response = await addService(formPayload)
      }

      if (response?.status === true || response?.status === 200) {
        Swal.fire({
          title: "Success!",
          text: response.message || `Admin service ${isEditMode ? "updated" : "added"} successfully.`,
          icon: "success",
        })
        navigate("/services")
      }
    } catch (error) {
      const err = error.response?.data
      Swal.fire({
        title: "Error!",
        text: err?.message || "Something went wrong!",
        icon: "error",
      })

      if (err?.field) {
        setFormErrors((prev) => ({ ...prev, [err.field]: err.message }))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="row">
      <div className="col-sm-12">
        <div className="card-table card p-3">
          <div className="card-body">
            <form className="form-horizontal" onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <h5 className="mb-3">{isEditMode ? "Edit Admin Service" : "Create Admin Service"}</h5>

                  <div className="input-block mb-3">
                    <label className="form-control-label">Base Service *</label>
                    <select
                      className={`form-control ${formErrors.base_service_id ? "is-invalid" : ""}`}
                      name="base_service_id"
                      value={formData.base_service_id}
                      onChange={handleChange}
                    >
                      <option value="">-- Select Base Service --</option>
                      {baseServices.map((service) => (
                        <option key={service._id} value={service._id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.base_service_id && <div className="invalid-feedback">{formErrors.base_service_id}</div>}
                  </div>

                  <div className="input-block mb-3">
                    <label className="form-control-label">Description *</label>
                    <textarea
                      className={`form-control ${formErrors.description ? "is-invalid" : ""}`}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter service description"
                      rows="4"
                    />
                    {formErrors.description && <div className="invalid-feedback">{formErrors.description}</div>}
                  </div>

                  {selectedBaseService && (
                    <div className="input-block mb-3">
                      <label className="form-control-label">Base Service Image</label>
                      <div className="border rounded p-3 text-center" style={{ background: "#f8f9fa" }}>
                        <img
                          src={`${process.env.REACT_APP_IMAGE_BASE_URL}${selectedBaseService.image}`}
                          alt={selectedBaseService.name}
                          style={{
                            maxWidth: "200px",
                            maxHeight: "200px",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            padding: "5px",
                            objectFit: "contain",
                          }}
                        />
                        <div className="mt-2 small text-muted">
                          <p className="mb-1">
                            <strong>{selectedBaseService.name}</strong>
                          </p>
                          <p className="mb-0">Service Image Preview</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <div className="mb-4">
                    <h5 className="mb-3">Select Dealers</h5>
                    <div className="input-block mb-2">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by shop name, owner, phone, or city..."
                        value={dealerSearchTerm}
                        onChange={handleDealerSearch}
                        onFocus={() => setShowDealerDropdown(true)}
                      />
                    </div>
                    <div
                      className="company-selection-list border rounded p-3"
                      style={{ maxHeight: "250px", overflowY: "auto", background: "#fdfdfd" }}
                    >
                      {filteredDealers.length > 0 ? (
                        filteredDealers.map((dealer) => (
                          <div key={dealer._id} className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="radio"
                              id={`dealer-${dealer._id}`}
                              name="dealer"
                              value={dealer._id}
                              checked={selectedDealer === dealer._id}
                              onChange={() => handleDealerSelect(dealer._id)}
                            />
                            <label className="form-check-label" htmlFor={`dealer-${dealer._id}`}>
                              {dealer.shopName || dealer.name}
                              {dealer.city && <span className="text-muted ms-2">({dealer.city})</span>}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted">
                          {dealerSearchTerm ? "No dealers found matching your search" : "No dealers available"}
                        </div>
                      )}
                    </div>
                    {formErrors.dealer && <div className="text-danger mt-1 small">{formErrors.dealer}</div>}
                  </div>

                  <h5 className="mb-3">Select Companies</h5>

                  <div className="input-block mb-3">
                    <div
                      className="company-selection-list border rounded p-3"
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      {companies.map((company) => (
                        <div key={company._id} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`company-${company._id}`}
                            checked={selectedCompanies.includes(company._id)}
                            onChange={() => handleCompanyToggle(company._id)}
                          />
                          <label className="form-check-label" htmlFor={`company-${company._id}`}>
                            {company.name}
                          </label>
                        </div>
                      ))}
                    </div>
                    {formErrors.companies && <div className="text-danger mt-1 small">{formErrors.companies}</div>}
                  </div>
                </div>
              </div>

              {bikes.length > 0 && (
                <div className="row mt-4">
                  <div className="col-12">
                    <hr className="my-3" />
                    <h5 className="mb-3">Bike Models & Pricing</h5>
                    <div className="alert alert-info small mb-3">
                      <strong>Note:</strong> Company, Model, Variant, and CC are auto-filled. Please enter the price for
                      each bike. Leave price empty to exclude a bike.
                    </div>

                    <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
                      <table className="table table-bordered table-hover">
                        <thead className="table-light sticky-top">
                          <tr>
                            <th>#</th>
                            <th>Company</th>
                            <th>Model</th>
                            <th>Variant</th>
                            <th>Engine CC</th>
                            <th>Price (₹)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bikes.map((bike, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td className="fw-bold">{bike.company_name}</td>
                              <td>{bike.model_name}</td>
                              <td>{bike.variant_name}</td>
                              <td>{bike.cc} CC</td>
                              <td>
                                <input
                                  type="number"
                                  className={`form-control ${formErrors[`bike_price_${index}`] ? "is-invalid" : ""}`}
                                  placeholder="Enter price (optional)"
                                  value={bike.price || ""}
                                  onChange={(e) => handleBikePriceChange(index, e.target.value)}
                                />
                                {formErrors[`bike_price_${index}`] && (
                                  <div className="invalid-feedback">{formErrors[`bike_price_${index}`]}</div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {formErrors.noPrices && <div className="text-danger mt-2">{formErrors.noPrices}</div>}
                    {formErrors.bikes && <div className="text-danger mt-2">{formErrors.bikes}</div>}
                  </div>
                </div>
              )}

              <div className="text-end mt-3">
                <button className="btn btn-primary px-5" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : isEditMode ? "Update Service" : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceForm

import axios from "axios";
import Swal from "sweetalert2";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://api.mrbikedoctor.cloud/bikedoctor";

// test

const getAuthToken = () => localStorage.getItem("adminToken");

const apiRequest = async (
  method,
  endpoint,
  data = {},
  showAlert = true,
  requiresAuth = true,
) => {
  try {
    const headers = {};

    if (requiresAuth) {
      const token = getAuthToken();
      if (token) headers["token"] = token;
    }

    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      headers,
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message);

    if (requiresAuth && error.response?.status === 401) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please log in again.",
      });
      localStorage.removeItem("token");
    }

    if (showAlert) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Something went wrong!",
      });
    }

    throw error;
  }
};

export const loginUser = (email, password) =>
  apiRequest(
    "POST",
    "/adminauth/suadminLogin",
    { email, password },
    true,
    false,
  );

export const createUser = (userData) =>
  apiRequest("POST", "/adminauth/subadminsignup", userData);

export const getAdmins = () =>
  apiRequest("GET", "/adminauth/getalladmin", {}, false);

export const deleteAdmin = (adminId) =>
  apiRequest("DELETE", `/adminauth/deleteadmin/${adminId}`, {
    admin_id: adminId,
  });

export const addDealer = async (dealerData) => {
  try {
    console.log("Dealer data here api section:-", dealerData);

    const response = await axios.post(
      `${API_BASE_URL}/dealer/addDealer`,
      dealerData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(),
        },
      },
    );

    Swal.fire({
      icon: "success",
      title: "Dealer Added Successfully!",
      text: response.data.message || "The dealer has been created.",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error adding dealer:",
      error.response?.data || error.message,
    );
    Swal.fire({
      icon: "error",
      title: "Failed to Add Dealer",
      text: error.response?.data?.message || "Something went wrong!",
    });

    throw error;
  }
};

export const updateDealer = async (formData) => {
  try {
    console.log("Form data:", formData);

    const response = await axios.put(
      `${API_BASE_URL}/dealer/editDealer`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(),
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error updating dealer:",
      error.response?.data || error.message,
    );

    Swal.fire({
      icon: "error",
      title: "Failed to Update Dealer",
      text: error.response?.data?.message || "Something went wrong!",
    });

    throw error;
  }
};

export const getDealerList = () =>
  apiRequest("GET", "/dealer/dealerList", {}, false);

export const getAllDealersWithVerifyFalse = () =>
  apiRequest("GET", "/dealer/dealersWithVerifyFalse", {}, false);

export const getAllDealersWithDocFalse = () =>
  apiRequest("GET", "/dealer/dealersWithDocFalse", {}, false);

export const updateDealerVerification = async (dealerId) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/dealer/updateVerification`,
      { id: dealerId },
      {
        headers: {
          "Content-Type": "application/json",
          token: getAuthToken(), // Pass token in headers
        },
      },
    );

    return response;
  } catch (error) {
    console.error(
      "Error updating dealer:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const updateDealerDocStatus = async (dealerId) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/dealer/updateDocStatus`,
      { id: dealerId },
      {
        headers: {
          "Content-Type": "application/json",
          token: getAuthToken(), // Pass token in headers
        },
      },
    );

    return response;
  } catch (error) {
    console.error(
      "Error updating dealer:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getCustomerList = () =>
  apiRequest("GET", "/customers/customerlist", {}, false);

export const getCustomerById = (id) =>
  apiRequest("GET", `/customers/view/${id}`, {}, false);

export const getAllBookings = () =>
  apiRequest("GET", "/bookings/getallbookings", {}, false);

export const getAllPayment = () =>
  apiRequest("GET", "/payment/all-payments", {}, false);

export const addBikeCompany = (data) =>
  apiRequest("POST", "/bike/add-bike-company", data, true, true);

export const addBikeModel = (data) =>
  apiRequest("POST", "/bike/add-bike-model", data, true, true);

export const addBikeVariant = (data) =>
  apiRequest("POST", "/bike/add-bike-variant", data, true, true);

// ✅ Fetch all bike companies (for dropdown)
export const getBikeCompanies = () =>
  apiRequest("GET", "/bike/get-bike-companies", {}, false);

// ✅ Fetch all bike models for a selected company (for dropdown)
export const getBikeModels = (companyId) =>
  apiRequest("GET", `/bike/get-bike-models/${companyId}`, {}, false);

// ✅ Fetch all bike variants for a selected model (for dropdown)
export const getBikeVariants = (modelId) =>
  apiRequest("GET", `/bike/get-bike-variants/${modelId}`, {}, false);

// ✅ Fetch all bikes
export const getBikes = () => apiRequest("GET", "/bike/bikes", {}, false);

// ✅ Fetch all CC list for a selected company
export const getCCListByCompany = (companyId) =>
  apiRequest("GET", `/bike/bikes/cc-by-company/${companyId}`, {}, false);

export const filterBikesByCompaniesMultiple = (companyIds) => {
  // Ensure we have a safe array to work with
  const safeIds = Array.isArray(companyIds) ? [...companyIds] : [companyIds];
  const queryString = safeIds.join(",");
  return apiRequest(
    "GET",
    `/bike/bikes/filter-by-company?companyIds=${queryString}`,
    {},
    false,
  );
};

export const deleteBike = async (bikeId) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(
      `${API_BASE_URL}/bike/deleteBike/${bikeId}`,
      {
        headers: {
          token: token,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error.message);

    const errorMessage =
      error.response?.data?.message || "Could not delete Bike";

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: errorMessage,
    });

    throw error;
  }
};

export const deleteBikeModel = async (modelId) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(
      `${API_BASE_URL}/bike/deleteBikeModel/${modelId}`,
      {
        headers: {
          token: token,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Delete model failed:", error.response?.data || error.message);

    const errorMessage =
      error.response?.data?.message || "Could not delete Bike Model";

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: errorMessage,
    });

    throw error;
  }
};

export const deleteBikeCompany = async (companyId) => {
  try {
    const token = getAuthToken();
    const response = await axios.delete(
      `${API_BASE_URL}/bike/deleteBikeCompany/${companyId}`,
      {
        headers: {
          token: token,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Delete company failed:", error.response?.data || error.message);

    const errorMessage =
      error.response?.data?.message || "Could not delete Bike Company";

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: errorMessage,
    });

    throw error;
  }
};

export const addService = async (serviceData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/service/adminservices/create`,
      serviceData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(),
        },
      },
    );

    Swal.fire({
      icon: "success",
      title: "Service Added Successfully!",
      text: response.data.message || "The service has been created.",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error adding service:",
      error.response?.data || error.message,
    );

    Swal.fire({
      icon: "error",
      title: "Failed to Add Service",
      text: error.response?.data?.message || "Something went wrong!",
    });

    throw error;
  }
};

export const AaddService = async (serviceData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/service/addservice`, // ✅ API base URL
      serviceData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(), // ✅ Ensure correct token header
        },
      },
    );

    // ✅ Show success message
    Swal.fire({
      icon: "success",
      title: "Service Added Successfully!",
      text: response.data.message || "The service has been created.",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error adding service:",
      error.response?.data || error.message,
    );

    // ✅ Show proper error message
    Swal.fire({
      icon: "error",
      title: "Failed to Add Service",
      text: error.response?.data?.message || "Something went wrong!",
    });

    throw error;
  }
};

// ✅ Updated getServiceList to use the new admin services endpoint and fixed duplicate exports
export const getServiceList = () =>
  apiRequest("GET", "/service/adminservices", {}, false);
export const getAdditionalServiceList = () =>
  apiRequest("GET", "/additional-service/admin/additional-services", {}, false);
export const getAServiceList = getServiceList;
export const getServices = getServiceList;

// Update Admin Service

export const deleteAdminService = async (serviceId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/service/admin/services/${serviceId}`,
      {
        headers: {
          token: getAuthToken(),
        },
      },
    );

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: response.data.message || "Admin service deleted successfully",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error.message);

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: error.response?.data?.message || "Could not delete admin service",
    });

    throw error;
  }
};

export const deleteService = async (serviceId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/service/deleteService`,
      {
        data: { service_id: serviceId }, // DELETE with body
        headers: {
          "Content-Type": "application/json", // Not multipart/form-data
          token: getAuthToken(),
        },
      },
    );

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: response.data.message || "Service deleted successfully",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error.message);

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: error.response?.data?.message || "Could not delete service",
    });

    throw error;
  }
};

export const addBanner = async (bannerData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/banner/addbanner`, // ✅ API base URL
      bannerData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(), // ✅ Ensure correct token header
        },
      },
    );

    // ✅ Show success message
    Swal.fire({
      icon: "success",
      title: "Banner Added Successfully!",
      text: response.data.message || "The banner has been created.",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error adding banner:",
      error.response?.data || error.message,
    );

    // ✅ Show proper error message
    Swal.fire({
      icon: "error",
      title: "Failed to Add Banner",
      text: error.response?.data?.message || "Something went wrong!",
    });

    throw error;
  }
};

// ✅ Fetch all banners
export const getBannerList = () =>
  apiRequest("GET", "/banner/bannerlist", {}, false);

export const deleteBanner = async (bannerId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/banner/deletebanner`, {
      data: { banner_id: bannerId }, // DELETE with body
      headers: {
        "Content-Type": "application/json", // Not multipart/form-data
        token: getAuthToken(),
      },
    });

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: response.data.message || "Banner deleted successfully",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error.message);

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: error.response?.data?.message || "Could not delete banner",
    });

    throw error;
  }
};

export const getAllRewards = () =>
  apiRequest("GET", "/reward/rewards", {}, false);

export const getOffers = () => apiRequest("GET", "/offer/offerlist", {}, false);

export const deleteOffers = async (offerId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/offer/deleteoffer`, {
      data: { offer_id: offerId }, // DELETE with body
      headers: {
        "Content-Type": "application/json", // Not multipart/form-data
        token: getAuthToken(),
      },
    });

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: response.data.message || "Offer deleted successfully",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error.message);

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: error.response?.data?.message || "Could not delete Offer",
    });

    throw error;
  }
};

export const editDealer = async (dealerData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/dealer/editDealer`,
      dealerData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(),
        },
      },
    );

    Swal.fire({
      icon: "success",
      title: "Dealer Updated Successfully!",
      text: response.data.message || "Dealer info has been updated.",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error updating dealer:",
      error.response?.data || error.message,
    );

    Swal.fire({
      icon: "error",
      title: "Failed to Update Dealer",
      text: error.response?.data?.message || "Something went wrong!",
    });

    throw error;
  }
};

export const deleteDealer = async (dealerId) => {
  try {
    console.log("Deleaer id", dealerId);

    const response = await axios.delete(`${API_BASE_URL}/dealer/deleteDealer`, {
      data: { dealer_id: dealerId },
      headers: {
        "Content-Type": "application/json",
        token: getAuthToken(),
      },
    });

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: response.data.message || "Dealer deleted successfully",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error.message);

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: error.response?.data?.message || "Could not delete dealer",
    });

    throw error;
  }
};

export const deleteCustomer = async (customerId) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/customers/deletecustomer`,
      {
        data: { customer_id: customerId }, // DELETE with body
        headers: {
          "Content-Type": "application/json",
          token: getAuthToken(),
        },
      },
    );

    Swal.fire({
      icon: "success",
      title: "Success!",
      text: response.data.message || "Customer deleted successfully",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error.message);

    Swal.fire({
      icon: "error",
      title: "Deletion Failed",
      text: error.response?.data?.message || "Could not delete customer",
    });

    throw error;
  }
};

export const getDealerPayouts = () =>
  apiRequest("GET", "/dealer/pending", {}, false);

export const approveDealerPayout = (orderId, status = "APPROVED") =>
  apiRequest("POST", "/payment/approvePayout", { orderId, status });

export const addOffer = async (offerData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/offer/addoffer`,
      offerData,
      {
        headers: {
          "Content-Type": "application/json",
          token: getAuthToken(),
        },
      },
    );

    Swal.fire({
      icon: "success",
      title: "Offer Added Successfully!",
      text: response.data.message || "The offer has been created.",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error("Error adding offer:", error.response?.data || error.message);

    Swal.fire({
      icon: "error",
      title: "Failed to Add Offer",
      text: error.response?.data?.message || "Something went wrong!",
    });

    throw error;
  }
};

export const getOfferById = async (id) =>
  apiRequest("GET", `/offer/Singleoffer/${id}`, {}, false);

export const editOffer = async (id, offerData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/offer/editoffer/${id}`,
      offerData,
      {
        headers: {
          "Content-Type": "application/json",
          token: getAuthToken(),
        },
      },
    );

    Swal.fire({
      icon: "success",
      title: "Offer Updated Successfully!",
      text: response.data.message || "The offer has been updated.",
      timer: 2000,
      showConfirmButton: false,
    });

    return response.data;
  } catch (error) {
    console.error(
      "Error updating offer:",
      error.response?.data || error.message,
    );

    Swal.fire({
      icon: "error",
      title: "Failed to Update Offer",
      text: error.response?.data?.message || "Something went wrong!",
    });

    throw error;
  }
};

export const updateOffer = editOffer;

export const getDealersVerify = () =>
  apiRequest("GET", "/dealerAuth/pending-registrations", {}, false);

export const approveDealer = (dealerId) =>
  apiRequest("PUT", `/dealerAuth/approve/${dealerId}`, {});

export const verifyDealerDocument = (dealerId, docType, status) =>
  apiRequest("PUT", `/dealerAuth/verify-document/${dealerId}`, { docType, status });

export const getAdminServiceById = (serviceId) =>
  apiRequest("GET", `/service/admin/services/${serviceId}`, {}, false);

export const updateAdminService = async (serviceId, serviceData) => {
  try {
    const token = getAuthToken();
    const dataToSend =
      typeof serviceData === "string" ? JSON.parse(serviceData) : serviceData;

    const response = await axios.put(
      `${API_BASE_URL}/service/admin/services/${serviceId}`,
      dataToSend,
      {
        headers: {
          "Content-Type": "application/json",
          token: token ? token : "",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error updating admin service:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getDealerById = async (id) => {
  const res = await apiRequest("GET", `/dealer/dealer/${id}`, {}, false);
  return res?.data || res;
};


export const getBaseServiceList = () =>
  apiRequest("GET", "/service/admin/base-services", {}, false);

export const createBaseService = async (serviceData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/service/admin/base-services`,
      serviceData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(),
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error creating base service:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const getBaseServiceById = (serviceId) =>
  apiRequest("GET", `/service/admin/base-services/${serviceId}`, {}, false);
export const updateBaseService = async (serviceId, serviceData) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/service/admin/base-services/${serviceId}`,
      serviceData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(),
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error updating base service:",
      error.response?.data || error.message,
    );
    throw error;
  }
};

export const deleteBaseService = async (serviceId, force = false, deactivate = false) => {
  try {
    let url = `${API_BASE_URL}/service/admin/base-services/${serviceId}`;
    const params = [];
    if (force) params.push("force=true");
    if (deactivate) params.push("deactivate=true");
    if (params.length > 0) url += `?${params.join("&")}`;

    const response = await axios.delete(url, {
      headers: {
        token: getAuthToken(),
      },
    });

    return response.data;
  } catch (error) {
    console.error("Delete failed:", error.response?.data || error.message);
    throw error;
  }
};

// --- Dealer Services Configuration ---

// ✅ Fetch all base additional services
export const getBaseAdditionalServiceList = () =>
  apiRequest("GET", "/base-additional-service", {}, false);

// ✅ Save dealer services configuration
export const saveDealerServices = (payload) =>
  apiRequest("POST", "/dealer/services", payload, true, true);

// Request cache for dealer services to prevent duplicate calls
const dealerServicesCache = new Map();
const dealerServicesRequests = new Map();

// ✅ Fetch dealer services configuration with caching
export const getDealerServices = async (dealerId) => {
  if (!dealerId) {
    throw new Error('Dealer ID is required');
  }

  const cacheKey = `dealer-services-${dealerId}`;
  const now = Date.now();
  const cacheTime = 3 * 60 * 1000; // 3 minutes cache

  // Check cache first
  const cached = dealerServicesCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < cacheTime) {
    return cached.data;
  }

  // Check if request is already in progress
  const existingRequest = dealerServicesRequests.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  // Make new request
  const requestPromise = apiRequest("GET", `/dealer/services?dealerId=${dealerId}`, {}, false, true)
    .then(data => {
      // Cache the result
      dealerServicesCache.set(cacheKey, {
        data,
        timestamp: now
      });
      
      // Remove from active requests
      dealerServicesRequests.delete(cacheKey);
      
      return data;
    })
    .catch(error => {
      // Remove from active requests on error
      dealerServicesRequests.delete(cacheKey);
      throw error;
    });

  // Store the request promise
  dealerServicesRequests.set(cacheKey, requestPromise);
  
  return requestPromise;
};

// Clear dealer services cache (useful for testing or forced refresh)
export const clearDealerServicesCache = (dealerId = null) => {
  if (dealerId) {
    const cacheKey = `dealer-services-${dealerId}`;
    dealerServicesCache.delete(cacheKey);
    dealerServicesRequests.delete(cacheKey);
  } else {
    dealerServicesCache.clear();
    dealerServicesRequests.clear();
  }
};

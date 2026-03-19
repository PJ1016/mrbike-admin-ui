import axios from "axios"
import Swal from "sweetalert2"

// const API_BASE_URL = "http://localhost:8001/bikedoctor"
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "https://api.mrbikedoctor.cloud/bikedoctor"

const getAuthToken = () => localStorage.getItem("adminToken")

const apiRequest = async (method, endpoint, data = {}, showAlert = true, requiresAuth = true) => {
  try {
    const headers = {}

    if (requiresAuth) {
      const token = getAuthToken()
      if (token) headers["token"] = token
    }

    const response = await axios({
      method,
      url: `${API_BASE_URL}${endpoint}`,
      data,
      headers,
    })
    return response.data
  } catch (error) {
    console.error("API Error:", error.response?.data || error.message)

    if (requiresAuth && error.response?.status === 401) {
      Swal.fire({
        icon: "warning",
        title: "Session Expired",
        text: "Please log in again.",
      })
      localStorage.removeItem("token")
    }

    if (showAlert) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.response?.data?.message || "Something went wrong!",
      })
    }

    throw error
  }
}

/**
 * BASE ADDITIONAL SERVICE API
 */

// Get all base additional services for dropdown
export const getBaseAdditionalServices = () =>
  apiRequest("GET", "/base-additional-service", {}, false)

export const createBaseAdditionalService = async (payload) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/base-additional-service`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(),
        },
      }
    )
    return response.data
  } catch (error) {
    console.error("Error creating base additional service:", error.response?.data || error.message)
    throw error
  }
}

// Get a single base additional service by ID
export const getBaseAdditionalServiceById = (id) =>
  apiRequest("GET", `/base-additional-service/${id}`, {}, false)

// Update a base additional service
export const updateBaseAdditionalService = async (id, payload) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/base-additional-service/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          token: getAuthToken(),
        },
      }
    )
    return response.data
  } catch (error) {
    console.error("Error updating base additional service:", error.response?.data || error.message)
    throw error
  }
}

// Delete a base additional service
export const deleteBaseAdditionalService = async (id, params = {}) => {
  try {
    const { force, deactivate } = params
    let url = `/base-additional-service/${id}`
    const query = []
    if (force) query.push("force=true")
    if (deactivate) query.push("deactivate=true")
    if (query.length > 0) url += `?${query.join("&")}`

    const response = await axios.delete(`${API_BASE_URL}${url}`, {
      headers: {
        token: getAuthToken(),
      },
    })
    return response.data
  } catch (error) {
    console.error("Error deleting base additional service:", error.response?.data || error.message)
    throw error
  }
}

/**
 * ADMIN ADDITIONAL SERVICE API
 */

// Create a new additional service
export const createAdditionalService = async (payload) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/additional-service/admin/additional-services`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          token: getAuthToken(),
        },
      }
    )
    return response.data
  } catch (error) {
    console.error("Error creating additional service:", error.response?.data || error.message)
    throw error
  }
}

// Get all additional services
export const getAdditionalServices = () =>
  apiRequest("GET", "/additional-service/admin/additional-services", {}, false)

// Get a single additional service by ID
export const getAdditionalServiceById = (id) =>
  apiRequest("GET", `/additional-service/admin/additional-services/${id}`, {}, false)

// Update an additional service
export const updateAdditionalService = async (id, payload) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/additional-service/admin/additional-services/${id}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          token: getAuthToken(),
        },
      }
    )
    return response.data
  } catch (error) {
    console.error("Error updating additional service:", error.response?.data || error.message)
    throw error
  }
}

// Delete an additional service
export const deleteAdditionalService = async (id) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/additional-service/admin/additional-services/${id}`,
      {
        headers: {
          token: getAuthToken(),
        },
      }
    )
    return response.data
  } catch (error) {
    console.error("Error deleting additional service:", error.response?.data || error.message)
    throw error
  }
}

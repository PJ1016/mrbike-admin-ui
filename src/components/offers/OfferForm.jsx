// import React, { useState, useEffect } from "react";
// import Swal from "sweetalert2";
// import { addOffer, getServiceList } from "../../api";
// import { useNavigate } from "react-router-dom";

// const OfferForm = () => {
//   const [formData, setFormData] = useState({
//     service_id: "",
//     promo_code: "",
//     start_date: "",
//     end_date: "",
//     discount: "",
//     minorderamt: "",
//   });
//   const navigate = useNavigate()
//   const [errors, setErrors] = useState({});
//   const [services, setServices] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     const fetchServices = async () => {
//       try {
//         const res = await getServiceList();
//         setServices(res.data || []);
//       } catch (err) {
//         console.error("Failed to load services", err);
//       }
//     };
//     fetchServices();
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const validate = () => {
//     const newErrors = {};
//     const { service_id, promo_code, start_date, end_date, discount, minorderamt } = formData;

//     // Service Validation
//     if (!service_id) {
//       newErrors.service_id = "Please select a service";
//     }

//     // Promo Code Validation
//     if (!promo_code.trim()) {
//       newErrors.promo_code = "Promo code is required";
//     } else {
//       if (promo_code.length < 3 || promo_code.length > 15) {
//         newErrors.promo_code = "Must be 3-15 characters";
//       }
//       if (!/^[a-zA-Z0-9]+$/.test(promo_code)) {
//         newErrors.promo_code = "Only letters and numbers allowed";
//       }
//     }

//     // Date Validation
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     // Normalize start date if present
//     const startDateObj = start_date ? new Date(start_date) : null;
//     if (startDateObj) startDateObj.setHours(0, 0, 0, 0);

//     // Normalize end date if present
//     const endDateObj = end_date ? new Date(end_date) : null;
//     if (endDateObj) endDateObj.setHours(0, 0, 0, 0);

//     // Start Date
//     if (!start_date) {
//       newErrors.start_date = "Start date is required.";
//     } else if (startDateObj < today) {
//       newErrors.start_date = "Start date cannot be before today.";
//     }

//     // End Date
//     if (!end_date) {
//       newErrors.end_date = "End date is required.";
//     } else if (start_date && endDateObj <= startDateObj) {
//       newErrors.end_date = "End date must be after start date.";
//     }

//     // Discount Validation
//     const discountValue = Number(discount);
//     if (!discount) {
//       newErrors.discount = "Discount is required";
//     } else if (isNaN(discountValue)) {
//       newErrors.discount = "Must be a number";
//     } else if (discountValue < 1 || discountValue > 100) {
//       newErrors.discount = "Must be between 1% and 100%";
//     }

//     // Minimum Order Amount Validation
//     const minOrderValue = Number(minorderamt);
//     if (minorderamt === "") {
//       newErrors.minorderamt = "Required field";
//     } else if (isNaN(minOrderValue)) {
//       newErrors.minorderamt = "Must be a number";
//     } else if (minOrderValue < 0) {
//       newErrors.minorderamt = "Cannot be negative";
//     } else if (minOrderValue % 1 !== 0) {
//       newErrors.minorderamt = "Whole numbers only";
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!validate()) {
//       return;
//     }

//     setLoading(true);
//     try {
//       // Create payload with proper number values
//       const payload = {
//         ...formData,
//         discount: Number(formData.discount),
//         minorderamt: Number(formData.minorderamt),
//       };

//       const response = await addOffer(payload);

//       Swal.fire({
//         title: "Success!",
//         text: response.message || "Offer created successfully",
//         icon: "success",
//       });

//       setFormData({
//         service_id: "",
//         promo_code: "",
//         start_date: "",
//         end_date: "",
//         discount: "",
//         minorderamt: "",
//       });
//       setErrors({});
//       navigate("/offers")
//     } catch (error) {
//       Swal.fire({
//         title: "Error!",
//         text: error.response?.data?.message || "Failed to create offer",
//         icon: "error",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   const renderError = (field) =>
//     errors[field] && <small className="text-danger d-block">{errors[field]}</small>;

//   return (
//     <form className="form-horizontal" onSubmit={handleSubmit}>
//       <div className="input-block mb-3">
//         <label className="form-control-label">Service</label>
//         <select
//           className={`form-control ${errors.service_id ? 'is-invalid' : ''}`}

//           name="service_id"
//           value={formData.service_id}
//           onChange={handleChange}
//           required
//         >
//           <option value="">Select Service</option>
//           {services.map((service) => (
//             <option key={service._id} value={service._id}>
//               {service.name}
//             </option>
//           ))}
//         </select>
//         {renderError("service_id")}
//       </div>

//       <div className="input-block mb-3">
//         <label className="form-control-label">Promo Code</label>
//         <input
//           type="text"
//           className={`form-control ${errors.promo_code ? 'is-invalid' : ''}`}

//           name="promo_code"
//           value={formData.promo_code}
//           onChange={handleChange}
//           required
//         />
//         {renderError("promo_code")}
//       </div>

//       <div className="input-block mb-3">
//         <label className="form-control-label">Start Date</label>
//         <input
//           type="date"
//           className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}

//           name="start_date"
//           value={formData.start_date}
//           onChange={handleChange}
//           required
//         />
//         {renderError("start_date")}
//       </div>

//       <div className="input-block mb-3">
//         <label className="form-control-label">End Date</label>
//         <input
//           type="date"
//           className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}

//           name="end_date"
//           value={formData.end_date}
//           onChange={handleChange}
//           required
//         />
//         {renderError("end_date")}
//       </div>

//       <div className="input-block mb-3">
//         <label className="form-control-label">Discount (₹)</label>
//         <input
//           type="number"
//           className={`form-control ${errors.discount ? 'is-invalid' : ''}`}
//           name="discount"
//           value={formData.discount}
//           onChange={handleChange}
//           required
//           min="0"
//         />
//         {renderError("discount")}
//       </div>

//       <div className="input-block mb-3">
//         <label className="form-control-label">Minimum Order Amount (₹)</label>
//         <input
//           type="number"
//           className={`form-control ${errors.minorderamt ? 'is-invalid' : ''}`}
//           name="minorderamt"
//           value={formData.minorderamt}
//           onChange={handleChange}
//           required
//           min="0"
//         />
//         {renderError("minorderamt")}
//       </div>

//       <button type="submit" className="btn btn-primary">
//         {loading ? (
//           <>
//             <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
//             Creating...
//           </>
//         ) : (
//           "Create Offer"
//         )}
//       </button>
//     </form>
//   );
// };

// export default OfferForm;

import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { addOffer, getServiceList } from "../../api";
import { useNavigate } from "react-router-dom";

const OfferForm = () => {
  const [formData, setFormData] = useState({
    service_id: "",
    promo_code: "",
    start_date: "",
    end_date: "",
    discount: "",
    minorderamt: "",
  });
  const [errors, setErrors] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const res = await getServiceList();
        setServices(res.data || []);
      } catch (err) {
        console.error("Failed to load services", err);
      }
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on change
  };

  const validate = () => {
    const newErrors = {};
    const { service_id, promo_code, start_date, end_date, discount, minorderamt } = formData;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDateObj = start_date ? new Date(start_date) : null;
    const endDateObj = end_date ? new Date(end_date) : null;
    if (startDateObj) startDateObj.setHours(0, 0, 0, 0);
    if (endDateObj) endDateObj.setHours(0, 0, 0, 0);

    if (!service_id) newErrors.service_id = "Please select a service";

    if (!promo_code.trim()) {
      newErrors.promo_code = "Promo code is required";
    } else if (!/^[a-zA-Z0-9]{3,15}$/.test(promo_code)) {
      newErrors.promo_code = "3–15 alphanumeric characters required";
    }

    if (!start_date) {
      newErrors.start_date = "Start date is required";
    } else if (startDateObj < today) {
      newErrors.start_date = "Start date cannot be in the past";
    }

    if (!end_date) {
      newErrors.end_date = "End date is required";
    } else if (startDateObj && endDateObj <= startDateObj) {
      newErrors.end_date = "End date must be after start date";
    }

    const disc = Number(discount);
    if (!discount) {
      newErrors.discount = "Discount is required";
    } else if (isNaN(disc) || disc < 1 || disc > 100) {
      newErrors.discount = "Discount must be between 1 and 100";
    }

    const minAmt = Number(minorderamt);
    if (minorderamt === "") {
      newErrors.minorderamt = "Minimum order amount is required";
    } else if (isNaN(minAmt) || minAmt < 0 || minAmt % 1 !== 0) {
      newErrors.minorderamt = "Must be a non-negative whole number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...formData,
        discount: Number(formData.discount),
        minorderamt: Number(formData.minorderamt),
      };

      const response = await addOffer(payload);

      Swal.fire({
        title: "Success!",
        text: response.message || "Offer created successfully",
        icon: "success",
      });

      setFormData({
        service_id: "",
        promo_code: "",
        start_date: "",
        end_date: "",
        discount: "",
        minorderamt: "",
      });
      setErrors({});
      navigate("/offers");
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.response?.data?.message || "Failed to create offer",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderError = (field) =>
    errors[field] && <div className="invalid-feedback d-block">{errors[field]}</div>;

  return (
    <form className="form-horizontal" onSubmit={handleSubmit} noValidate>
      <div className="input-block mb-3">
        <label>Service</label>
        <select
          name="service_id"
          className={`form-control ${errors.service_id ? "is-invalid" : ""}`}
          value={formData.service_id}
          onChange={handleChange}
        >
          <option value="">Select Service</option>
          {services.map((service) => (
            <option key={service._id} value={service._id}>
              {service.name}
            </option>
          ))}
        </select>
        {renderError("service_id")}
      </div>

      <div className="input-block mb-3">
        <label>Promo Code</label>
        <input
          type="text"
          name="promo_code"
          className={`form-control ${errors.promo_code ? "is-invalid" : ""}`}
          value={formData.promo_code}
          onChange={handleChange}
        />
        {renderError("promo_code")}
      </div>

      <div className="input-block mb-3">
        <label>Start Date</label>
        <input
          type="date"
          name="start_date"
          className={`form-control ${errors.start_date ? "is-invalid" : ""}`}
          value={formData.start_date}
          onChange={handleChange}
        />
        {renderError("start_date")}
      </div>

      <div className="input-block mb-3">
        <label>End Date</label>
        <input
          type="date"
          name="end_date"
          className={`form-control ${errors.end_date ? "is-invalid" : ""}`}
          value={formData.end_date}
          onChange={handleChange}
        />
        {renderError("end_date")}
      </div>

      <div className="input-block mb-3">
        <label>Discount (%)</label>
        <input
          type="number"
          name="discount"
          className={`form-control ${errors.discount ? "is-invalid" : ""}`}
          value={formData.discount}
          onChange={handleChange}
          min="1"
          max="100"
        />
        {renderError("discount")}
      </div>

      <div className="input-block mb-3">
        <label>Minimum Order Amount (₹)</label>
        <input
          type="number"
          name="minorderamt"
          className={`form-control ${errors.minorderamt ? "is-invalid" : ""}`}
          value={formData.minorderamt}
          onChange={handleChange}
          min="0"
        />
        {renderError("minorderamt")}
      </div>

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" />
            Creating...
          </>
        ) : (
          "Create Offer"
        )}
      </button>
    </form>
  );
};

export default OfferForm;

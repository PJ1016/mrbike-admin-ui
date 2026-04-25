import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { getServiceList, getOfferById, editOffer } from "../../api";

const EditOffer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    service_id: "",
    promo_code: "",
    start_date: "",
    end_date: "",
    discount: "",
    minorderamt: "",
  });

  const [services, setServices] = useState([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [servicesRes, offerRes] = await Promise.all([
          getServiceList(),
          getOfferById(id),
        ]);
        setServices(servicesRes.data || []);
        const offer = offerRes.data;

        setFormData({
          service_id: offer.service_id || "",
          promo_code: offer.promo_code || "",
          start_date: offer.start_date?.slice(0, 10) || "",
          end_date: offer.end_date?.slice(0, 10) || "",
          discount: offer.discount || "",
          minorderamt: offer.minorderamt || "",
        });
      } catch (err) {
        console.error("Error loading data", err);
        Swal.fire("Error!", "Failed to load offer or services.", "error");
      }
    };

    fetchInitialData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, value);
      });

      const res = await editOffer(id, payload);
      Swal.fire("Success", res.message || "Offer updated!", "success");
      navigate("/offers"); // 🔁 adjust this to your actual offer listing path
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.message || "Failed to update offer", "error");
    }
  };

  return (
    <form className="form-horizontal" onSubmit={handleSubmit}>
      <div className="input-block mb-3">
        <label className="form-control-label">Service</label>
        <select
          className="form-control"
          name="service_id"
          value={formData.service_id}
          onChange={handleChange}
          required
        >
          <option value="">Select Service</option>
          {services.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="input-block mb-3">
        <label className="form-control-label">Promo Code</label>
        <input
          type="text"
          className="form-control"
          name="promo_code"
          value={formData.promo_code}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-block mb-3">
        <label className="form-control-label">Start Date</label>
        <input
          type="date"
          className="form-control"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-block mb-3">
        <label className="form-control-label">End Date</label>
        <input
          type="date"
          className="form-control"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="input-block mb-3">
        <label className="form-control-label">Discount (%)</label>
        <input
          type="number"
          className="form-control"
          name="discount"
          value={formData.discount}
          onChange={handleChange}
          required
          min="0"
          max="100"
          step="0.01"
        />
      </div>

      <div className="input-block mb-3">
        <label className="form-control-label">Minimum Order Amount</label>
        <input
          type="number"
          className="form-control"
          name="minorderamt"
          value={formData.minorderamt}
          onChange={handleChange}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Update Offer
      </button>
    </form>
  );
};

export default EditOffer;

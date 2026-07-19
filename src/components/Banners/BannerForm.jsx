import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2";
import { addBanner, getBaseServiceList } from "../../api";
import { useNavigate } from "react-router-dom";

const GOOGLE_MAPS_KEY = "AIzaSyCM15ry8lewwj6YZ-04_m7Z58dsQo_hBBA";

const loadGoogleMapsScript = (onReady) => {
  if (window.google?.maps?.places) { onReady(); return; }
  if (document.querySelector("script[data-gmaps]")) {
    const wait = setInterval(() => {
      if (window.google?.maps?.places) { clearInterval(wait); onReady(); }
    }, 100);
    return;
  }
  window.__gmapsCallback = () => { delete window.__gmapsCallback; onReady(); };
  const script = document.createElement("script");
  script.setAttribute("data-gmaps", "1");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=places&callback=__gmapsCallback`;
  script.async = true;
  document.head.appendChild(script);
};

const BannerForm = () => {
  const [formData, setFormData] = useState({
    name: "",
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
  });
  const navigate = useNavigate()
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [services, setServices] = useState([]);
  const [locationQuery, setLocationQuery] = useState("");
  const [googleReady, setGoogleReady] = useState(!!window.google?.maps?.places);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    getBaseServiceList()
      .then((res) => { if (res?.data) setServices(res.data); })
      .catch(() => {});
  }, []);

  // Load Google Maps only when "Specific" location is selected
  useEffect(() => {
    if (formData.locationType !== "specific") {
      autocompleteRef.current = null;
      return;
    }
    loadGoogleMapsScript(() => setGoogleReady(true));
  }, [formData.locationType]);

  useEffect(() => {
    if (!googleReady || formData.locationType !== "specific" || !searchInputRef.current || autocompleteRef.current) return;
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      searchInputRef.current,
      { fields: ["place_id", "geometry", "name", "formatted_address"] }
    );
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (!place?.geometry) return;
      const name = place.name || searchInputRef.current.value;
      setLocationQuery(name);
      setFormData((prev) => ({
        ...prev,
        placeId: place.place_id || "",
        placeName: name,
        latitude: String(place.geometry.location.lat()),
        longitude: String(place.geometry.location.lng()),
      }));
      setErrors((prev) => ({ ...prev, placeName: null }));
    });
  }, [googleReady, formData.locationType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === "locationType" && value === "all") {
        updated.placeId = "";
        updated.placeName = "";
        updated.latitude = "";
        updated.longitude = "";
        updated.radius = "";
      }
      return updated;
    });
    if (name === "locationType" && value === "all") setLocationQuery("");
  };

  const handleLocationQueryChange = (e) => {
    const val = e.target.value;
    setLocationQuery(val);
    if (!val.trim()) {
      setFormData((prev) => ({ ...prev, placeId: "", placeName: "", latitude: "", longitude: "" }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "Only JPG, JPEG, PNG, or WEBP files are allowed.",
      });
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, from_date, expiry_date, locationType, placeName, latitude, longitude, radius } = formData;
    const newErrors = {};

    // Date parsing
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight
    const from = new Date(from_date);
    const to = new Date(expiry_date);

    // Validation
    if (!name) newErrors.name = "Banner name is required.";

    if (!from_date) {
      newErrors.from_date = "From date is required.";
    } else if (from < today) {
      newErrors.from_date = "From date cannot be in the past.";
    }

    if (!expiry_date) {
      newErrors.expiry_date = "Expiry date is required.";
    } else if (from_date && expiry_date && to < from) {
      newErrors.expiry_date = "Expiry date cannot be before start date.";
    }

    if (!image) newErrors.image = "Banner image is required.";

    if (locationType === "specific") {
      if (!placeName || !latitude || !longitude) {
        newErrors.placeName = "Please search and select a location from the suggestions.";
      }
      if (!radius || isNaN(Number(radius)) || Number(radius) <= 0) {
        newErrors.radius = "Please enter a valid radius (greater than 0).";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Proceed if no errors
    const form = new FormData();
    form.append("name", name);
    form.append("from_date", from_date);
    form.append("expiry_date", expiry_date);
    form.append("images", image); // must match backend key
    form.append("baseServiceId", formData.baseServiceId || "");
    form.append("locationType", locationType);
    form.append("placeId", formData.placeId || "");
    form.append("placeName", formData.placeName || "");
    form.append("latitude", formData.latitude || "");
    form.append("longitude", formData.longitude || "");
    form.append("radius", formData.radius || "");
    form.append("displayOrder", formData.displayOrder || "0");

    try {
      const response = await addBanner(form);

      Swal.fire({
        title: "Success!",
        text: response.message || "Banner added successfully.",
        icon: "success",
      });
      navigate("/bannerList")
      setFormData({
        name: "",
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
      });
      setLocationQuery("");
      setImage(null);
      setErrors({});
    } catch (error) {
      Swal.fire({
        title: "Error!",
        text: error.response?.data?.message || "Something went wrong!",
        icon: "error",
      });
    }
  };

  return (
    <div className="row">
      <div className="col-sm-12">
        <div className="card-table card p-3">
          <div className="card-body">
            <form className="form-horizontal" onSubmit={handleSubmit}>
              <div className="input-block mb-3">
                <label className="form-control-label">Banner Name</label>
                <input
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <div className="invalid-feedback">{errors.name}</div>}
              </div>

              <div className="input-block mb-3">
                <label className="form-control-label">From Date</label>
                <input
                  className={`form-control ${errors.from_date ? "is-invalid" : ""}`}
                  name="from_date"
                  type="date"
                  value={formData.from_date}
                  onChange={handleChange}
                />
                {errors.from_date && <div className="invalid-feedback">{errors.from_date}</div>}
              </div>

              <div className="input-block mb-3">
                <label className="form-control-label">Expiry Date</label>
                <input
                  className={`form-control ${errors.expiry_date ? "is-invalid" : ""}`}
                  name="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={handleChange}
                />
                {errors.expiry_date && <div className="invalid-feedback">{errors.expiry_date}</div>}
              </div>

              <div className="input-block mb-3">
                <label className="form-control-label">Upload Banner Image</label>
                <input
                  type="file"
                  className={`form-control mb-2 ${errors.image ? "is-invalid" : ""}`}
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {errors.image && <div className="invalid-feedback d-block">{errors.image}</div>}
                {preview && (
                  <div className="border rounded p-2 bg-light text-center">
                    <img
                      src={preview}
                      alt="Preview"
                      style={{ maxWidth: "100%", maxHeight: "200px", objectFit: "contain" }}
                    />
                  </div>
                )}
              </div>

              <div className="input-block mb-3">
                <label className="form-control-label">Linked Service (optional)</label>
                <select
                  className="form-control"
                  name="baseServiceId"
                  value={formData.baseServiceId}
                  onChange={handleChange}
                >
                  <option value="">-- No Service Linked --</option>
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-block mb-3">
                <label className="form-control-label">Location Type</label>
                <select
                  className="form-control"
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleChange}
                >
                  <option value="all">All Locations</option>
                  <option value="specific">Specific Location</option>
                </select>
              </div>

              {formData.locationType === "specific" && (
                <div className="input-block mb-3 border rounded p-3">
                  <label className="form-control-label">Search Location</label>
                  <input
                    ref={searchInputRef}
                    type="text"
                    className={`form-control mb-2 ${errors.placeName ? "is-invalid" : ""}`}
                    placeholder={googleReady ? "Type to search a place..." : "Loading Google Maps..."}
                    value={locationQuery}
                    onChange={handleLocationQueryChange}
                    disabled={!googleReady}
                  />
                  {errors.placeName && <div className="invalid-feedback d-block">{errors.placeName}</div>}

                  <div className="row">
                    <div className="col-md-4 mb-2">
                      <label className="form-control-label">Latitude</label>
                      <input type="text" className="form-control" value={formData.latitude} readOnly />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-control-label">Longitude</label>
                      <input type="text" className="form-control" value={formData.longitude} readOnly />
                    </div>
                    <div className="col-md-4 mb-2">
                      <label className="form-control-label">Radius (km)</label>
                      <input
                        type="number"
                        name="radius"
                        className={`form-control ${errors.radius ? "is-invalid" : ""}`}
                        value={formData.radius}
                        onChange={handleChange}
                        min="0.1"
                        step="0.5"
                      />
                      {errors.radius && <div className="invalid-feedback">{errors.radius}</div>}
                    </div>
                  </div>
                </div>
              )}

              <div className="input-block mb-3">
                <label className="form-control-label">Display Order</label>
                <input
                  type="number"
                  name="displayOrder"
                  className="form-control"
                  value={formData.displayOrder}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group col-lg-12 mb-3">
                <button className="btn btn-primary mt-4 mb-5" type="submit">
                  Create Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannerForm;

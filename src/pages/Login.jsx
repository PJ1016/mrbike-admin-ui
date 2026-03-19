import { useState } from "react";
import { useNavigate } from "react-router-dom";
import '@fortawesome/fontawesome-free/css/all.min.css';
// import { sendOtp, verifyOtp } from "../api";

const Login = () => {
  const [inputValues, setInputValues] = useState({ phone: "", otp: "" });
  const [showOtpField, setShowOtpField] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    const updatedValues = { ...inputValues, [name]: value };
    setInputValues(updatedValues);

    if (name === "phone") {
      const error = /^\d{10}$/.test(value) ? "" : "Phone number must be 10 digits.";
      if (!error) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || "https://api.mrbikedoctor.cloud/bikedoctor"}/adminauth/send-otp`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: value }),
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Failed to send OTP");

          setShowOtpField(true);
          setSubmitError("");
        } catch (err) {
          setSubmitError(err.message);
          setShowOtpField(false);
        }
      } else {
        setShowOtpField(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!inputValues.otp || inputValues.otp.length !== 6) {
      setSubmitError("Please enter a 6-digit OTP.");
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || "https://api.mrbikedoctor.cloud/bikedoctor"}/adminauth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: inputValues.phone,
          otp: inputValues.otp,
        }),
      });

      // teste 

      const data = await response.json();
      console.log(data);

      if (response.status === 403 && data.message === "User is inactive. Please contact admin.") {
        setSubmitError("Your account is inactive. Please contact admin.");
        return;
      }

      if (!response.ok) throw new Error(data.message || "OTP verification failed");
      console.log("data", data)
      console.log("data", data.user)
      console.log("data", data.token)
      localStorage.setItem("adminToken", data.token);
      // localStorage.setItem("userData", data.user);
      localStorage.setItem("userData", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <div className="login-30 tab-box">
      <div className="container-fluid">
        <div className="row">
          <div className="col-lg-6 col-md-12 bg-img">
            <div id="bg"></div>
          </div>
          <div className="col-lg-6 col-md-12 form-section">
            <div className="login-inner-form">
              <div className="details">
                <h1 className="mb-3">Login with Mobile</h1>
                <form onSubmit={handleSubmit} noValidate>
                  <div className="form-group input-with-icon">
                    <label htmlFor="phone" className="form-label float-start">
                      Phone Number
                    </label>
                    <input
                      name="phone"
                      type="tel"
                      className={`form-control`}
                      id="phone"
                      placeholder="Enter your phone number"
                      value={inputValues.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  {showOtpField && (
                    <div className="form-group input-with-icon">
                      <label htmlFor="otp" className="form-label float-start">
                        OTP
                      </label>
                      <input
                        name="otp"
                        type="text"
                        className={`form-control `}
                        id="otp"
                        placeholder="Enter OTP"
                        value={inputValues.otp}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  <div className="form-group clearfix">
                    <button
                      type="submit"
                      className="btn btn-lg btn-primary btn-theme"
                    >
                      <span>Login</span>
                    </button>
                  </div>
                </form>
                {submitError && (
                  <div role="alert" className="error-alert">
                    <svg
                      className="icon"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      focusable="false"
                    >
                      <path d="M11.001 10h2v5h-2zM11 16h2v2h-2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                    </svg>
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
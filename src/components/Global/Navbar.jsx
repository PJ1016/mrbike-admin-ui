import { Link, useNavigate } from 'react-router-dom'
import img1 from "../../assets2/img/logos/logo.png"
import img2 from "../../assets2/img/logos/logo-small.png"
import img3 from "../../assets/img/profiles/avatar-07.jpg"
import GlobalSearch from "./GlobalSearch"

const Navbar = () => {
  const navigate = useNavigate()
  const toggleSidebar = () => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.toggle("open-sidebar");
    }
  };

  function handleLogout() {
    localStorage.removeItem("adminToken")
    navigate("/login")
  }
  return (
    <div className="header header-one">
      <Link
        to={"/"}
        className="d-inline-flex d-sm-inline-flex align-items-center d-md-inline-flex d-lg-none align-items-center device-logo"
      >
        <img
          src={img1}
          className="img-fluid logo2"
          alt="Logo"
          style={{ width: 60 }}
        />
      </Link>
      <div className="main-logo d-inline float-start d-lg-flex align-items-center d-none d-sm-none d-md-none">
        <div className="logo-color">
          <Link to={"/"}>
            <img
              src={img1}
              className="img-fluid logo-blue"
              alt="Logo"
              style={{ width: 60 }}
            />
          </Link>
          <Link to={"/"}>
            <img
              src={img2}
              className="img-fluid logo-small"
              alt="Logo"
              style={{ width: 50 }}
            />
          </Link>
        </div>
      </div>
      <Link href="#" id="toggle_btn">
        <span className="toggle-bars">
          <span className="bar-icons" />
          <span className="bar-icons" />
          <span className="bar-icons" />
          <span className="bar-icons" />
        </span>
      </Link>
      <Link className="mobile_btn" id="mobile_btn" onClick={toggleSidebar}>
        <i className="fas fa-bars" />
      </Link>

      <div className="d-flex align-items-center ms-4 flex-grow-1 justify-content-center">
        <GlobalSearch />
      </div>
      <ul className="nav nav-tabs user-menu">
        <li className="nav-item dropdown">
          <Link
            href="#"
            className="user-link  nav-link"
            data-bs-toggle="dropdown"
          >
            <span className="user-img">
              <img
                src={img3}
                alt="img"
                className="profilesidebar"
              />
              <span className="animate-circle" />
            </span>
            <span className="user-content">
              <span className="user-details">Admin</span>
              <span className="user-name">John Smith</span>
            </span>
          </Link>
          <div className="dropdown-menu menu-drop-user">
            <div className="profilemenu">
              <div className="subscription-logout">
                <ul>
                  <li className="pb-0">
                    <button onClick={handleLogout} className="dropdown-item">
                      Log Out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
  )
}

export default Navbar
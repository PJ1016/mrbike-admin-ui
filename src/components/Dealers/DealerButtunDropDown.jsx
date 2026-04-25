import axios from 'axios';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const DealerButtunDropDown = ({ activeItem, handleMenuClick }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const allRequestsReceived = async() => {
    try {
      const res = await axios.get(``)
    } catch (error) {
      
    }
  }

  const closeSidebar = () => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.remove("open-sidebar");
    }
  };

  const isDealerActive = ["/dealers", "/dealers-verify", "/approve"].includes(activeItem);

  return (
    <li className={`menu-item ${isDealerActive ? "active" : ""}`} onClick={() => toggleDropdown("dealers")}>
      <Link to="#" onClick={() => toggleDropdown("dealers")} style={{ textDecoration: "none" }}>
        <i className="fa fa-user-circle" /> <span> Dealers </span>
        <span className="menu-arrow" />
      </Link>
      <ul style={{ display: openDropdown === "dealers" ? "block" : "none" }}>
        <li>
          <Link onClick={() => handleMenuClick("/dealers-verify")} to="/dealers-verify" style={{ textDecoration: "none" }}>
            Dealers Verify
          </Link>
        </li>
        <li>
          <Link onClick={() => handleMenuClick("/dealers")} to="/dealers" style={{ textDecoration: "none" }}>
            View Dealers
          </Link>
        </li>
      </ul>
    </li>
  );
};

export default DealerButtunDropDown;

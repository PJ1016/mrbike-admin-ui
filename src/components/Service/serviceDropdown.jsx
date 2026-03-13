"use client";

import { useState } from "react";
import { Link } from "react-router-dom";

const ServiceDropdown = ({ activeItem, handleMenuClick }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const toggleDropdown = () => {
    setOpenDropdown(openDropdown === "Services" ? null : "Services");
  };

  const isServiceActive = [
    "/create-service",
    "/additionalservices",
    "/createaddServices",
    "/services",
    "/base-services",
    "/create-base-service",
    "/edit-base-service",
    "/base-additional-services",
    "/create-base-additional-service",
    "/edit-base-additional-service",
  ].includes(activeItem);

  return (
    <li className={`submenu ${isServiceActive ? "active" : ""}`}>
      <Link to="#" onClick={toggleDropdown} style={{ textDecoration: "none" }}>
        <i className="fa fa-tasks" /> <span> Services </span>
        <span className="menu-arrow" />
      </Link>
      <ul style={{ display: openDropdown === "Services" ? "block" : "none" }}>
        <li className={activeItem === "/base-services" ? "active" : ""}>
          <Link
            onClick={() => handleMenuClick("/base-services")}
            to="/base-services"
            style={{ textDecoration: "none" }}
          >
            Major Services
          </Link>
        </li>
        <li className={activeItem === "/services" ? "active" : ""}>
          <Link
            onClick={() => handleMenuClick("/services")}
            to="/services"
            style={{ textDecoration: "none" }}
          >
            Dealer Services
          </Link>
        </li>
        <li className={activeItem === "/additionalservices" ? "active" : ""}>
          <Link
            onClick={() => handleMenuClick("/additionalservices")}
            to="/additionalservices"
            style={{ textDecoration: "none" }}
          >
            Additional Service
          </Link>
        </li>
        <li
          className={activeItem === "/base-additional-services" ? "active" : ""}
        >
          <Link
            onClick={() => handleMenuClick("/base-additional-services")}
            to="/base-additional-services"
            style={{ textDecoration: "none" }}
          >
            Base Additional Services
          </Link>
        </li>
      </ul>
    </li>
  );
};

export default ServiceDropdown;

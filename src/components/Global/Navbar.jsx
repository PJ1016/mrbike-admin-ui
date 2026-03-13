import { Link, useNavigate } from 'react-router-dom'
import { Box, Stack, Avatar, Typography, Menu, MenuItem, IconButton, Tooltip } from "@mui/material"
import { Logout as LogoutIcon, Person as PersonIcon } from "@mui/icons-material"
import React, { useState } from "react"
import img1 from "../../assets2/img/logos/logo.png"
import img2 from "../../assets2/img/logos/logo-small.png"
import img3 from "../../assets/img/profiles/avatar-07.jpg"
import GlobalSearch from "./GlobalSearch"

const Navbar = () => {
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)
  
  const handleOpenUserMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const toggleSidebar = () => {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
      sidebar.classList.toggle("open-sidebar");
    }
  };

  function handleLogout() {
    handleCloseUserMenu();
    localStorage.removeItem("adminToken")
    navigate("/login")
  }

  return (
    <div className="header header-one d-flex align-items-center">
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

      <Stack 
        direction="row" 
        spacing={2} 
        alignItems="center" 
        sx={{ ml: 'auto', px: 3, flexGrow: 1, justifyContent: 'flex-end' }}
      >
        <Box sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 450, width: '100%' }}>
          <GlobalSearch />
        </Box>

        <Tooltip title="Open settings">
          <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: 'pointer' }}>
              <Box sx={{ display: { xs: 'none', lg: 'block' }, textAlign: 'right' }}>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ lineHeight: 1, fontWeight: 500 }}>
                  Admin
                </Typography>
                <Typography variant="body2" fontWeight="700">
                  John Smith
                </Typography>
              </Box>
              <Avatar alt="Admin User" src={img3} sx={{ width: 40, height: 40, border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
            </Stack>
          </IconButton>
        </Tooltip>

        <Menu
          sx={{ mt: '45px' }}
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleCloseUserMenu}
        >
          <MenuItem onClick={() => { handleCloseUserMenu(); navigate('/profile'); }}>
            <PersonIcon sx={{ mr: 1, fontSize: 20 }} /> Profile
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1, fontSize: 20 }} /> Log Out
          </MenuItem>
        </Menu>
      </Stack>
    </div>
  )
}

export default Navbar
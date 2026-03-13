import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Outlet,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { fetchGlobalSearchData } from "./redux/slices/searchSlice";
import "./App.css";
import AddAdmin from "./pages/admin/AddAdmin";
import Sidebar from "./components/Global/Sidebar";
import Navbar from "./components/Global/Navbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import AddDealer from "./pages/Dealer/Createdealer";
import Addservices from "./pages/services/CreateService";
import Addaddservices from "./pages/additionalServices/CreateService";
import Admins from "./pages/admin/admin";
import BookingTrack from "./pages/bookings/BookingTrack";
import Bookings from "./pages/bookings/bookings";
import Customers from "./pages/customer/customer";
import Services from "./pages/services/services";
import AServices from "./pages/additionalServices/services";
import DealerList from "./pages/Dealer/Dealers";
import AddBikeCompany from "./pages/bikes/AddBikeCompany";
import Bikes from "./pages/bikes/Bikes";
import CreateBanner from "./pages/banners/CreateBanner";
import Banners from "./pages/banners/Banners";
import PaymentList from "./pages/payment/payment";
import Reward from "./pages/reward/RewardList";
import OfferList from "./pages/Offers/OfferList";
import DealerUpdate from "./pages/Dealer/updateDealer";
import DealerPayoutList from "./pages/Dealer/DealerPayoutList";
import DealerVerify from "./pages/Dealer/DealerVerify";
import DocumentStatus from "./pages/Dealer/DocumentStatus";
import Offer from "./pages/Offers/AddOffer";
import ViewDealerDetails from "./components/Dealers/ViewDealerDetails";
import EditService from "./components/Service/EditService";
import CreateAddService from "./pages/additionalServices/CreateService";
import ViewAdditionalService from "./pages/additionalServices/ViewAdditionalService";
import EditAdditionService from "./pages/additionalServices/EditAdditionService";
import EditVerifyDeaaaler from "./pages/Dealer/EditVerifyDeaaaler";
import ViewDealersVerify from "./pages/Dealer/ViewDealersVerify";
import UpdateDealerVerify from "./components/Dealers/UpdateDealerVerify";
import AllTicket from "./pages/ticketSection/AllTicket";
import NewTicket from "./pages/ticketSection/NewTicket";
import BaseServices from "./pages/services/BaseServices";
import BaseServiceForm from "./components/Service/BaseServiceForm";
import BaseAdditionalServices from "./pages/services/BaseAdditionalServices";
import BaseAdditionalServiceForm from "./components/Additional/BaseAdditionalServiceForm";
import DealerServices from "./pages/Dealer/DealerServices";
import ViewUserDetails from "./pages/customer/ViewUserDetails";
import ViewAdminServiceDetails from "./components/Service/ViewAdminServiceDetails";
const theme = createTheme({
  palette: {
    primary: {
      main: "#2e83ff",
      contrastText: "#fff",
    },
    background: {
      default: "#f8e9f7",
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "8px",
        },
        containedPrimary: {
          "&:hover": {
            color: "#fff !important", // Fix globl link hover conflict
          },
        },
      },
    },
  },
});

const ProtectedRoutes = ({ children }) => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to={"/login"} />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/">
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

// test

const AppContent = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const hideNavbar = location.pathname.toLowerCase() === "/login";

  useEffect(() => {
    dispatch(fetchGlobalSearchData());
  }, [dispatch]);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoutes>
              <SidebarLayout />
            </ProtectedRoutes>
          }
        >
          <Route path="/addadmin" element={<AddAdmin />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/add-dealer" element={<AddDealer />} />
          <Route path="/view-dealer/:id" element={<ViewDealerDetails />} />
          <Route
            path="/view-verify-dealer/:id"
            element={<ViewDealersVerify />}
          />
          <Route
            path="/edit-verify-dealer/:id"
            element={<EditVerifyDeaaaler />}
          />
          <Route path="/updateDealer/:id" element={<DealerUpdate />} />
          <Route
            path="/update-dealer-verify/:id"
            element={<UpdateDealerVerify />}
          />
          <Route path="/admins" element={<Admins />} />
          <Route path="/bookingTrack" element={<BookingTrack />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/base-services" element={<BaseServices />} />
          <Route
            path="/create-base-service"
            element={<BaseServiceForm isEdit={false} />}
          />
          <Route
            path="/edit-base-service/:id"
            element={<BaseServiceForm isEdit={true} />}
          />
          <Route
            path="/base-additional-services"
            element={<BaseAdditionalServices />}
          />
          <Route
            path="/create-base-additional-service"
            element={<BaseAdditionalServiceForm isEdit={false} />}
          />
          <Route
            path="/edit-base-additional-service/:id"
            element={<BaseAdditionalServiceForm isEdit={true} />}
          />
          <Route path="/services" element={<Services />} />
          <Route path="/view-customer/:id" element={<ViewUserDetails />} />
          <Route path="/view-service/:id" element={<ViewAdminServiceDetails />} />
          <Route path="/dealer-services" element={<DealerServices />} />
          <Route path="/edit-services/:id" element={<EditService />} />
          <Route path="/additionalservices" element={<AServices />} />
          <Route
            path="/create-additional-service"
            element={<CreateAddService />}
          />
          <Route
            path="/additional-services/view/:id"
            element={<ViewAdditionalService />}
          />
          <Route
            path="/additional-services/edit/:id"
            element={<EditAdditionService />}
          />
          <Route path="/dealers" element={<DealerList />} />
          <Route path="/dealers-verify" element={<DealerVerify />} />
          <Route path="/dealer-doc-update" element={<DocumentStatus />} />
          <Route path="/booking" element={<Bookings />} />
          <Route path="/addBikeCompany" element={<AddBikeCompany />} />
          <Route path="/bikes" element={<Bikes />} />
          <Route path="/addServices" element={<Addservices />} />
          <Route path="/createaddServices" element={<Addaddservices />} />
          <Route path="/banners" element={<CreateBanner />} />
          <Route path="/bannerList" element={<Banners />} />
          <Route path="/paymentList" element={<PaymentList />} />
          <Route path="/rewards" element={<Reward />} />
          <Route path="/offers" element={<OfferList />} />
          <Route path="/approve" element={<DealerPayoutList />} />
          <Route path="/add-offer" element={<Offer />} />
          <Route path="/all-tickets" element={<AllTicket />} />
          <Route
            path="/all-tickets/view-ticket/:ticketId"
            element={<NewTicket />}
          />
        </Route>
      </Routes>
    </>
  );
};

const SidebarLayout = () => (
  <>
    <Sidebar />
    <Outlet />
  </>
);

export default App;

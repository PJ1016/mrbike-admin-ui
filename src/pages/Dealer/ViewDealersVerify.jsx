import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Modal from 'react-bootstrap/Modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import {
    FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaFileAlt,
    FaArrowLeft, FaImage, FaUniversity, FaTools
} from 'react-icons/fa';
import { getServiceList } from '../../api';
import React from 'react';

const ImagePreview = ({ src, label }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="mb-3">
            <p><strong>{label}:</strong></p>
            {src ? (
                <>
                    <img
                        src={`/${src}`}
                        alt={label}
                        onClick={() => setShow(true)}
                        style={{ width: '100px', height: 'auto', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <Modal show={show} onHide={() => setShow(false)} size="lg" centered>
                        <Modal.Body className="text-center">
                            <img
                                src={`/${src}`}
                                alt="Preview"
                                style={{ maxWidth: '100%', maxHeight: '80vh' }}
                            />
                        </Modal.Body>
                    </Modal>
                </>
            ) : (
                <span className="badge bg-secondary">Not Uploaded</span>
            )}
        </div>
    );
};

const ViewDealersVerify = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [dealer, setDealer] = useState(null);
    const [dealerServices, setDealersServices] = useState([])
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDealer = async () => {
            try {
                const res = await fetch(`https://api.mrbikedoctor.cloud/bikedoctor/dealer/view/${id}`);
                const data = await res.json();
                console.log("Data", data)
                if (!res.ok) throw new Error(data.message || 'Failed to load dealer');
                setDealer(data);
            } catch (err) {
                Swal.fire('Error', err.message, 'error');
                navigate('/dealers');
            } finally {
                setLoading(false);
            }
        };

        const fetchServices = async () => {
            try {
                const response = await getServiceList();
                if (response.status === 200) {
                    console.log("All Services", response.data);

                    const filteredServices = response.data.filter(
                        service => service._id === id
                    );
                    console.log("Filtered Services for this dealer", filteredServices);
                    setDealersServices(filteredServices);
                }
            } catch (error) {
                console.error("Error fetching services:", error);
            }
        };

        fetchServices()

        fetchDealer();
    }, [id, navigate]);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-gray-600 text-lg font-medium">Loading...</p>
                </div>
            </div>
        );
    }
    if (!dealer) return <div className="alert alert-danger mt-4">Dealer not found.</div>;

    return (
        <div className="page-wrapper">
            <div className="content container-fluid">
                <div className="row">
                    <div className="col-sm-12">
                        <div className="card-table card">
                            <div className="card-body form-horizontal">
                                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                    <h4 className="mb-0"><FaUser className="me-2" /> {dealer.shopName}</h4>
                                    <button className="btn btn-light btn-sm" onClick={() => navigate(-1)}>
                                        <FaArrowLeft className="me-2" /> Back
                                    </button>
                                </div>

                                <div className="viewdealers p-3">
                                    <h5 className="text-primary mb-3"><FaImage className="me-2" />Shop Details</h5>
                                    <p><strong>Shop Email:</strong> {dealer.shopEmail || dealer.email || 'N/A'}</p>
                                    <p><strong>Shop Contact:</strong> {dealer.shopContact || dealer.phone || 'N/A'}</p>
                                    <p><strong>Shop Address:</strong> {dealer.permanentAddress?.address || dealer.fullAddress || 'N/A'}</p>
                                    <p><strong>Comission:</strong> {dealer.commission || 0} % | <strong>Tax:</strong> {dealer.tax || 0} %</p>
                                    <p><strong>Shop Images: &nbsp;</strong>
                                        {Array.isArray(dealer.shopImages) && dealer.shopImages.length > 0 ? (
                                            dealer.shopImages.map((img, index) => (
                                                <ImagePreview key={index} src={img} label={`Shop Image ${index + 1}`} />
                                            ))
                                        ) : (
                                            <span className="badge bg-secondary p-2">No Shop Images Uploaded</span>
                                        )}
                                    </p>

                                    {/* Personal Info */}
                                    <hr />
                                    <h5 className="text-primary mb-3"><FaUser className="me-2" /> Personal Information</h5>
                                    <p><strong>Name:</strong> {dealer.ownerName || 'N/A'}</p>
                                    <p><FaEnvelope className="me-2" /><strong>Email:</strong> {dealer.personalEmail || dealer.email || 'N/A'}</p>
                                    <p><FaPhone className="me-2" /><strong>Phone:</strong> {dealer.phone || 'N/A'}</p>
                                    <p><strong>Alternate Phone:</strong> {dealer.alternatePhone || 'N/A'}</p>

                                    {/* Address */}
                                    <hr />
                                    <h5 className="text-primary mb-3"><FaMapMarkerAlt className="me-2" /> Address Details</h5>
                                    <p><strong>Full Address:</strong> {dealer.permanentAddress?.address || dealer.fullAddress || "N/A"}</p>
                                    <p><strong>City:</strong> {dealer.permanentAddress?.city || dealer.city || "N/A"} | <strong>State:</strong> {dealer.permanentAddress?.state || dealer.state || "N/A"} | <strong>Pincode:</strong> {dealer.shopPincode || 'N/A'}</p>

                                    {/* Bank Info */}
                                    <hr />
                                    <h5 className="text-primary mb-3"><FaUniversity className="me-2" /> Banking Information</h5>
                                    <p><strong>Account Holder:</strong> {dealer.bankDetails.accountHolderName}</p>
                                    <p><strong>Bank Name:</strong> {dealer.bankDetails.bankName}</p>
                                    <p><strong>Account No.:</strong> {dealer.bankDetails.accountNumber}</p>
                                    <p><strong>IFSC Code:</strong> {dealer.bankDetails.ifscCode}</p>
                                    <div className="mt-3">
                                        <ImagePreview src={dealer.documents?.passbookImage} label="Passbook / Cancelled Cheque" />
                                    </div>

                                    {/* Documents */}
                                    <hr />
                                    <h5 className="text-primary mb-3"><FaFileAlt className="me-2" /> Uploaded Documents</h5>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <ImagePreview
                                                src={`https://api.mrbikedoctor.cloud${dealer.documents?.aadharFront}`}
                                                label="Aadhaar Front"
                                            />
                                            <ImagePreview src={dealer.documents?.aadharBack} label="Aadhaar Back" />
                                        </div>
                                        <div className="col-md-4">
                                            <ImagePreview src={dealer.documents?.panCardFront} label="PAN Card" />
                                        </div>
                                    </div>

                                    {/* Service Info */}
                                    <hr />
                                    <h5 className="text-primary mb-3"><FaTools className="me-2" /> Service Information</h5>
                                    {dealerServices.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-bordered table-hover">
                                                <thead className="thead-dark">
                                                    <tr>
                                                        <th>Sr No.</th>
                                                        <th>Image</th>
                                                        <th>Service Name</th>
                                                        <th>Bike CC</th>
                                                        <th>Price</th>
                                                        <th>Created</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dealerServices.map((service,serviceIndex) => (
                                                        <React.Fragment key={service._id}>
                                                            {service.bikes && service.bikes.length > 0 ? (
                                                                service.bikes.map((bike, index) => (
                                                                    <tr key={`${service._id}-${index}`}>
                                                                        {index === 0 ? (
                                                                            <>
                                                                                {index === 0 && (
                                                                                    <td rowSpan={service.bikes.length}>
                                                                                        {serviceIndex + 1}
                                                                                    </td>
                                                                                )}
                                                                                <td rowSpan={service.bikes.length}>
                                                                                    {service.image && (
                                                                                        <ImagePreview
                                                                                            src={service.image}
                                                                                            label=""
                                                                                            style={{ width: '60px', height: 'auto' }}
                                                                                        />
                                                                                    )}
                                                                                </td>
                                                                                <td rowSpan={service.bikes.length}>
                                                                                    {service.name}
                                                                                </td>
                                                                            </>
                                                                        ) : null}
                                                                        <td>{bike.cc} CC</td>
                                                                        <td>₹{bike.price}</td>
                                                                        {index === 0 ? (
                                                                            <>
                                                                                <td rowSpan={service.bikes.length}>
                                                                                    {new Date(service.createdAt).toLocaleDateString()}
                                                                                </td>
                                                                            </>
                                                                        ) : null}
                                                                    </tr>
                                                                ))
                                                            ) : (
                                                                <tr key={`${service._id}-no-bikes`}>
                                                                    <td>
                                                                        {service.image && (
                                                                            <ImagePreview
                                                                                src={service.image}
                                                                                label=""
                                                                                style={{ width: '60px', height: 'auto' }}
                                                                            />
                                                                        )}
                                                                    </td>
                                                                    <td>{service.name}</td>
                                                                    <td colSpan="4" className="text-center">No bike configurations</td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="alert alert-info">No services found for this dealer.</div>
                                    )}

                                    <p><strong>Status:</strong> <span className={`badge p-2 ${dealer.isActive ? 'bg-success' : 'bg-danger'}`}>{dealer.isActive ? 'Active' : 'Inactive'}</span></p>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewDealersVerify
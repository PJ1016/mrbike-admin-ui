// // import React, { useEffect, useState, useMemo, useRef } from "react";
// // import Swal from "sweetalert2";
// // import { useDownloadExcel } from "react-export-table-to-excel";
// // import jsPDF from "jspdf";
// // import "jspdf-autotable";

// // const Reward = ({ triggerDownloadExcel, triggerDownloadPDF, tableHeaders, datas, text }) => {
// //   const tableRef = useRef(null);

// //   const { onDownload } = useDownloadExcel({
// //     currentTableRef: tableRef.current,
// //     filename: "Reward_List",
// //     sheet: "Rewards",
// //   });

// //   const exportToPDF = () => {
// //     const doc = new jsPDF();
// //     doc.text("Reward List", 14, 10);

// //     const table = tableRef.current;
// //     if (!table) {
// //       console.error("Table not found!");
// //       return;
// //     }

// //     doc.autoTable({
// //       html: "#example",
// //       startY: 20,
// //       theme: "striped",
// //     });

// //     doc.save(`${text}.pdf`);
// //   };

// //   const rowsPerPage = 10;
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const totalPages = Math.ceil(datas.length / rowsPerPage);
// //   const currentData = useMemo(() => {
// //     const start = (currentPage - 1) * rowsPerPage;
// //     return datas.slice(start, start + rowsPerPage);
// //   }, [datas, currentPage]);

// //   const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
// //   const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

// //   triggerDownloadExcel.current = onDownload;
// //   triggerDownloadPDF.current = exportToPDF;

// //   const memoizedRowList = useMemo(() => {
// //     return currentData.map((data, index) => (
// //       <tr key={data._id}>
// //         <td>{index + 1}</td>
// //         <td>{data._id || "N/A"}</td>
// //         <td>{data.user_id?.first_name + " " + data.user_id?.last_name || "N/A"}</td>
// //         <td>{data.booking_id?.bookingId || "N/A"}</td>
// //         <td>{data.booking_id?.dealer_id || "N/A"}</td>
// //         <td>
// //           {data.booking_id?.services?.length > 0 ? (
// //             <ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
// //               {data.booking_id.services.map((srv, i) => (
// //                 <li key={i}>{srv.name}</li>
// //               ))}
// //             </ul>
// //           ) : "N/A"}
// //         </td>
// //         <td>{data.reward_points || 0}</td>
// //         <td>{data.is_scratched ? "Yes" : "No"}</td>
// //         <td>{new Date(data.created_at).toLocaleDateString()}</td>
// //       </tr>
// //     ));
// //   }, [currentData]);

// //   return (
// //     <div className="row">
// //       <div className="col-sm-12">
// //         <div className="card-table card p-2">
// //           <div className="card-body">
// //             <div className="table-responsive">
// //               <div className="mb-3">
// //                 <input
// //                   type="text"
// //                   className="form-control"
// //                   placeholder="Search by name, email or phone"
// //                   value={searchTerm}
// //                   onChange={(e) => {
// //                     setSearchTerm(e.target.value);
// //                     setCurrentPage(1);
// //                   }}
// //                 />
// //               </div>
// //               <table ref={tableRef} id="example" className="table table-striped">
// //                 <thead className="thead-light" style={{ backgroundColor: "#2e83ff" }}>
// //                   <tr>{tableHeaders.map((header, index) => (<th key={index}>{header}</th>))}</tr>
// //                 </thead>
// //                 <tbody className="list">{memoizedRowList}</tbody>
// //               </table>
// //             </div>
// //             <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded shadow-sm">
// //               <div className="text-muted" style={{ fontWeight: "500", fontSize: "0.9rem" }}>
// //                 Total Records: <span className="text-primary fw-bold">{filteredAdmins.length}</span>
// //               </div>

// //               <nav aria-label="Page navigation example">
// //                 <ul className="pagination pagination-sm mb-0">
// //                   <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
// //                     <button
// //                       className="page-link"
// //                       onClick={() => setCurrentPage(currentPage - 1)}
// //                       aria-label="Previous"
// //                     >
// //                       &laquo;
// //                     </button>
// //                   </li>

// //                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
// //                     <li
// //                       key={pageNum}
// //                       className={`page-item ${pageNum === currentPage ? "active" : ""}`}
// //                       aria-current={pageNum === currentPage ? "page" : undefined}
// //                     >
// //                       <button
// //                         className="page-link"
// //                         onClick={() => setCurrentPage(pageNum)}
// //                       >
// //                         {pageNum}
// //                       </button>
// //                     </li>
// //                   ))}

// //                   <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
// //                     <button
// //                       className="page-link"
// //                       onClick={() => setCurrentPage(currentPage + 1)}
// //                       aria-label="Next"
// //                     >
// //                       &raquo;
// //                     </button>
// //                   </li>
// //                 </ul>
// //               </nav>
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Reward;

// import React, { useEffect, useState, useMemo, useRef } from "react";
// import { useDownloadExcel } from "react-export-table-to-excel";
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// const Reward = ({ triggerDownloadExcel, triggerDownloadPDF, tableHeaders, datas, text, loading }) => {
//   const tableRef = useRef(null);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const rowsPerPage = 10;

//   const { onDownload } = useDownloadExcel({
//     currentTableRef: tableRef.current,
//     filename: "Reward_List",
//     sheet: "Rewards",
//   });

//   const exportToPDF = () => {
//     const doc = new jsPDF();
//     doc.text("Reward List", 14, 10);
//     doc.autoTable({ html: "#example", startY: 20, theme: "striped" });
//     doc.save(`${text}.pdf`);
//   };

//   triggerDownloadExcel.current = onDownload;
//   triggerDownloadPDF.current = exportToPDF;

//   // Filter data based on search term
//   const filteredData = useMemo(() => {
//     return datas.filter((data) => {
//       const fullName = `${data.user_id?.first_name || ""} ${data.user_id?.last_name || ""}`.toLowerCase();
//       // const email = data.user_id?.email?.toLowerCase() || "";
//       // const phone = data.user_id?.phone?.toLowerCase() || "";
//       const term = searchTerm.toLowerCase();
//       return fullName.includes(term)
//       // || email.includes(term) || phone.includes(term);
//     });
//   }, [datas, searchTerm]);

//   const totalPages = Math.ceil(filteredData.length / rowsPerPage);

//   const currentData = useMemo(() => {
//     const start = (currentPage - 1) * rowsPerPage;
//     return filteredData.slice(start, start + rowsPerPage);
//   }, [filteredData, currentPage]);

//   const memoizedRowList = useMemo(() => {
//     return currentData.map((data, index) => (
//       <tr key={data._id}>
//         <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
//         <td>{data._id || "N/A"}</td>
//         <td>{data.user_id?.first_name + " " + data.user_id?.last_name || "N/A"}</td>
//         <td>{data.booking_id?.bookingId || "N/A"}</td>
//         <td>{data.booking_id?.dealer_id || "N/A"}</td>
//         <td>
//           {data.booking_id?.services?.length > 0 ? (
//             <ul className="mb-0 ps-3">
//               {data.booking_id.services.map((srv, i) => (
//                 <li key={i}>{srv.name}</li>
//               ))}
//             </ul>
//           ) : (
//             "N/A"
//           )}
//         </td>
//         <td>{data.reward_points || 0}</td>
//         <td>{data.is_scratched ? "Yes" : "No"}</td>
//         <td>{new Date(data.created_at).toLocaleDateString()}</td>
//       </tr>
//     ));
//   }, [currentData, currentPage]);

//   console.log("current data", currentData);

//   return (
//     <div className="row">
//       <div className="col-sm-12">
//         <div className="card-table card p-2">
//           <div className="card-body">
//             <div className="table-responsive">
//               <div className="mb-3">
//                 <input
//                   type="text"
//                   className="form-control"
//                   placeholder="Search by name, email or phone"
//                   value={searchTerm}
//                   onChange={(e) => {
//                     setSearchTerm(e.target.value);
//                     setCurrentPage(1);
//                   }}
//                 />
//               </div>
//               <table ref={tableRef} id="example" className="table table-striped">
//                 <thead className="thead-light" style={{ backgroundColor: "#2e83ff", color: "#fff" }}>
//                   <tr>{tableHeaders.map((header, index) => (<th key={index}>{header}</th>))}</tr>
//                 </thead>
//                 {/* <tbody className="list">{memoizedRowList}</tbody> */}
//                 {loading ? (
//                   <tr>
//                     <td colSpan={tableHeaders.length} className="text-center py-5">
//                       <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
//                         <span className="visually-hidden">Loading...</span>
//                       </div>
//                       <div className="mt-2">Loading Offers...</div>
//                     </td>
//                   </tr>
//                 ) : admins.length === 0 ? (
//                   <tr>
//                     <td colSpan={tableHeaders.length} className="text-center py-5">
//                       <div className="d-flex flex-column align-items-center text-muted">
//                         <i className="fa fa-box-open mb-3" style={{ fontSize: "2rem", color: "#adb5bd" }}></i>
//                         <h6 className="mb-1" style={{ fontWeight: 600 }}>No Offers Found</h6>
//                         <p style={{ fontSize: "0.9rem", color: "#6c757d", margin: 0 }}>
//                           Try adding a new offer or refreshing the page.
//                         </p>
//                       </div>
//                     </td>
//                   </tr>
//                 ) : (
//                   memoizedRowList
//                 )}
//               </table>
//             </div>

//             <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded shadow-sm">
//               <div className="text-muted" style={{ fontWeight: "500", fontSize: "0.9rem" }}>
//                 Total Records: <span className="text-primary fw-bold">{filteredData.length}</span>
//               </div>

//               <nav aria-label="Page navigation">
//                 <ul className="pagination pagination-sm mb-0">
//                   <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
//                     <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>&laquo;</button>
//                   </li>

//                   {Array.from({ length: totalPages }, (_, i) => (
//                     <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
//                       <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
//                     </li>
//                   ))}

//                   <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
//                     <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>&raquo;</button>
//                   </li>
//                 </ul>
//               </nav>
//             </div>

//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Reward;

import React, { useState, useMemo, useRef } from "react";
import { useDownloadExcel } from "react-export-table-to-excel";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Reward = ({ triggerDownloadExcel, triggerDownloadPDF, tableHeaders, datas, text, loading }) => {
  const tableRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const { onDownload } = useDownloadExcel({
    currentTableRef: tableRef.current,
    filename: "Reward_List",
    sheet: "Rewards",
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reward List", 14, 10);
    doc.autoTable({ html: "#example", startY: 20, theme: "striped" });
    doc.save(`${text}.pdf`);
  };

  triggerDownloadExcel.current = onDownload;
  triggerDownloadPDF.current = exportToPDF;

  const filteredData = useMemo(() => {
    return datas.filter((data) => {
      const fullName = `${data.user_id?.first_name || ""} ${data.user_id?.last_name || ""}`.toLowerCase();
      const term = searchTerm.toLowerCase();
      return fullName.includes(term);
    });
  }, [datas, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage]);

  const memoizedRowList = useMemo(() => {
    return currentData.map((data, index) => (
      <tr key={data._id}>
        <td>{(currentPage - 1) * rowsPerPage + index + 1}</td>
        <td>{data._id || "N/A"}</td>
        <td>{data.user_id?.first_name + " " + data.user_id?.last_name || "N/A"}</td>
        <td>{data.booking_id?.bookingId || "N/A"}</td>
        <td>{data.booking_id?.dealer_id || "N/A"}</td>
        <td>
          {data.booking_id?.services?.length > 0 ? (
            <ul className="mb-0 ps-3">
              {data.booking_id.services.map((srv, i) => (
                <li key={i}>{srv.name}</li>
              ))}
            </ul>
          ) : (
            "N/A"
          )}
        </td>
        <td>{data.reward_points || 0}</td>
        <td>{data.is_scratched ? "Yes" : "No"}</td>
        <td>{new Date(data.created_at).toLocaleDateString()}</td>
      </tr>
    ));
  }, [currentData, currentPage]);

  return (
    <div className="row">
      <div className="col-sm-12">
        <div className="card-table card p-2">
          <div className="card-body">
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="table-responsive">
              <table ref={tableRef} id="example" className="table table-striped">
                <thead className="thead-light" style={{ backgroundColor: "#2e83ff", color: "#fff" }}>
                  <tr>{tableHeaders.map((header, index) => (<th key={index}>{header}</th>))}</tr>
                </thead>

                <tbody className="list">
                  {loading ? (
                    <tr>
                      <td colSpan={tableHeaders.length} className="text-center py-5">
                        <div className="spinner-border text-primary" role="status" style={{ width: "3rem", height: "3rem" }}>
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div className="mt-2">Loading Offers...</div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={tableHeaders.length} className="text-center py-5">
                        <div className="d-flex flex-column align-items-center text-muted">
                          <i className="fa fa-box-open mb-3" style={{ fontSize: "2rem", color: "#adb5bd" }}></i>
                          <h6 className="mb-1" style={{ fontWeight: 600 }}>No Offers Found</h6>
                          <p style={{ fontSize: "0.9rem", color: "#6c757d", margin: 0 }}>
                            Try adding a new offer or refreshing the page.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    memoizedRowList
                  )}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-between align-items-center mt-4 p-3 bg-light rounded shadow-sm">
              <div className="text-muted" style={{ fontWeight: "500", fontSize: "0.9rem" }}>
                Total Records: <span className="text-primary fw-bold">{filteredData.length}</span>
              </div>

              <nav aria-label="Page navigation">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>&laquo;</button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                      <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>&raquo;</button>
                  </li>
                </ul>
              </nav>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Reward;

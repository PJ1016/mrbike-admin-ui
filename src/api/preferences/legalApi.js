import { prefApiRequest } from "./prefApiClient";

const BASE = "/preferences/legal";

// Fixed set of legal document types — not a user-creatable list, so there is
// no create/delete surface, only fetch + update (each type is a singleton).
export const LEGAL_DOC_TYPES = [
  { key: "user-privacy-policy", label: "User Privacy Policy", audience: "User" },
  { key: "user-terms-conditions", label: "User Terms & Conditions", audience: "User" },
  { key: "dealer-privacy-policy", label: "Dealer Privacy Policy", audience: "Dealer" },
  { key: "dealer-terms-conditions", label: "Dealer Terms & Conditions", audience: "Dealer" },
  { key: "refund-policy", label: "Refund Policy", audience: "Both" },
  { key: "cancellation-policy", label: "Cancellation Policy", audience: "Both" },
  { key: "about-us", label: "About Us", audience: "Both" },
  { key: "contact-us", label: "Contact Us", audience: "Both" },
];

export const getLegalDocuments = () => prefApiRequest("GET", BASE);
export const getLegalDocumentByType = (docType) => prefApiRequest("GET", `${BASE}/${docType}`);
export const updateLegalDocument = (docType, payload) => prefApiRequest("PUT", `${BASE}/${docType}`, payload);
export const toggleLegalDocumentStatus = (docType, status) =>
  prefApiRequest("PATCH", `${BASE}/${docType}/status`, { status });

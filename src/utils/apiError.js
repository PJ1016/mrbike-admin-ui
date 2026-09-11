import Swal from "sweetalert2";

// Every backend surface in this project answers failures with
// { success: false, message, ... } and sometimes extra detail
// (`missingDocuments`, `field`, mongoose `errors`). The old inline
// `error.response?.data?.message || "Something went wrong!"` pattern lost all
// of that the moment a component wrapped the call in its own try/catch and
// hardcoded a generic string, so a real 400 ("Commission must be between
// 0-100%") surfaced as "Something went wrong". These helpers are the single
// place that turns an axios error into text an admin can act on.

const GENERIC_FALLBACK = "Something went wrong. Please try again.";

// Used only when the response carried no usable message of its own.
const STATUS_FALLBACKS = {
  400: "The server rejected the request. Please check the entered details.",
  401: "Your session has expired. Please log in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  405: "This action is not supported by the server.",
  409: "This record already exists.",
  413: "The uploaded files are too large. Please upload smaller images.",
  415: "Unsupported file type. Please upload a valid file.",
  422: "Some of the submitted details are invalid.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "The server encountered an error. Please try again.",
  502: "The server is unreachable right now. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The server took too long to respond. Please try again.",
};

const isFilledString = (value) =>
  typeof value === "string" && value.trim().length > 0;

// Proxies / CDNs answer with an HTML error page on 502/504; showing its markup
// in a dialog is worse than the status fallback.
const looksLikeHtml = (value) =>
  isFilledString(value) && /^\s*(<!doctype|<html)/i.test(value);

const clean = (value) => (isFilledString(value) ? value.trim() : "");

// `errors` shows up in three shapes across this backend: a string array, an
// array of { field, message|msg } objects, and a mongoose ValidationError
// `errors` map keyed by path.
const collectFieldMessages = (errors) => {
  if (!errors) return [];

  const entries = Array.isArray(errors) ? errors : Object.values(errors);

  return entries
    .map((entry) => {
      if (isFilledString(entry)) return entry.trim();
      if (!entry || typeof entry !== "object") return "";
      const message = clean(entry.message || entry.msg || entry.error);
      const field = clean(entry.field || entry.param || entry.path);
      if (!message) return field;
      return field ? `${field}: ${message}` : message;
    })
    .filter(Boolean);
};

const collectDetails = (data) => {
  const details = [];

  if (Array.isArray(data.missingDocuments) && data.missingDocuments.length) {
    details.push(`Missing: ${data.missingDocuments.join(", ")}`);
  }
  if (Array.isArray(data.missingFields) && data.missingFields.length) {
    details.push(`Required: ${data.missingFields.join(", ")}`);
  }

  details.push(...collectFieldMessages(data.errors));
  details.push(...collectFieldMessages(data.validationErrors));

  return details;
};

/**
 * Pull the most specific human-readable message out of an axios/fetch error.
 * Never returns an empty string — falls back to the status text, then to
 * `fallback`.
 */
export const getApiErrorMessage = (error, fallback = GENERIC_FALLBACK) => {
  if (!error) return fallback;

  // A message we attached ourselves (see normalizeApiError) always wins.
  if (isFilledString(error.userMessage)) return error.userMessage.trim();

  const response = error.response;

  // No response at all: network down, CORS, DNS, timeout or abort.
  if (!response) {
    if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
      return "The request was cancelled.";
    }
    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT" ||
      /timeout/i.test(error.message || "")
    ) {
      return "The request timed out. Please try again.";
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return "You appear to be offline. Please check your internet connection.";
    }
    return "Could not reach the server. Please check your connection and try again.";
  }

  const { status, data } = response;
  const statusFallback = STATUS_FALLBACKS[status];

  // Some endpoints (and most proxies) answer with a bare string body.
  if (isFilledString(data)) {
    if (!looksLikeHtml(data)) return data.trim();
    return statusFallback || fallback;
  }

  if (data && typeof data === "object") {
    const primary =
      clean(data.message) ||
      clean(data.msg) ||
      clean(data.detail) ||
      clean(typeof data.error === "string" ? data.error : data.error?.message);

    const details = collectDetails(data);

    if (primary && details.length) {
      // Avoid "Missing required documents — Missing: PAN Card Front" reading
      // as a duplicate when the detail already restates the message.
      const merged = details.filter(
        (d) => d.toLowerCase() !== primary.toLowerCase(),
      );
      return merged.length ? `${primary} (${merged.join("; ")})` : primary;
    }
    if (primary) return primary;
    if (details.length) return details.join("; ");
  }

  return statusFallback || fallback;
};

/**
 * Field-level errors keyed by form field name, for wiring an API rejection
 * back into the form that produced it. Returns `{}` when there are none.
 */
export const getApiFieldErrors = (error, fieldAliases = {}) => {
  const data = error?.response?.data;
  if (!data || typeof data !== "object") return {};

  const resolve = (name) => {
    const key = clean(name);
    if (!key) return "";
    return fieldAliases[key] || fieldAliases[key.toLowerCase()] || key;
  };

  const fieldErrors = {};

  // Single-field conflicts: { field: "shop-email", message: "..." }
  if (isFilledString(data.field)) {
    const target = resolve(data.field);
    if (target) fieldErrors[target] = clean(data.message) || "Invalid value";
  }

  const fromList = (errors) => {
    if (!errors) return;
    const entries = Array.isArray(errors)
      ? errors.map((e) => [e?.field || e?.param || e?.path, e])
      : Object.entries(errors);

    entries.forEach(([name, entry]) => {
      const target = resolve(name);
      if (!target) return;
      const message = isFilledString(entry)
        ? entry.trim()
        : clean(entry?.message || entry?.msg || entry?.error);
      fieldErrors[target] = message || "Invalid value";
    });
  };

  fromList(data.errors);
  fromList(data.validationErrors);

  return fieldErrors;
};

/**
 * Attach the resolved message to the error before rethrowing, so callers that
 * only log or re-wrap it still carry something displayable.
 */
export const normalizeApiError = (error, fallback) => {
  if (error && typeof error === "object" && !error.userMessage) {
    error.userMessage = getApiErrorMessage(error, fallback);
  }
  return error;
};

/** Show an API failure in the standard error dialog. */
export const showApiError = (error, title = "Error", fallback) =>
  Swal.fire({
    icon: "error",
    title,
    text: getApiErrorMessage(error, fallback),
  });

export default getApiErrorMessage;

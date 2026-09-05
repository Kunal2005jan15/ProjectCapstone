import axios from "axios";

// The ml-service is a separate deployed service from the backend (see
// ml-service/documents/Live_Integration_Guide.md) — the admin dashboard's
// Demand Forecast page calls it directly rather than through the backend,
// so it needs its own base URL and its own axios instance. No auth token
// is attached here: /forecast/live is a public read endpoint (no shop data
// is exposed beyond what the logged-in owner already has access to via the
// menu-items call that supplies the item_id).
const ML_SERVICE_URL =
  import.meta.env.VITE_ML_SERVICE_URL || "http://localhost:8000";

const mlApi = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30000, // Prophet can take a few seconds to train on first call for an item
});

export const mlApiError = (err) => {
  if (err?.code === "ERR_NETWORK") {
    return "Can't reach the ML service — is it running / deployed, and is VITE_ML_SERVICE_URL set correctly?";
  }
  return err?.response?.data?.detail || err?.message || "Something went wrong";
};

export default mlApi;

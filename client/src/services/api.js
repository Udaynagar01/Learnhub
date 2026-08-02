import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let refreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !refreshing
    ) {
      original._retry = true;
      refreshing = true;

      try {
        const { data } = await axios.post(
          `${API_URL}/api/v1/auth/refresh`,
          {},
          {
            withCredentials: true,
          }
        );

        localStorage.setItem("accessToken", data.data.accessToken);

        original.headers.Authorization = `Bearer ${data.data.accessToken}`;

        refreshing = false;

        return api(original);
      } catch (err) {
        refreshing = false;
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
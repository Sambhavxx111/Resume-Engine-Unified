import axios from "axios";
import { getApiBaseUrl } from "./baseUrl";

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      window.dispatchEvent(new CustomEvent("auth:logout"));
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

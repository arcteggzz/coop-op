import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL as string,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("coop_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      localStorage.removeItem("coop_token");
      localStorage.removeItem("coop_user");
      localStorage.removeItem("coop_user_type");
      localStorage.removeItem("coop_cooperatives");
      localStorage.removeItem("coop_active_coop_id");
      window.location.href = "/";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;

export function isForbiddenError(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 403;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      "Something went wrong"
    );
  }
  return "Something went wrong";
}

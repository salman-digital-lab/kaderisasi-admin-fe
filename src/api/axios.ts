import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_PUBLIC_BE_ADMIN_API as string,
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default instance;

import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.API || "http://localhost:3000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

import type { AxiosError, AxiosResponse } from "axios";

api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("Response:", response);
    return response;
  },
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
)
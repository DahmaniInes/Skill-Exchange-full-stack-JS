import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true, // Keep this if you need cookies; otherwise, remove it for JWTs
});

// Request Interceptor: Attach JWT token from local storage
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwtToken"); // Ensure this matches the key used in handleLogin
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`; // Attach the JWT token
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});
// In your axiosInstance.js
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

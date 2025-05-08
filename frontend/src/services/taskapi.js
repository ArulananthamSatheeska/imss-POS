import axios from "axios";

const api = axios.create({
  baseURL: "https://sharvakshafoodcity.com.lk/backend/public/api", // Replace with your Laravel API URL
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;

import axios from "axios";
import { toast } from "react-toastify";

// Create an Axios instance with base configuration
const api = axios.create({
  baseURL: "http://127.0.0.1:8080/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || "An unexpected error occurred";
    toast.error(message);
    return Promise.reject(error);
  }
);

// Production Categories
export const getProductionCategories = () => api.get("/categories");
export const createProductionCategory = (data) =>
  api.post("/categories", data);
export const updateProductionCategory = (id, data) =>
  api.put(`/categories/${id}`, data);
export const deleteProductionCategory = (id) =>
  api.delete(`/categories/${id}`);

// Raw Materials
export const getRawMaterials = () => api.get("/raw-materials");
export const createRawMaterial = (data) => api.post("/raw-materials", data);
export const updateRawMaterial = (id, data) =>
  api.put(`/raw-materials/${id}`, data);
export const deleteRawMaterial = (id) => api.delete(`/raw-materials/${id}`);

// Suppliers and Units (required for RawMaterialModal)
export const getSuppliers = () => api.get("/suppliers");
export const getUnits = () => api.get("/units");

// Production Items
export const getProductionItems = () => api.get("/production-items");
export const createProductionItem = (data) =>
  api.post("/production-items", data);
export const updateProductionItem = (id, data) =>
  api.put(`/production-items/${id}`, data);
export const deleteProductionItem = (id) =>
  api.delete(`/production-items/${id}`);

// Optionally export the Axios instance for custom requests
export { api };

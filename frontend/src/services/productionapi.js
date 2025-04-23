import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});


// Add request interceptor for auth token if needed
api.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getRawMaterials = () => api.get('/raw-materials');
export const createRawMaterial = (data) => api.post('/raw-materials', data);
export const updateRawMaterial = (id, data) => api.put(`/raw-materials/${id}`, data);
export const deleteRawMaterial = (id) => api.delete(`/raw-materials/${id}`);

export const getProductionCategories = () => api.get('/production-categories');
export const createProductionCategory = (data) => api.post('/production-categories', data);
export const updateProductionCategory = (id, data) => api.put(`/production-categories/${id}`, data);
export const deleteProductionCategory = (id) => api.delete(`/production-categories/${id}`);

export const getProductionItems = () => api.get('/production-items');
export const createProductionItem = (data) => api.post('/production-items', data);
export const updateProductionItem = (id, data) => api.put(`/production-items/${id}`, data);
export const deleteProductionItem = (id) => api.delete(`/production-items/${id}`);
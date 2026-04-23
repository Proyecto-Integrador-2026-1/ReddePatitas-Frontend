import axios from 'axios';
import { getValidToken } from '../utils/jwt';

const api = axios.create({
  baseURL: 'http://localhost:8081', // Servicio de Reportes
});

api.interceptors.request.use((config) => {
  const token = getValidToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;
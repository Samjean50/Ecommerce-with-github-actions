import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const getProducts = () => {
  return axios.get(`${API_BASE_URL}/api/products`);
};
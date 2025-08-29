import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8081/api", // backend URL from application.properties
});

// ✅ Signup request
export const signupUser = async (userData) => {
  const response = await API.post("/auth/signup", userData);
  return response.data;
};

// ✅ Login request
export const loginUser = async (credentials) => {
  const response = await API.post("/auth/login", credentials);
  return response.data.token; // assuming backend returns { token: "..." }
};

// ✅ Get user profile (needs token)
export const getUserProfile = async (id, token) => {
  const response = await API.get(`/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

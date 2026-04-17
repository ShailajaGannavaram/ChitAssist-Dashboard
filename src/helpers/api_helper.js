import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://chitassistant.onrender.com";

const axiosApi = axios.create({
  baseURL: API_URL,
});

// Add token to every request automatically
axiosApi.interceptors.request.use((config) => {
  const authUser = localStorage.getItem("authUser");
  if (authUser) {
    const user = JSON.parse(authUser);
    if (user.access) {
      config.headers["Authorization"] = `Bearer ${user.access}`;
    }
  }
  return config;
});

axiosApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export async function get(url, config = {}) {
  return await axiosApi.get(url, { ...config }).then((response) => response.data);
}

export async function post(url, data, config = {}) {
  return axiosApi.post(url, { ...data }, { ...config }).then((response) => response.data);
}

export async function put(url, data, config = {}) {
  return axiosApi.put(url, { ...data }, { ...config }).then((response) => response.data);
}

export async function del(url, config = {}) {
  return await axiosApi.delete(url, { ...config }).then((response) => response.data);
}
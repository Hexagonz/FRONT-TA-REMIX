import Axios, { type AxiosInstance } from "axios";

const axios: AxiosInstance = Axios.create({
  baseURL: "http://localhost:3000/api/v1",
  timeout: 1000,

});

axios.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Coba refresh token
      const res = await axios.post("/refresh"); // hanya trigger session update

      if (res.status === 200) {
        // Ulangi request lama
        return axios(originalRequest);
      }
    }

    return Promise.reject(err);
  }
);


export default axios;
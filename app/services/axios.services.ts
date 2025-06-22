import Axios, { type AxiosInstance } from "axios";

const axios: AxiosInstance = Axios.create({
  baseURL: "http://localhost:3003/api/v1",
  timeout: 1000,

});

axios.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;

    if (err.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const res = await axios.post("/refresh");

      if (res.status === 200) {
        return axios(originalRequest);
      }
    }

    return Promise.reject(err);
  }
);


export default axios;
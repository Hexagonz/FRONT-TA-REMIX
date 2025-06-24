import Axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";
import Cookies from "js-cookie";
import { sessionStorages } from "./session.browser";


interface CustomInternalAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const axios: AxiosInstance = Axios.create({
  baseURL: "http://localhost:3000/api/v1",
  timeout: 5000,
});

axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = sessionStorages.getSession("access_token");

    const isAuthRoute =
      config.url?.includes("/login") || config.url?.includes("/refresh");

    if (token && !isAuthRoute) {
      if (config.headers && typeof config.headers.set === "function") {
        config.headers.set("Authorization", `Bearer ${token}`);
      } else if (typeof config.headers === "object") {
        (config.headers as any)["Authorization"] = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);



// === Response Interceptor ===
axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomInternalAxiosRequestConfig;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refreshToken");
        if (!refreshToken) throw new Error("Refresh token tidak ditemukan.");
        const res = await Axios.post(
          "http://localhost:3000/api/v1/refresh",
          null,
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const newAccessToken = res.data.data.access_token;
        sessionStorages.commitSession("access_token", newAccessToken);

        if (
          originalRequest.headers &&
          typeof originalRequest.headers.set === "function"
        ) {
          originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        } else if (typeof originalRequest.headers === "object") {
          (originalRequest.headers as any)["Authorization"] = `Bearer ${newAccessToken}`;
        }

        return axios(originalRequest);
      } catch (refreshError) {
        sessionStorages.destroySession("access_token");
        Cookies.remove("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;

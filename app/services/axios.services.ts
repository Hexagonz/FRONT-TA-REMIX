import Axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosHeaders,
} from "axios";
import Cookies from "js-cookie";
import { sessionStorages } from "./session.browser";

const axios: AxiosInstance = Axios.create({
  baseURL: "http://localhost:3001/api/v1",
  timeout: 5000,
});

const axiosPy: AxiosInstance = Axios.create({
  baseURL: "http://localhost:5005",
  timeout: 5000,
});

export {axios,axiosPy};

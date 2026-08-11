import axios, { Axios } from "axios";
import config from "@/common/utils/config";

export class RestApi {
  axios!: Axios;
  private static instance: RestApi;
  private baseUrl: string;
  public token: string;

  private constructor(baseUrl: string = "http://localhost:8000", token?: string) {
    this.baseUrl = baseUrl;
    this.token = token || "";
    if (!this.token) {
      if (typeof window !== 'undefined') {
        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
          return '';
        }
        this.token = getCookie("token");
      }
    }
    this.updateAxios();
  }

  public setBaseUrl(baseUrl: string): RestApi {
    this.baseUrl = baseUrl;
    this.updateAxios();
    return this;
  }

  public setToken(token: string): RestApi {
    this.token = token;
    this.updateAxios();
    return this;
  }

  private updateAxios(): RestApi {
    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    return this;
  }

  public static getInstance(baseUrl?: string, token?: string): RestApi {
    if (!RestApi.instance) {
      RestApi.instance = new RestApi(baseUrl, token);
    }
    return RestApi.instance;
  }
}

console.log("BACKEND_BASE_URL configured as:", config.BACKEND_BASE_URL);
export const restApi = RestApi.getInstance(config.BACKEND_BASE_URL || "http://127.0.0.1:3012/api");
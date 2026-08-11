import axios, { Axios } from "axios";
import config from "@/common/utils/config";

export class RestApi {
  axios!: Axios;
  private static instance: RestApi;
  private baseUrl: string;
  public token: string;

  private constructor(
    baseUrl: string = "http://localhost:8000",
    token?: string
  ) {
    this.baseUrl = baseUrl;
    this.token = token || "";

    if (!this.token && typeof window !== "undefined") {
      const authData = JSON.parse(
        localStorage.getItem("auth") || "{}"
      );

      this.token = authData.token || "";
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
        'ngrok-skip-browser-warning': '69420'
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

export const restApi = RestApi.getInstance(config.BACKEND_BASE_URL || "http://127.0.0.1:3012/api");
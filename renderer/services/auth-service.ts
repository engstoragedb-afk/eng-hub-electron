import { IAuth } from "@/domain/models";
import { IAuthRepository } from "@/domain/repositories";
import { IAuthService, ILoginParam } from "@/domain/services";
import { authRepository } from "@/infra/http";
import { restApi } from "@/infra/http/rest-api";
import { Service } from "@/services/service";

import { useAuthStore } from "@/store/authStore";

const setCookie = (name: string, value: string, days: number = 7) => {
    if (typeof document === 'undefined') return;
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

const removeCookie = (name: string) => {
    if (typeof document === 'undefined') return;
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
    return '';
}

class AuthService extends Service<IAuth, IAuthRepository> implements IAuthService {
    private static instance: AuthService;
    private _auth: IAuth = {} as IAuth;

    private constructor(authRepository: IAuthRepository) {
        super(authRepository);
        if (typeof window !== 'undefined' && localStorage.getItem("auth")) {
            const authData = JSON.parse(localStorage.getItem("auth") || "{}");
            const token = getCookie("token");
            this._auth = { ...authData, token } as IAuth;
        }
    }

    public static getInstance(authRepo: IAuthRepository): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService(authRepo);
        }
        return AuthService.instance;
    }

    check(): Promise<IAuth> {
        return this.repository.check();
    }

    async updateLocalStorage(authDto: IAuth): Promise<void> {
        this._auth = authDto;
        const { token, ...authData } = authDto;
        localStorage.setItem("auth", JSON.stringify(authData));
        setCookie("token", token || "", 7);
        useAuthStore.getState().setAuth(authDto);
    }

    async login(param: ILoginParam): Promise<IAuth> {
        const authDto = await this.repository.login(param);
        this._auth = authDto;
        await this.updateLocalStorage(authDto);
        restApi.setToken(authDto.token || "");
        return authDto;
    }

    auth(): Promise<IAuth> {
        return this.repository.auth();
    }

    logout(): Promise<void> {
        this._auth = {} as IAuth;
        removeCookie("token");
        localStorage.removeItem("auth");
        useAuthStore.getState().clearAuth();
        return this.repository.logout();
    }

    getAuth(): IAuth {
        return this._auth;
    }
}

export const authService = AuthService.getInstance(authRepository);
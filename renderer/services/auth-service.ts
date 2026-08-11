import { IAuth } from "@/domain/models";
import { IAuthRepository } from "@/domain/repositories";
import { IAuthService, ILoginParam } from "@/domain/services";
import { authRepository } from "@/infra/http";
import { restApi } from "@/infra/http/rest-api";
import { Service } from "@/services/service";

import { useAuthStore } from "@/store/authStore";

class AuthService extends Service<IAuth, IAuthRepository> implements IAuthService {
    private static instance: AuthService;
    private _auth: IAuth = {} as IAuth;

    private constructor(authRepository: IAuthRepository) {
        super(authRepository);
        if (typeof window !== 'undefined') {
            const authData = JSON.parse(
                localStorage.getItem("auth") || "{}"
            );

            if (authData.token) {
                this._auth = authData as IAuth;
                restApi.setToken(authData.token);
            }
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
        localStorage.setItem(
            "auth",
            JSON.stringify(authDto)
        );
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
        localStorage.removeItem("auth");
        useAuthStore.getState().clearAuth();
        return this.repository.logout();
    }

    getAuth(): IAuth {
        return this._auth;
    }
}

export const authService = AuthService.getInstance(authRepository);
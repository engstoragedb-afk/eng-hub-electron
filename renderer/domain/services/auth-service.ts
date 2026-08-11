import { IAuth } from "@/domain/models";
import { IService } from "@/domain/services/service";

export type ILoginParam = {
    email: string;
    password: string;
};

export interface IAuthService extends IService<IAuth> {
    check(): Promise<IAuth>;
    login(param: ILoginParam): Promise<IAuth>;
    updateLocalStorage(authDto: IAuth): Promise<void>;
    auth(): Promise<IAuth>;
    logout(): Promise<void>;
}
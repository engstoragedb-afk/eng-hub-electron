import { IAuth } from "@/domain/models";
import { IRepository } from "@/domain/repositories/repository";

export type ILoginParam = {
    email: string;
    password: string;
};

export interface IAuthRepository extends IRepository<IAuth> {
    check(): Promise<IAuth>;
    login(param: ILoginParam): Promise<IAuth>;
    auth(): Promise<IAuth>;
    logout(): Promise<void>;
}
import { IUsers } from "@/domain/models";

export interface IUserRepository {
    createUser(data: any): Promise<IUsers>;
    getUsersByRole(role: string, params?: { search?: string; unit?: string; location?: string }): Promise<IUsers[]>;
}

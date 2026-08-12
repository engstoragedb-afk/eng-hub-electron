import { IUsers } from "@/domain/models";

import { IRepository } from "./repository";

export interface IUserRepository extends IRepository<IUsers> {
    createUser(data: any): Promise<IUsers>;
    getUsersByRole(role: string, params?: { search?: string; unit?: string; location?: string }): Promise<IUsers[]>;
}

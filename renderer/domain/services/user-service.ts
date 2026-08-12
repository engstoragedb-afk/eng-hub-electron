import { IUsers } from "@/domain/models";

import { IService } from "./service";

export interface IUserService extends IService<IUsers> {
    createUser(data: any): Promise<IUsers>;
    getUsersByRole(role: string, params?: { search?: string; unit?: string; location?: string }): Promise<IUsers[]>;
}

import { IUsers } from "@/domain/models";
import { IUserRepository } from "@/domain/repositories/user-repository";
import { restApi } from "./rest-api";

export class UserRepository implements IUserRepository {
    async createUser(data: any): Promise<IUsers> {
        const response = await restApi.axios.post('/user', data);
        return response.data?.data || response.data;
    }

    async getUsersByRole(role: string, params?: { search?: string; unit?: string; location?: string }): Promise<IUsers[]> {
        const response = await restApi.axios.get(`/user/role/${role}`, { params });
        return response.data?.data || response.data;
    }
}

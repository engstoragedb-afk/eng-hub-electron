import { IUsers } from "@/domain/models";
import { IUserRepository } from "@/domain/repositories/user-repository";
import { Repository } from "@/infra/http/repository";

export class UserRepository extends Repository<IUsers> implements IUserRepository {
    private static instance: UserRepository;

    private constructor(baseUrl: string = "/user") {
        super(baseUrl);
    }

    public static getInstance(): UserRepository {
        if (!UserRepository.instance) {
            UserRepository.instance = new UserRepository();
        }
        return UserRepository.instance;
    }

    async createUser(data: any): Promise<IUsers> {
        const response = await this.restApi.axios.post(this.baseUrl, data);
        return response.data?.data || response.data;
    }

    async getUsersByRole(role: string, params?: { search?: string; unit?: string; location?: string }): Promise<IUsers[]> {
        const response = await this.restApi.axios.get(`${this.baseUrl}/role/${role}`, { params });
        return response.data?.data || response.data;
    }
}

export const userRepository = UserRepository.getInstance();

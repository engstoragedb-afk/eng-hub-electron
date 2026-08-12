import { IUsers } from "@/domain/models";
import { IUserService } from "@/domain/services/user-service";
import { IUserRepository } from "@/domain/repositories/user-repository";
import { userRepository } from "@/infra/http/user-repository";
import { Service } from "@/services/service";

class UserService extends Service<IUsers, IUserRepository> implements IUserService {
    private static instance: UserService;

    private constructor(repository: IUserRepository) {
        super(repository);
    }

    public static getInstance(repository: IUserRepository): UserService {
        if (!UserService.instance) {
            UserService.instance = new UserService(repository);
        }
        return UserService.instance;
    }

    async createUser(data: any): Promise<IUsers> {
        try {
            return await this.repository.createUser(data);
        } catch (error) {
            throw error;
        }
    }

    async getUsersByRole(role: string, params?: { search?: string; unit?: string; location?: string }): Promise<IUsers[]> {
        try {
            return await this.repository.getUsersByRole(role, params);
        } catch (error) {
            throw error;
        }
    }
}

export const userService = UserService.getInstance(userRepository);

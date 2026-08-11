import { IUsers } from "@/domain/models";
import { IUserService } from "@/domain/services/user-service";
import { IUserRepository } from "@/domain/repositories/user-repository";
import { UserRepository } from "@/infra/http/user-repository";

class UserService implements IUserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(data: any): Promise<IUsers> {
    try {
      return await this.userRepository.createUser(data);
    } catch (error) {
      throw error;
    }
  }

  async getUsersByRole(role: string, params?: { search?: string; unit?: string; location?: string }): Promise<IUsers[]> {
    try {
      return await this.userRepository.getUsersByRole(role, params);
    } catch (error) {
      throw error;
    }
  }
}

export const userService = new UserService(new UserRepository());

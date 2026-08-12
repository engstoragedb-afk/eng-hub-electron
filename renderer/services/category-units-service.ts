import { ICategoryUnitsRepository } from "@/domain/repositories/category-units-repository";
import { ICategoryUnitsService } from "@/domain/services/category-units-service";
import { categoryUnitsRepository } from "@/infra/http/category-units-repository";
import { ICategoryUnit } from "@/domain/models";
import { Service } from "@/services/service";

export class CategoryUnitsService extends Service<ICategoryUnit, ICategoryUnitsRepository> implements ICategoryUnitsService {
    private static instance: CategoryUnitsService;

    private constructor(repository: ICategoryUnitsRepository) {
        super(repository);
    }

    public static getInstance(repository: ICategoryUnitsRepository): CategoryUnitsService {
        if (!CategoryUnitsService.instance) {
            CategoryUnitsService.instance = new CategoryUnitsService(repository);
        }
        return CategoryUnitsService.instance;
    }

    async getAll(): Promise<ICategoryUnit[]> {
        return this.repository.getAll();
    }
}

export const categoryUnitsService = CategoryUnitsService.getInstance(categoryUnitsRepository);

import { ICategoryUnitsRepository } from "@/domain/repositories/category-units-repository";
import { CategoryUnitsRepository } from "@/infra/http/category-units-repository";
import { restApi } from "@/infra/http/rest-api";
import { ICategoryUnit } from "@/domain/models";

export class CategoryUnitsService {
    private categoryUnitsRepo: ICategoryUnitsRepository;

    constructor(categoryUnitsRepo?: ICategoryUnitsRepository) {
        this.categoryUnitsRepo = categoryUnitsRepo || new CategoryUnitsRepository(restApi);
    }

    async getAll(): Promise<ICategoryUnit[]> {
        return this.categoryUnitsRepo.getAll();
    }
}

export const categoryUnitsService = new CategoryUnitsService();

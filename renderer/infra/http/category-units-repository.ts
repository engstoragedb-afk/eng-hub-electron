import { ICategoryUnitsRepository } from "@/domain/repositories/category-units-repository";
import { ICategoryUnit, CategoryUnit } from "@/domain/models";
import { Repository } from "@/infra/http/repository";

export class CategoryUnitsRepository extends Repository<ICategoryUnit> implements ICategoryUnitsRepository {
    private static instance: CategoryUnitsRepository;

    private constructor(baseUrl: string = "/category-units") {
        super(baseUrl);
    }

    public static getInstance(): CategoryUnitsRepository {
        if (!CategoryUnitsRepository.instance) {
            CategoryUnitsRepository.instance = new CategoryUnitsRepository();
        }
        return CategoryUnitsRepository.instance;
    }

    async getAll(): Promise<ICategoryUnit[]> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/all`);
        const items = data.data || [];
        return items.map((item: any) => CategoryUnit.create(item).unmarshall());
    }
}

export const categoryUnitsRepository = CategoryUnitsRepository.getInstance();

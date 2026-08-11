import { ICategoryUnitsRepository } from "@/domain/repositories/category-units-repository";
import { ICategoryUnit, CategoryUnit } from "@/domain/models";
import { RestApi } from "@/infra/http/rest-api";

export class CategoryUnitsRepository implements ICategoryUnitsRepository {
    constructor(private readonly restApi: RestApi) {}

    async getAll(): Promise<ICategoryUnit[]> {
        const { data } = await this.restApi.axios.get('/category-units/all');
        const items = data.data || [];
        return items.map((item: any) => CategoryUnit.create(item).unmarshall());
    }
}

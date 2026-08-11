import { ITypeUnitRepository } from "@/domain/repositories/type-unit-repository";
import { ITypeUnit, TypeUnit } from "@/domain/models/type-unit";
import { RestApi } from "@/infra/http/rest-api";

export class TypeUnitRepository implements ITypeUnitRepository {
    constructor(private readonly restApi: RestApi) {}

    async getTypeUnits(): Promise<ITypeUnit[]> {
        const { data } = await this.restApi.axios.get('/type-units');
        const items = data.data?.data || data.data || [];
        return Array.isArray(items) ? items.map((item: any) => TypeUnit.create(item).unmarshall()) : [];
    }
}

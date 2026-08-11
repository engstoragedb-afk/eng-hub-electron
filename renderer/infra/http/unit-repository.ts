import { IUnitRepository, IUnitGetParams, IPaginatedResponse } from "@/domain/repositories/unit-repository";
import { IUnit, Unit } from "@/domain/models";
import { RestApi } from "@/infra/http/rest-api";

export class UnitRepository implements IUnitRepository {
    constructor(private readonly restApi: RestApi) {}

    async getUnitDetails(id: string): Promise<IUnit> {
        const { data } = await this.restApi.axios.get(`/units/${id}`);
        return Unit.create(data.data || data).unmarshall();
    }

    async getAllUnits(params?: IUnitGetParams): Promise<IUnit[]> {
        const { data } = await this.restApi.axios.get(`/units/all`, { params });
        const resData = data.data || data;
        return resData.map((item: any) => Unit.create(item).unmarshall());
    }

    async getUnitsByCategory(categoryId: string, params?: IUnitGetParams): Promise<IPaginatedResponse<IUnit>> {
        const { data } = await this.restApi.axios.get(`/units/category/${categoryId}`, { params });
        const resData = data.data; // this is the paginated object { page, limit, totalRow, data }
        return {
            page: resData.page,
            limit: resData.limit,
            totalRow: resData.totalRow,
            data: resData.data.map((item: any) => Unit.create(item).unmarshall())
        };
    }

    async updateUnit(id: string, data: Partial<IUnit>): Promise<IUnit> {
        const res = await this.restApi.axios.patch(`/units/${id}`, data);
        return Unit.create(res.data.data || res.data).unmarshall();
    }
}

import { IUnitRepository, IUnitGetParams, IPaginatedResponse, ICreateUnitPayload } from "@/domain/repositories/unit-repository";
import { IUnit, Unit } from "@/domain/models";
import { Repository } from "@/infra/http/repository";

export class UnitRepository extends Repository<IUnit> implements IUnitRepository {
    private static instance: UnitRepository;

    private constructor(baseUrl: string = "/units") {
        super(baseUrl);
    }

    public static getInstance(): UnitRepository {
        if (!UnitRepository.instance) {
            UnitRepository.instance = new UnitRepository();
        }
        return UnitRepository.instance;
    }

    async getUnitDetails(id: string): Promise<IUnit> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/${id}`);
        return Unit.create(data.data || data).unmarshall();
    }

    async getAllUnits(params?: IUnitGetParams): Promise<IUnit[]> {
        try {
            const { data } = await this.restApi.axios.get(`${this.baseUrl}/all`, { params });
            const resData = data.data || data;
            if (Array.isArray(resData)) {
                return resData.map((item: any) => Unit.create(item).unmarshall());
            }
            return [];
        } catch (error) {
            console.warn("Falling back getAllUnits to getAllUnitsWithDetail:", error);
            try {
                const data = await this.getAllUnitsWithDetail(params);
                if (Array.isArray(data)) {
                    return data.map((item: any) => Unit.create({
                        ...item,
                        name: item.code || item.name || item.unit_name || "Unknown",
                    }).unmarshall());
                }
            } catch (fallbackErr) {
                console.error("Fallback getAllUnitsWithDetail failed:", fallbackErr);
            }
            return [];
        }
    }

    async getAllUnitsWithDetail(params?: IUnitGetParams): Promise<any[]> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/all/details`, { params });
        const resData = data.data || data;
        return resData;
    }

    async getUnitsByCategory(categoryId: string, params?: IUnitGetParams): Promise<IPaginatedResponse<IUnit>> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/category/${categoryId}`, { params });
        const resData = data.data; // this is the paginated object { page, limit, totalRow, data }
        return {
            page: resData.page,
            limit: resData.limit,
            totalRow: resData.totalRow,
            data: resData.data.map((item: any) => Unit.create(item).unmarshall())
        };
    }

    async getUnitsDetailsByCategory(categoryId?: string): Promise<any[]> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/details/category`, { params: { categoryId } });
        return data.data || data || [];
    }

    async updateUnit(id: string, data: Partial<IUnit>): Promise<IUnit> {
        const res = await this.restApi.axios.patch(`${this.baseUrl}/${id}`, data);
        return Unit.create(res.data.data || res.data).unmarshall();
    }

    async createUnit(data: ICreateUnitPayload): Promise<IUnit> {
        const res = await this.restApi.axios.post(this.baseUrl, data);
        return Unit.create(res.data.data || res.data).unmarshall();
    }

    async deleteUnit(id: string): Promise<void> {
        await this.restApi.axios.delete(`${this.baseUrl}/${id}`);
    }

    async uploadHoursFromExcel(file: File): Promise<any[]> {
        const formData = new FormData();
        formData.append('file', file);
        const res = await this.restApi.axios.post(`${this.baseUrl}/import/hours`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.data || res.data || [];
    }
}

export const unitRepository = UnitRepository.getInstance();

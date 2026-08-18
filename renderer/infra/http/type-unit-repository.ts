import { ITypeUnitRepository } from "@/domain/repositories/type-unit-repository";
import { ITypeUnit, TypeUnit } from "@/domain/models/type-unit";
import { Repository } from "@/infra/http/repository";

export class TypeUnitRepository extends Repository<ITypeUnit> implements ITypeUnitRepository {
    private static instance: TypeUnitRepository;

    private constructor(baseUrl: string = "/type-units") {
        super(baseUrl);
    }

    public static getInstance(): TypeUnitRepository {
        if (!TypeUnitRepository.instance) {
            TypeUnitRepository.instance = new TypeUnitRepository();
        }
        return TypeUnitRepository.instance;
    }

    async getTypeUnits(): Promise<ITypeUnit[]> {
        const { data } = await this.restApi.axios.get(this.baseUrl);
        const items = data.data?.data || data.data || [];
        return Array.isArray(items) ? items.map((item: any) => TypeUnit.create(item).unmarshall()) : [];
    }

    async createTypeUnit(name: string): Promise<ITypeUnit> {
        const { data } = await this.restApi.axios.post(this.baseUrl, { name });
        const item = data.data || data;
        return TypeUnit.create(item).unmarshall();
    }
}

export const typeUnitRepository = TypeUnitRepository.getInstance();

import { Repository } from "@/infra/http/repository";
import { IAplUnitRepository, UpsertAplUnitPayload } from "@/domain/repositories";
import { IAplUnit, AplUnit } from "@/domain/models/apl-unit";

export class AplUnitRepository extends Repository<IAplUnit> implements IAplUnitRepository {
    private static instance: AplUnitRepository;

    private constructor(baseUrl: string = "/apl-units") {
        super(baseUrl);
    }

    public static getInstance(): AplUnitRepository {
        if (!AplUnitRepository.instance) {
            AplUnitRepository.instance = new AplUnitRepository();
        }
        return AplUnitRepository.instance;
    }

    async upsertAplUnit(data: UpsertAplUnitPayload): Promise<IAplUnit> {
        const res = await this.restApi.axios.post(`${this.baseUrl}/upsert`, data);
        return AplUnit.create(res.data.data || res.data).unmarshall();
    }
}

export const aplUnitRepository = AplUnitRepository.getInstance();

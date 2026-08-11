import { RestApi } from "@/infra/http/rest-api";
import { IAplUnitRepository, UpsertAplUnitPayload } from "@/domain/repositories";
import { IAplUnit, AplUnit } from "@/domain/models/apl-unit";

export class AplUnitRepository implements IAplUnitRepository {
    constructor(private readonly restApi: RestApi) {}

    async upsertAplUnit(data: UpsertAplUnitPayload): Promise<IAplUnit> {
        const res = await this.restApi.axios.post('/apl-units/upsert', data);
        return AplUnit.create(res.data.data || res.data).unmarshall();
    }
}

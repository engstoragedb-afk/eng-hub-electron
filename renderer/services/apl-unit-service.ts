import { IAplUnitService } from "@/domain/services/apl-unit-service";
import { IAplUnitRepository, UpsertAplUnitPayload } from "@/domain/repositories/apl-unit-repository";
import { aplUnitRepository } from "@/infra/http/apl-unit-repository";
import { IAplUnit } from "@/domain/models/apl-unit";
import { Service } from "@/services/service";

export class AplUnitService extends Service<IAplUnit, IAplUnitRepository> implements IAplUnitService {
    private static instance: AplUnitService;

    private constructor(aplUnitRepo: IAplUnitRepository) {
        super(aplUnitRepo);
    }

    public static getInstance(aplUnitRepo: IAplUnitRepository): AplUnitService {
        if (!AplUnitService.instance) {
            AplUnitService.instance = new AplUnitService(aplUnitRepo);
        }
        return AplUnitService.instance;
    }

    async upsertAplUnit(data: UpsertAplUnitPayload): Promise<IAplUnit> {
        return this.repository.upsertAplUnit(data);
    }
}

export const aplUnitService = AplUnitService.getInstance(aplUnitRepository);

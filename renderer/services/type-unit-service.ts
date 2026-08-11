import { ITypeUnitRepository } from "@/domain/repositories/type-unit-repository";
import { TypeUnitRepository } from "@/infra/http/type-unit-repository";
import { restApi } from "@/infra/http/rest-api";
import { ITypeUnit } from "@/domain/models/type-unit";

export class TypeUnitService {
    private typeUnitRepo: ITypeUnitRepository;

    constructor() {
        this.typeUnitRepo = new TypeUnitRepository(restApi);
    }

    async getTypeUnits(): Promise<ITypeUnit[]> {
        return this.typeUnitRepo.getTypeUnits();
    }
}

export const typeUnitService = new TypeUnitService();

import { IUnitRepository, IUnitGetParams, IPaginatedResponse } from "@/domain/repositories/unit-repository";
import { UnitRepository } from "@/infra/http/unit-repository";
import { restApi } from "@/infra/http/rest-api";
import { IUnit } from "@/domain/models";

export class UnitService {
    private unitRepo: IUnitRepository;

    constructor(unitRepo?: IUnitRepository) {
        this.unitRepo = unitRepo || new UnitRepository(restApi);
    }

    async getUnitDetails(id: string): Promise<IUnit> {
        return this.unitRepo.getUnitDetails(id);
    }

    async getUnitsByCategory(categoryId: string, params?: IUnitGetParams): Promise<IPaginatedResponse<IUnit>> {
        return this.unitRepo.getUnitsByCategory(categoryId, params);
    }

    async getAllUnits(params?: IUnitGetParams): Promise<IUnit[]> {
        return this.unitRepo.getAllUnits(params);
    }

    async updateUnit(id: string, data: Partial<IUnit>): Promise<IUnit> {
        return this.unitRepo.updateUnit(id, data);
    }
}

export const unitService = new UnitService();

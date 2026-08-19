import { IUnitRepository, IUnitGetParams, IPaginatedResponse, ICreateUnitPayload } from "@/domain/repositories/unit-repository";
import { IUnitService } from "@/domain/services/unit-service";
import { unitRepository } from "@/infra/http/unit-repository";
import { IUnit } from "@/domain/models";
import { Service } from "@/services/service";

export class UnitService extends Service<IUnit, IUnitRepository> implements IUnitService {
    private static instance: UnitService;

    private constructor(repository: IUnitRepository) {
        super(repository);
    }

    public static getInstance(repository: IUnitRepository): UnitService {
        if (!UnitService.instance) {
            UnitService.instance = new UnitService(repository);
        }
        return UnitService.instance;
    }

    async getUnitDetails(id: string): Promise<IUnit> {
        return this.repository.getUnitDetails(id);
    }

    async getUnitsByCategory(categoryId: string, params?: IUnitGetParams): Promise<IPaginatedResponse<IUnit>> {
        return this.repository.getUnitsByCategory(categoryId, params);
    }

    async getUnitsDetailsByCategory(categoryId?: string): Promise<any[]> {
        return this.repository.getUnitsDetailsByCategory(categoryId);
    }

    async getAllUnits(params?: IUnitGetParams): Promise<IUnit[]> {
        return this.repository.getAllUnits(params);
    }

    async updateUnit(id: string, data: Partial<IUnit>): Promise<IUnit> {
        return this.repository.updateUnit(id, data);
    }

    async createUnit(data: ICreateUnitPayload): Promise<IUnit> {
        return this.repository.createUnit(data);
    }

    async uploadHoursFromExcel(file: File): Promise<any[]> {
        return this.repository.uploadHoursFromExcel(file);
    }
}

export const unitService = UnitService.getInstance(unitRepository);

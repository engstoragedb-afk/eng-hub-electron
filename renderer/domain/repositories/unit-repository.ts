import { IUnit } from "@/domain/models";

export interface IPaginatedResponse<T> {
    page: number;
    limit: number;
    totalRow: number;
    data: T[];
}

export interface IUnitGetParams {
    page?: number;
    limit?: number;
    search?: string;
    location_id?: string;
    status?: string;
    hm_min?: number;
    hm_max?: number;
    hours_min?: number;
    hours_max?: number;
    type_id?: string;
}

export interface IUnitRepository {
    getUnitDetails(id: string): Promise<IUnit>;
    getUnitsByCategory(categoryId: string, params?: IUnitGetParams): Promise<IPaginatedResponse<IUnit>>;
    getAllUnits(params?: IUnitGetParams): Promise<IUnit[]>;
    updateUnit(id: string, data: Partial<IUnit>): Promise<IUnit>;
}

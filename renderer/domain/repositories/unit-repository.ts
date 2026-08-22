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
    gps_status?: string;
}

import { IRepository } from "./repository";

export interface ICreateUnitPayload {
    category_id: string;
    name: string;
    hm: number;
    hours: number;
    type_id?: string;
    image?: string;
    manufacture_year: number;
    serial_number?: string;
    gps_vendor?: string;
    gps_device_id?: string;
    gps_portal?: string;
    gps_status?: string;
}

export interface IUnitRepository extends IRepository<IUnit> {
    getUnitDetails(id: string): Promise<IUnit>;
    getUnitsByCategory(categoryId: string, params?: IUnitGetParams): Promise<IPaginatedResponse<IUnit>>;
    getUnitsDetailsByCategory(categoryId?: string): Promise<any[]>;
    getAllUnits(params?: IUnitGetParams): Promise<IUnit[]>;
    getAllUnitsWithDetail(params?: IUnitGetParams): Promise<any[]>;
    createUnit(data: ICreateUnitPayload): Promise<IUnit>;
    updateUnit(id: string, data: Partial<IUnit>): Promise<IUnit>;
    uploadHoursFromExcel(file: File): Promise<any[]>;
}

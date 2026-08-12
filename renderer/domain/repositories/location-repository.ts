import { ILocation } from "@/domain/models/location";

import { IRepository } from "./repository";

export interface ILocationRepository extends IRepository<ILocation> {
    getLocations(): Promise<ILocation[]>;
}

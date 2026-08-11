import { ILocation } from "@/domain/models/location";

export interface ILocationRepository {
    getLocations(): Promise<ILocation[]>;
}

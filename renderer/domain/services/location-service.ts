import { ILocation } from "@/domain/models/location";
import { IService } from "./service";

export interface ILocationService extends IService<ILocation> {
    getLocations(): Promise<ILocation[]>;
}

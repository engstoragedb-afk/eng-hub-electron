import { ILocationService } from "../domain/services/location-service";
import { ILocationRepository } from "../domain/repositories/location-repository";
import { LocationRepository } from "../infra/http/location-repository";
import { restApi } from "../infra/http/rest-api";
import { ILocation } from "@/domain/models/location";

class LocationService implements ILocationService {
    constructor(private readonly locationRepository: ILocationRepository) {}

    async getLocations(): Promise<ILocation[]> {
        return this.locationRepository.getLocations();
    }
}

export const locationService = new LocationService(new LocationRepository(restApi));

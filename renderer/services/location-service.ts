import { ILocationService } from "@/domain/services/location-service";
import { ILocationRepository } from "@/domain/repositories/location-repository";
import { locationRepository } from "@/infra/http/location-repository";
import { ILocation } from "@/domain/models/location";
import { Service } from "@/services/service";

class LocationService extends Service<ILocation, ILocationRepository> implements ILocationService {
    private static instance: LocationService;

    private constructor(repository: ILocationRepository) {
        super(repository);
    }

    public static getInstance(repository: ILocationRepository): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService(repository);
        }
        return LocationService.instance;
    }

    async getLocations(): Promise<ILocation[]> {
        return this.repository.getLocations();
    }

    async createLocation(name: string): Promise<ILocation> {
        return this.repository.createLocation(name);
    }
}

export const locationService = LocationService.getInstance(locationRepository);

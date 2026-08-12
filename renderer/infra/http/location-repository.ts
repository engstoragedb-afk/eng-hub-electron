import { ILocation } from "@/domain/models/location";
import { ILocationRepository } from "@/domain/repositories/location-repository";
import { Repository } from "@/infra/http/repository";

export class LocationRepository extends Repository<ILocation> implements ILocationRepository {
    private static instance: LocationRepository;

    private constructor(baseUrl: string = "/locations") {
        super(baseUrl);
    }

    public static getInstance(): LocationRepository {
        if (!LocationRepository.instance) {
            LocationRepository.instance = new LocationRepository();
        }
        return LocationRepository.instance;
    }

    async getLocations(): Promise<ILocation[]> {
        const { data } = await this.restApi.axios.get(this.baseUrl);
        return data.data || data || [];
    }
}

export const locationRepository = LocationRepository.getInstance();

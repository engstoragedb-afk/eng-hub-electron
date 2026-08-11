import { ILocation } from "@/domain/models/location";
import { ILocationRepository } from "../../domain/repositories/location-repository";
import { RestApi } from "@/infra/http/rest-api";

export class LocationRepository implements ILocationRepository {
    constructor(private readonly restApi: RestApi) {}

    async getLocations(): Promise<ILocation[]> {
        const { data } = await this.restApi.axios.get('/locations');
        return data.data || data || [];
    }
}

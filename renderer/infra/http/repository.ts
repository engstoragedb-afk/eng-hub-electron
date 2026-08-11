import { IFindParam, IRepository } from "@/domain/repositories/repository";
import { RestApi, restApi } from "@/infra/http/rest-api";

export class Repository<I> implements IRepository<I> {
    protected baseUrl: string;
    protected restApi: RestApi;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.restApi = restApi;
    }

    async findAll(findParam: IFindParam): Promise<I[]> {
        const { data } = await this.restApi.axios.get(this.baseUrl, { params: findParam });
        return data.data;
    }

    async findById(id: string): Promise<I> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/${id}`);
        return data.data;
    }

    async store(data: I): Promise<I> {
        const { data: _data } = await this.restApi.axios.post(this.baseUrl, data);
        return _data.data;
    }

    async update(data: Partial<I>, id: string): Promise<I> {
        const { data: _data } = await this.restApi.axios.put(`${this.baseUrl}/${id}`, data);
        return _data.data;
    }

    async destroy(id: string): Promise<I> {
        const { data } = await this.restApi.axios.delete(`${this.baseUrl}/${id}`);
        return data.data;
    }
}
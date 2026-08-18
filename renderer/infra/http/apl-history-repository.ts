import { IAplHistoryRepository } from "@/domain/repositories/apl-history-repository";
import { AplHistory, IAplHistory } from "@/domain/models/apl-history";
import { Repository } from "@/infra/http/repository";

export class AplHistoryRepository extends Repository<IAplHistory> implements IAplHistoryRepository {
    private static instance: AplHistoryRepository;

    private constructor(baseUrl: string = "/apl/history") {
        super(baseUrl);
    }

    public static getInstance(): AplHistoryRepository {
        if (!AplHistoryRepository.instance) {
            AplHistoryRepository.instance = new AplHistoryRepository();
        }
        return AplHistoryRepository.instance;
    }

    async findAllNoPaginate(query: { apl_id: string }): Promise<IAplHistory[]> {
        const { data } = await this.restApi.axios.get(`${this.baseUrl}/all`, { params: query });
        return data.data.map((item: any) => AplHistory.create(item).unmarshall());
    }

    async createHistory(data: any): Promise<IAplHistory> {
        const response = await this.restApi.axios.post(this.baseUrl, data);
        return AplHistory.create(response.data.data).unmarshall();
    }
}

export const aplHistoryRepository = AplHistoryRepository.getInstance();

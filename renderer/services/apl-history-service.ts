import { IAplHistoryService } from "@/domain/services/apl-history-service";
import { IAplHistoryRepository } from "@/domain/repositories/apl-history-repository";
import { aplHistoryRepository } from "@/infra/http/apl-history-repository";
import { IAplHistory } from "@/domain/models/apl-history";
import { Service } from "@/services/service";

export class AplHistoryService extends Service<IAplHistory, IAplHistoryRepository> implements IAplHistoryService {
    private static instance: AplHistoryService;

    private constructor(repository: IAplHistoryRepository) {
        super(repository);
    }

    public static getInstance(repository: IAplHistoryRepository): AplHistoryService {
        if (!AplHistoryService.instance) {
            AplHistoryService.instance = new AplHistoryService(repository);
        }
        return AplHistoryService.instance;
    }

    async findAllNoPaginate(query: { apl_id: string }): Promise<IAplHistory[]> {
        return this.repository.findAllNoPaginate(query);
    }

    async createHistory(data: any): Promise<IAplHistory> {
        return this.repository.createHistory(data);
    }
}

export const aplHistoryService = AplHistoryService.getInstance(aplHistoryRepository);

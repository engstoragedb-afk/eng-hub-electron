import { IOperatorService } from "@/domain/services/operator-service";
import { IOperatorRepository, IAssignOperatorRequest, IAssignOperatorResponse } from "@/domain/repositories/operator-repository";
import { operatorRepository } from "@/infra/http/operator-repository";
import { Service } from "@/services/service";

export class OperatorService extends Service<any, IOperatorRepository> implements IOperatorService {
    private static instance: OperatorService;

    private constructor(repository: IOperatorRepository) {
        super(repository);
    }

    public static getInstance(repository: IOperatorRepository): OperatorService {
        if (!OperatorService.instance) {
            OperatorService.instance = new OperatorService(repository);
        }
        return OperatorService.instance;
    }

    async assignOperator(data: IAssignOperatorRequest): Promise<IAssignOperatorResponse> {
        return this.repository.assignOperator(data);
    }

    async unassignOperator(operatorId: string): Promise<any> {
        return this.repository.unassignOperator(operatorId);
    }
}

export const operatorService = OperatorService.getInstance(operatorRepository);

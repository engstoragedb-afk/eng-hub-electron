import { IOperatorService } from "@/domain/services/operator-service";
import { IOperatorRepository, IAssignOperatorRequest, IAssignOperatorResponse } from "@/domain/repositories/operator-repository";
import { OperatorRepository } from "@/infra/http/operator-repository";
import { restApi } from "@/infra/http/rest-api";

export class OperatorService implements IOperatorService {
    private operatorRepo: IOperatorRepository;

    constructor(operatorRepo?: IOperatorRepository) {
        this.operatorRepo = operatorRepo || new OperatorRepository(restApi);
    }

    async assignOperator(data: IAssignOperatorRequest): Promise<IAssignOperatorResponse> {
        return this.operatorRepo.assignOperator(data);
    }

    async unassignOperator(operatorId: string): Promise<any> {
        return this.operatorRepo.unassignOperator(operatorId);
    }
}

export const operatorService = new OperatorService();

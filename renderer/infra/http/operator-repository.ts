import { IOperatorRepository, IAssignOperatorRequest, IAssignOperatorResponse } from "@/domain/repositories/operator-repository";
import { Repository } from "@/infra/http/repository";

export class OperatorRepository extends Repository<any> implements IOperatorRepository {
    private static instance: OperatorRepository;

    private constructor(baseUrl: string = "/operators") {
        super(baseUrl);
    }

    public static getInstance(): OperatorRepository {
        if (!OperatorRepository.instance) {
            OperatorRepository.instance = new OperatorRepository();
        }
        return OperatorRepository.instance;
    }

    async assignOperator(data: IAssignOperatorRequest): Promise<IAssignOperatorResponse> {
        const response = await this.restApi.axios.post(`${this.baseUrl}/assign`, data);
        return response.data?.data || response.data;
    }

    async unassignOperator(operatorId: string): Promise<any> {
        const response = await this.restApi.axios.post(`${this.baseUrl}/unassign/${operatorId}`);
        return response.data?.data || response.data;
    }
}

export const operatorRepository = OperatorRepository.getInstance();

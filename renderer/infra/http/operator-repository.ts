import { IOperatorRepository, IAssignOperatorRequest, IAssignOperatorResponse } from "@/domain/repositories/operator-repository";
import { RestApi } from "@/infra/http/rest-api";

export class OperatorRepository implements IOperatorRepository {
    constructor(private readonly restApi: RestApi) {}

    async assignOperator(data: IAssignOperatorRequest): Promise<IAssignOperatorResponse> {
        const response = await this.restApi.axios.post('/operators/assign', data);
        return response.data?.data || response.data;
    }

    async unassignOperator(operatorId: string): Promise<any> {
        const response = await this.restApi.axios.post(`/operators/unassign/${operatorId}`);
        return response.data?.data || response.data;
    }
}

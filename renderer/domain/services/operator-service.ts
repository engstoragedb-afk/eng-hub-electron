import { IAssignOperatorRequest, IAssignOperatorResponse } from "@/domain/repositories/operator-repository";

export interface IOperatorService {
    assignOperator(data: IAssignOperatorRequest): Promise<IAssignOperatorResponse>;
    unassignOperator(operatorId: string): Promise<any>;
}

export interface IAssignOperatorRequest {
    user_id: string;
    unit_id: string;
}

export interface IAssignOperatorResponse {
    operator: any;
    unit_operator: any;
}

import { IRepository } from "./repository";

export interface IOperatorRepository extends IRepository<any> {
    assignOperator(data: IAssignOperatorRequest): Promise<IAssignOperatorResponse>;
    unassignOperator(operatorId: string): Promise<any>;
}

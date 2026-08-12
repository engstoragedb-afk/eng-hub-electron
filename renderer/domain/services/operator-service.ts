import { IAssignOperatorRequest, IAssignOperatorResponse } from "@/domain/repositories/operator-repository";

import { IService } from "./service";

export interface IOperatorService extends IService<any> {
    assignOperator(data: IAssignOperatorRequest): Promise<IAssignOperatorResponse>;
    unassignOperator(operatorId: string): Promise<any>;
}

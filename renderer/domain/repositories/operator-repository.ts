export interface IAssignOperatorRequest {
    user_id: string;
    unit_id: string;
    location_id: string;
}

export interface IAssignOperatorResponse {
    operator: any;
    unit_operator: any;
    unit_location: any;
}

export interface IOperatorRepository {
    assignOperator(data: IAssignOperatorRequest): Promise<IAssignOperatorResponse>;
    unassignOperator(operatorId: string): Promise<any>;
}

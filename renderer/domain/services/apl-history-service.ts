import { IService } from "./service";
import { IAplHistory, IAplHistoryCreate, IAplHistoryQueryParams, IAplHistoryUpdatePayload } from "../models/apl-history";

export interface IAplHistoryService extends IService<IAplHistory> {
    findAllNoPaginate(query?: IAplHistoryQueryParams): Promise<IAplHistory[]>;
    createHistory(data: IAplHistoryCreate | any): Promise<IAplHistory>;
    updateHistory(id: string, data: IAplHistoryUpdatePayload): Promise<IAplHistory>;
}

import { IRepository } from "./repository";
import { IAplHistory, IAplHistoryCreate, IAplHistoryQueryParams, IAplHistoryUpdatePayload } from "../models/apl-history";

export interface IAplHistoryRepository extends IRepository<IAplHistory> {
    findAllNoPaginate(query?: IAplHistoryQueryParams): Promise<IAplHistory[]>;
    createHistory(data: IAplHistoryCreate | any): Promise<IAplHistory>;
    updateHistory(id: string, data: IAplHistoryUpdatePayload): Promise<IAplHistory>;
    deleteHistory(id: string): Promise<void>;
}

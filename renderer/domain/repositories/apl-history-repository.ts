import { IRepository } from "./repository";
import { IAplHistory, IAplHistoryCreate, IAplHistoryQueryParams } from "../models/apl-history";

export interface IAplHistoryRepository extends IRepository<IAplHistory> {
    findAllNoPaginate(query?: IAplHistoryQueryParams): Promise<IAplHistory[]>;
    createHistory(data: IAplHistoryCreate | any): Promise<IAplHistory>;
}

import { IService } from "./service";
import { IAplHistory, IAplHistoryCreate, IAplHistoryQueryParams } from "../models/apl-history";

export interface IAplHistoryService extends IService<IAplHistory> {
    findAllNoPaginate(query?: IAplHistoryQueryParams): Promise<IAplHistory[]>;
    createHistory(data: IAplHistoryCreate | any): Promise<IAplHistory>;
}

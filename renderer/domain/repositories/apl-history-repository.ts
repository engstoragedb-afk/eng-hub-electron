import { IRepository } from "./repository";
import { IAplHistory } from "../models/apl-history";

export interface IAplHistoryRepository extends IRepository<IAplHistory> {
    findAllNoPaginate(query: { apl_id: string }): Promise<IAplHistory[]>;
    createHistory(data: any): Promise<IAplHistory>;
}

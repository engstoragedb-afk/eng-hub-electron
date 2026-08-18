import { IService } from "./service";
import { IAplHistory } from "../models/apl-history";

export interface IAplHistoryService extends IService<IAplHistory> {
    findAllNoPaginate(query: { apl_id: string }): Promise<IAplHistory[]>;
    createHistory(data: any): Promise<IAplHistory>;
}

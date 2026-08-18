import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";

export type IAplHistory = IEntity<{
    apl_id: string;
    remaining_hours: number;
    last_hm: number;
    input_total: number;
    images: string[];
}>;

export type IAplHistoryCreate = IEntityCreate<{
    apl_id: string;
    remaining_hours: number;
    last_hm: number;
    input_total: number;
    images: string[];
}>;

export class AplHistory extends Entity<IAplHistory, IAplHistoryCreate> {
    constructor(props: IAplHistoryCreate) {
        super(props);
    }

    public static create(props: IAplHistoryCreate): AplHistory {
        return new AplHistory(props);
    }

    get apl_id(): string { return this._props.apl_id; }
    get remaining_hours(): number { return this._props.remaining_hours; }
    get last_hm(): number { return this._props.last_hm; }
    get input_total(): number { return this._props.input_total; }
    get images(): string[] { return this._props.images || []; }

    public unmarshall(): IEntity<IAplHistory> {
        return {
            ...super.unmarshall(),
            apl_id: this.apl_id,
            remaining_hours: this.remaining_hours,
            last_hm: this.last_hm,
            input_total: this.input_total,
            images: this.images,
        } as unknown as IEntity<IAplHistory>;
    }
}

import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";

export type IAplHistory = IEntity<{
    apl_id: string;
    remaining_hours: number;
    last_hm: number;
    last_total: number;
    last_time: Date | number;
    status: string;
    images?: string[] | null;
}>;

export type IAplHistoryCreate = IEntityCreate<{
    apl_id: string;
    remaining_hours: number;
    last_hm: number;
    last_total: number;
    last_time: Date | number;
    status: string;
    images?: string[] | null;
}>;

export interface IAplHistoryQueryParams {
    apl_id?: string;
    unit_id?: string;
    status?: string;
}

export interface IAplHistoryUpdatePayload {
    last_time?: Date | string;
    images?: string[];
    status?: string;
}

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
    get last_total(): number { return this._props.last_total; }
    get last_time(): Date | number { return this._props.last_time; }
    get status(): string { return this._props.status; }
    get images(): string[] { return this._props.images || []; }

    set apl_id(value: string) { this._props.apl_id = value; }
    set remaining_hours(value: number) { this._props.remaining_hours = value; }
    set last_hm(value: number) { this._props.last_hm = value; }
    set last_total(value: number) { this._props.last_total = value; }
    set last_time(value: Date | number) { this._props.last_time = value; }
    set status(value: string) { this._props.status = value; }
    set images(value: string[] | null | undefined) { this._props.images = value || []; }

    public unmarshall(): IEntity<IAplHistory> {
        return {
            ...super.unmarshall(),
            apl_id: this.apl_id,
            remaining_hours: this.remaining_hours,
            last_hm: this.last_hm,
            last_total: this.last_total,
            last_time: this.last_time,
            status: this.status,
            images: this.images,
        } as unknown as IEntity<IAplHistory>;
    }
}


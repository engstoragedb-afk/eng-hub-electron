import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";

export type IUnit = IEntity<{
    category_id: string;
    type_id?: string;
    type?: any;
    name: string;
    image?: string;
    hm: number;
    hours: number;
    status: string;
    manufacture_year: number;
    serial_number?: string | null;
    gps_vendor?: string | null;
    gps_device_id?: string | null;
    gps_portal?: string | null;
    gps_status?: string | null;
    category?: any;
    aplData?: any[];
    location?: any;
}>;

export type IUnitCreate = IEntityCreate<{
    category_id: string;
    type_id?: string;
    type?: any;
    name: string;
    image?: string;
    hm: number;
    hours: number;
    status?: string;
    manufacture_year: number;
    serial_number?: string | null;
    gps_vendor?: string | null;
    gps_device_id?: string | null;
    gps_portal?: string | null;
    gps_status?: string | null;
    category?: any;
    aplData?: any[];
    location?: any;
}>;

export class Unit extends Entity<IUnit, IUnitCreate> {
    constructor(props: IUnitCreate) {
        super(props);
    }

    public static create(props: IUnitCreate): Unit {
        return new Unit(props);
    }

    get category_id(): string { return this._props.category_id; }
    get type_id(): string | undefined { return this._props.type_id; }
    get type(): any | undefined { return this._props.type; }
    get name(): string { return this._props.name; }
    get image(): string | undefined { return this._props.image; }
    get hm(): number { return this._props.hm; }
    get hours(): number { return this._props.hours; }
    get status(): string { return this._props.status || 'READY'; }
    get manufacture_year(): number { return this._props.manufacture_year; }
    get serial_number(): string | null { return this._props.serial_number || null; }
    get gps_vendor(): string | null { return this._props.gps_vendor || null; }
    get gps_device_id(): string | null { return this._props.gps_device_id || null; }
    get gps_portal(): string | null { return this._props.gps_portal || null; }
    get gps_status(): string | null { return this._props.gps_status || null; }
    get category(): any { return this._props.category; }
    get aplData(): any[] | undefined { return this._props.aplData; }
    get location(): any | undefined { return this._props.location; }

    public unmarshall(): IEntity<IUnit> {
        return {
            ...super.unmarshall(),
            category_id: this.category_id,
            type_id: this.type_id,
            type: this.type,
            name: this.name,
            image: this.image,
            hm: this.hm,
            hours: this.hours,
            status: this.status,
            manufacture_year: this.manufacture_year,
            serial_number: this.serial_number,
            gps_vendor: this.gps_vendor,
            gps_device_id: this.gps_device_id,
            gps_portal: this.gps_portal,
            gps_status: this.gps_status,
            category: this.category,
            aplData: this.aplData,
            location: this.location,
        } as unknown as IEntity<IUnit>;
    }
}

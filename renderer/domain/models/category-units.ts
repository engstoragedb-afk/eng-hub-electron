import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";

export type ICategoryUnit = IEntity<{
    name: string;
    image?: string;
    units?: number;
}>;

export type ICategoryUnitCreate = IEntityCreate<{
    name: string;
    image?: string;
    units?: number;
}>;

export class CategoryUnit extends Entity<ICategoryUnit, ICategoryUnitCreate> {
    constructor(props: ICategoryUnitCreate) {
        super(props);
    }

    public static create(props: ICategoryUnitCreate): CategoryUnit {
        return new CategoryUnit(props);
    }

    get name(): string { return this._props.name; }
    get image(): string | undefined { return this._props.image; }
    get units(): number | undefined { return this._props.units; }

    public unmarshall(): IEntity<ICategoryUnit> {
        return {
            ...super.unmarshall(),
            name: this.name,
            image: this.image,
            units: this.units,
        } as unknown as IEntity<ICategoryUnit>;
    }
}

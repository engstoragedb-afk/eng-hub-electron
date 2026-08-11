import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";

export type ITypeUnit = IEntity<{
    name: string;
}>;

export type ITypeUnitCreate = IEntityCreate<{
    name: string;
}>;

export class TypeUnit extends Entity<ITypeUnit, ITypeUnitCreate> {
    constructor(props: ITypeUnitCreate) {
        super(props);
    }

    public static create(props: ITypeUnitCreate): TypeUnit {
        return new TypeUnit(props);
    }

    get name(): string { return this._props.name; }

    public unmarshall(): IEntity<ITypeUnit> {
        return {
            ...super.unmarshall(),
            name: this.name,
        } as unknown as IEntity<ITypeUnit>;
    }
}

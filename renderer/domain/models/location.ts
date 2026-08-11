import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";

export type ILocation = IEntity<{
    name: string;
}>;

export type ILocationCreate = IEntityCreate<{
    name: string;
}>;

export class Location extends Entity<ILocation, ILocationCreate> {
    constructor(props: ILocationCreate) {
        super(props);
    }

    public static create(props: ILocationCreate): Location {
        return new Location(props);
    }

    get name(): string { return this._props.name; }

    public unmarshall(): IEntity<ILocation> {
        return {
            ...super.unmarshall(),
            name: this.name,
        } as unknown as IEntity<ILocation>;
    }
}

import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";

export type IUsers = IEntity<{
    full_name: string;
    image?: string;
    email: string;
    phone?: string;
    is_active: boolean;
    role_id?: string;
    role?: any;
}>;

export type IUsersCreate = IEntityCreate<{
    full_name: string;
    image?: string;
    email: string;
    phone?: string;
    is_active: boolean;
    role_id?: string;
    role?: any;
}>;

export class Users extends Entity<IUsers, IUsersCreate> {
    constructor(props: IUsersCreate) {
        super(props);
    }
    get full_name(): string { return this._props.full_name; }
    get image(): string | undefined { return this._props.image; }
    get email(): string { return this._props.email; }
    get phone(): string | undefined { return this._props.phone; }
    get is_active(): boolean { return this._props.is_active; }
    get role_id(): string | undefined { return this._props.role_id; }
    get role(): any { return this._props.role; }

    public static create(props: IUsersCreate) {
        return new Users(props);
    }

    public unmarshall(): IEntity<IUsers> {
        return {
            ...super.unmarshall(),
            full_name: this.full_name,
            image: this.image,
            email: this.email,
            phone: this.phone,
            is_active: this.is_active,
        } as unknown as IEntity<IUsers>;
    }
}
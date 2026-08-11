import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";

export type IAuth = IEntity<{
    email: string
    full_name: string
    phone?: string
    image?: string
    is_active: boolean
    token?: string;
}>;

export type IAuthCreate = IEntityCreate<{
    email: string
    full_name: string
    phone?: string
    image?: string
    is_active: boolean
    token?: string;
}>;

export class Auth extends Entity<IAuth, IAuthCreate> {
    constructor(props: IAuthCreate) {
        super(props);
    }

    get email(): string { return this._props.email; }
    get full_name(): string { return this._props.full_name; }
    get phone(): string | undefined { return this._props.phone; }
    get image(): string | undefined { return this._props.image; }
    get is_active(): boolean { return this._props.is_active; }
    get token(): string | undefined { return this._props.token; }

    public static create(props: IAuthCreate) {
        return new Auth(props);
    }

    public unmarshall(): IEntity<IAuth> {
        return {
            ...super.unmarshall(),
            email: this.email,
            full_name: this.full_name,
            phone: this.phone,
            image: this.image,
            is_active: this.is_active,
            token: this.token,
        } as unknown as IEntity<IAuth>;
    }
}
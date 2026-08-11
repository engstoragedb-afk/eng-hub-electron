import { Entity, IEntity, IEntityCreate } from "@/domain/models/entity";
import { IUsers } from "./user";

export type IAuditLog = IEntity<{
    user_id?: string;
    user?: IUsers | null;
    action: string;
    old_data?: string | null;
    new_data?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
}>;

export type IAuditLogCreate = IEntityCreate<{
    user_id?: string;
    user?: IUsers | null;
    action: string;
    old_data?: string | null;
    new_data?: string | null;
    ip_address?: string | null;
    user_agent?: string | null;
}>;

export class AuditLog extends Entity<IAuditLog, IAuditLogCreate> {
    constructor(props: IAuditLogCreate) {
        super(props);
    }

    public static create(props: IAuditLogCreate): AuditLog {
        return new AuditLog(props);
    }

    get user_id(): string | undefined { return this._props.user_id; }
    get user(): IUsers | null { return this._props.user || null; }
    get action(): string { return this._props.action; }
    get old_data(): string | null { return this._props.old_data || null; }
    get new_data(): string | null { return this._props.new_data || null; }
    get ip_address(): string | null { return this._props.ip_address || null; }
    get user_agent(): string | null { return this._props.user_agent || null; }

    public unmarshall(): IEntity<IAuditLog> {
        return {
            ...super.unmarshall(),
            user_id: this.user_id,
            user: this.user,
            action: this.action,
            old_data: this.old_data,
            new_data: this.new_data,
            ip_address: this.ip_address,
            user_agent: this.user_agent,
        } as unknown as IEntity<IAuditLog>;
    }
}

export interface IAplUnit {
    id: string;
    unit_id: string;
    category_apl_id: string;
    total: number;
    vault?: number;
    created_at: number;
    updated_at: number;
    deleted_at: number | null;
}

export class AplUnit implements IAplUnit {
    constructor(
        public id: string,
        public unit_id: string,
        public category_apl_id: string,
        public total: number,
        public vault: number | undefined,
        public created_at: number,
        public updated_at: number,
        public deleted_at: number | null,
    ) {}

    public static create(data: any): AplUnit {
        return new AplUnit(
            data.id,
            data.unit_id,
            data.category_apl_id,
            data.total,
            data.vault,
            data.created_at,
            data.updated_at,
            data.deleted_at || null,
        );
    }

    public unmarshall(): IAplUnit {
        return {
            id: this.id,
            unit_id: this.unit_id,
            category_apl_id: this.category_apl_id,
            total: this.total,
            vault: this.vault,
            created_at: this.created_at,
            updated_at: this.updated_at,
            deleted_at: this.deleted_at,
        };
    }
}

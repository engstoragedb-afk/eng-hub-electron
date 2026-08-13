export type IEntity<I> = {
  id: string;
  created_at: number;
  updated_at: number | null;
  deleted_at?: number | null;
} & I;

export type IEntityCreate<I> = {
  id?: string;
  created_at?: number;
  updated_at?: number | null;
  deleted_at?: number | null;
} & I;

export class Entity<I, C> {
  protected _props: IEntity<I>;
  constructor({ id, created_at, updated_at, ...props }: IEntityCreate<C> & { createdAt?: any; updatedAt?: any }) {
    this._props = {
      id: id || `${Date.now()}${Math.ceil(Math.random() * 9999999999)}`,
      created_at: created_at || props.createdAt || new Date().getTime(),
      updated_at: updated_at || props.updatedAt || null,
      ...(<I>props),
    };
  }
  public unmarshall(): IEntity<I> {
    const keyProps = Object.keys(this._props);
    let props: IEntity<I> = Object();
    keyProps.forEach((key) => {
      const assign = {
        [key]: (this as any)[key] || (this._props as any)[key],
      };
      props = {
        ...props,
        ...assign,
      };
    });
    return {
      ...props,
      id: this.id,
      created_at: this.created_at.getTime(),
      updated_at: this.updated_at?.getTime() || null,
      deleted_at: this.deleted_at?.getTime() || null,
    };
  }
  public set(data: Partial<IEntity<I>>) {
    this._props = { ...this._props, ...data };
    return this;
  }
  get id() {
    return this._props.id;
  }
  get created_at() {
    return new Date(this._props.created_at);
  }
  get updated_at() {
    return this._props.updated_at ? new Date(this._props.updated_at) : null;
  }
  get deleted_at() {
    return this._props.deleted_at ? new Date(this._props.deleted_at) : null;
  }
}
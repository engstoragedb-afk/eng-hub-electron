export type IFindParam = {
    [key: string]: IFindParam | object;
};

export interface IService<I> {
    find(param?: IFindParam): Promise<I[]>;
    findById(id: string): Promise<I>;
    store(data: I): Promise<I>;
    update(data: Partial<I>, id: string): Promise<I>;
    destroy(id: string): Promise<I>;
}
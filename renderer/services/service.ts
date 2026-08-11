import { IRepository } from "@/domain/repositories/repository";
import { IFindParam, IService } from "@/domain/services/service";

export class Service<I, R> implements IService<I> {
    protected repository: R & IRepository<I>;
    constructor(repository: R & IRepository<I>) {
        this.repository = repository;
    }

    find(param?: IFindParam): Promise<I[]> {
        return this.repository.findAll(param || {});
    }

    findById(id: string): Promise<I> {
        return this.repository.findById(id);
    }

    store(data: I): Promise<I> {
        return this.repository.store(data);
    }

    update(data: Partial<I>, id: string): Promise<I> {
        return this.repository.update(data, id);
    }

    destroy(id: string): Promise<I> {
        return this.repository.destroy(id);
    }
}
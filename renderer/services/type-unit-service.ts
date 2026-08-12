import { ITypeUnitRepository } from "@/domain/repositories/type-unit-repository";
import { ITypeUnitService } from "@/domain/services/type-unit-service";
import { typeUnitRepository } from "@/infra/http/type-unit-repository";
import { ITypeUnit } from "@/domain/models/type-unit";
import { Service } from "@/services/service";

export class TypeUnitService extends Service<ITypeUnit, ITypeUnitRepository> implements ITypeUnitService {
    private static instance: TypeUnitService;

    private constructor(repository: ITypeUnitRepository) {
        super(repository);
    }

    public static getInstance(repository: ITypeUnitRepository): TypeUnitService {
        if (!TypeUnitService.instance) {
            TypeUnitService.instance = new TypeUnitService(repository);
        }
        return TypeUnitService.instance;
    }

    async getTypeUnits(): Promise<ITypeUnit[]> {
        return this.repository.getTypeUnits();
    }
}

export const typeUnitService = TypeUnitService.getInstance(typeUnitRepository);

import { IAuth, Auth } from "@/domain/models";
import { IAuthRepository, ILoginParam } from "@/domain/repositories";
import { Repository } from "@/infra/http/repository";

export class AuthRepository extends Repository<IAuth> implements IAuthRepository {
    private static instance: AuthRepository;
    private constructor(baseUrl: string = "/") {
        super(baseUrl);
    }

    public static getInstance(): AuthRepository {
        if (!AuthRepository.instance) {
            AuthRepository.instance = new AuthRepository();
        }
        return AuthRepository.instance;
    }

    async check(): Promise<IAuth> {
        const { data } = await this.restApi.axios.get(`/user/me`);
        return data.data;
    }

     async login(param: ILoginParam): Promise<IAuth> {
        const { data } = await this.restApi.axios.post('/user/login', {
            email: param.email,
            password: param.password
        });

        return Auth.create({
            id: data.data.id,
            full_name: data.data.full_name,
            email: data.data.email,
            image: data.data.image,
            phone: data.data.phone,
            is_active: data.data.is_active,
            token: data.data.token,
        }).unmarshall();
    }
    
    async auth(): Promise<IAuth> {
        if (typeof window === 'undefined') return {} as IAuth;
        const authData = JSON.parse(localStorage.getItem('auth') || '{}');
        
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
            return '';
        }
        
        return {
            ...authData,
            token: getCookie("token")
        };
    }

    async logout(): Promise<void> {
        localStorage.setItem("auth", JSON.stringify({}));
    }
}

export const authRepository = AuthRepository.getInstance();
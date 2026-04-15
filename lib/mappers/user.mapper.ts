import type { User } from "@/generated/prisma/client";
import { CreateUserDTO } from "../validators/user.validator";

export type UserResponse = {
    id: number;
    name: string;
    email: string;
    isActive: boolean;
};

export class UserMapper{
    static toEntity (userDto : CreateUserDTO) : Omit<User,'id' | 'createdAt'> {
        return {
            name:userDto.name,
            email:userDto.email,
            password:userDto.password,
            isActive:userDto.isActive ?? true,
            imageUrl: ""
        }
    }

    static toDto(user:User):UserResponse{
        return{
            id:user.id,
            name:user.name,
            email:user.email,
            isActive:user.isActive
        }
    }
}
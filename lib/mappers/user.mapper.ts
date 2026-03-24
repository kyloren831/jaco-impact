import { User } from "@/generated/prisma/browser";
import { UserRequest } from "../dtos/users/user-request.dto"
import { isAscii } from "buffer";
import { UserResponse } from "../dtos/users/user-response.dto";

export class UserMapper{
    static toEntity (userDto : UserRequest) : Omit<User,'id' | 'createdAt'> {
        return {
            name:userDto.name,
            email:userDto.email,
            password:userDto.password,
            role:userDto.role,
            isActive:userDto.isActive
        }
    }

    static toDto(user:User):UserResponse{
        return{
            id:user.id,
            name:user.name,
            email:user.email,
            role:user.role,
            isActive:user.isActive
        }
    }
}
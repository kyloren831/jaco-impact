import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { UserRequest } from "../dtos/users/user-request.dto";
import { UserResponse } from "../dtos/users/user-response.dto";
import { UserMapper } from "../mappers/user.mapper";

export class AuthService {
    async register(userDto: UserRequest): Promise<UserResponse> {

        //hashear contraseña
        userDto.password= await bcrypt.hash(userDto.password,10);
        userDto.role='VOLUNTEER'
        //Utiliza prisma
        const created = await prisma.user.create({
            //mapea el dto a la entidad
          data: UserMapper.toEntity(userDto),
        });
        //retorna la entidad mapeada al dto
        return UserMapper.toDto(created);
      }
}
import { Role } from "@/generated/prisma/enums";

export interface UserRequest {
    name: string;
    email:string;
    password:string;
    role:Role;
    isActive:boolean;
}
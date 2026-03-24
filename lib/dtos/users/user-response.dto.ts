import { Role } from "@/generated/prisma/enums";

export interface UserResponse {
    id:number;
    name:string;
    email:string;
    role:Role;
    isActive:boolean;
}
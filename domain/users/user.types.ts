import type { User, Role } from "@/generated/prisma/client";
import type { CreateUserDTO, AssignRoleDTO } from "@/lib/validators/user.validator";

export type { User, Role, CreateUserDTO as CreateUserCommand, AssignRoleDTO as AssignRoleCommand };

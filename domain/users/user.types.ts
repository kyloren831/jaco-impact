import type { User, Role } from "@/generated/prisma/client";
import type { CreateUserDTO, AssignRoleDTO } from "@/lib/validators/user.validator";

export interface UpdateProfileCommand {
  userId: number;
  name?: string;
  imageUrl?: string;
  volunteerData?: {
    phone?: string;
    nationality?: string;
    profession?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    inmediateAvailability?: boolean;
  };
}

export type { User, Role, CreateUserDTO as CreateUserCommand, AssignRoleDTO as AssignRoleCommand };

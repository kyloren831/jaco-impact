import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CreateUserDTO, AssignRoleDTO } from "@/lib/validators/user.validator";

export class UserService {
  /**
   * Registra un nuevo usuario visitante en el sistema.
   * Crea automáticamente el rol de VOLUNTEER y un perfil vacío de Volunteer.
   */
  async create(data: CreateUserDTO) {
    const { name, email, password, isActive } = data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario, asignar rol VOLUNTEER e inicializar info del volunteer en la misma transacción
    const created = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        imageUrl: "",
        isActive: isActive ?? true,
        userRoles: {
          create: {
            role: "VOLUNTEER",
          },
        },
        volunteers: {
          create: {
            // Inicializar con valores vacíos, el usuario podrá completar su perfil más adelante
            phone: "",
            nationality: "",
            profession: "",
            emergencyContactName: "",
            emergencyContactPhone: "",
            inmediateAvailability: false,
          },
        },
      },
      include: {
        userRoles: true,
        volunteers: true,
      },
    });

    // Excluir contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = created;

    return userWithoutPassword;
  }

  /**
   * Asigna un rol a un usuario.
   * Si el usuario ya tiene el rol, la operación es idempotente (no lanza error).
   */
  async assignRole({ userId, role }: AssignRoleDTO) {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    await prisma.userRole.upsert({
      where: { userId_role: { userId, role } },
      update: {},           // ya existe, no hacer nada
      create: { userId, role },
    });

    // Devolver el usuario con sus roles actualizados
    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { userRoles: true },
    });

    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  /**
   * Elimina un rol de un usuario.
   * Lanza error si el usuario no existe o si no tiene el rol asignado.
   */
  async removeRole({ userId, role }: AssignRoleDTO) {
    // Verificar que el usuario existe
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Verificar que el rol está asignado
    const existing = await prisma.userRole.findUnique({
      where: { userId_role: { userId, role } },
    });

    if (!existing) {
      throw new Error("ROLE_NOT_ASSIGNED");
    }

    await prisma.userRole.delete({
      where: { userId_role: { userId, role } },
    });

    // Devolver el usuario con sus roles actualizados
    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { userRoles: true },
    });

    const { password: _, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }

  /**
   * Obtiene la información del usuario actual.
   */
  async getCurrentUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        imageUrl: true,
        userRoles: {
          select: { role: true },
        },
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return user;
  }
}

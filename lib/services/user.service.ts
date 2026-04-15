import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { CreateUserDTO } from "@/lib/validators/user.validator";

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

  // Se pueden agregar otros métodos del servicio (e.g., findAll, update etc) según se requieran
}

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Importamos el tipo generado de Zod
import { z } from "zod";
import { CreateUserSchema } from "@/lib/validators/user.validator";

export const RegisterVolunteerSchema = CreateUserSchema.extend({
  phone: z.string().min(1, "El teléfono es requerido"),
  nationality: z.string().min(1, "La nacionalidad es requerida"),
  profession: z.string().min(1, "La profesión es requerida"),
  emergencyContactName: z.string().min(1, "El contacto de emergencia es requerido"),
  emergencyContactPhone: z.string().min(1, "El teléfono de emergencia es requerido"),
  inmediateAvailability: z.boolean().default(false),
});

export type RegisterVolunteerDTO = z.infer<typeof RegisterVolunteerSchema>;

export class VolunteerService {
  async register(data: RegisterVolunteerDTO) {
    const {
      name,
      email,
      password,
      phone,
      nationality,
      profession,
      emergencyContactName,
      emergencyContactPhone,
      inmediateAvailability,
    } = data;

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el Usuario, su Rol, y el Voluntario en una Transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const user = await tx.user.create({
        data: {
          name,
          email,
          imageUrl: "",
          password: hashedPassword,
          isActive: true, // Por defecto activo
          userRoles: {
            create: {
              role: "VOLUNTEER",
            },
          },
        },
      });

      // Crear voluntario
      const volunteer = await tx.volunteer.create({
        data: {
          userId: user.id,
          phone,
          nationality,
          profession,
          emergencyContactName,
          emergencyContactPhone,
          inmediateAvailability,
        },
      });

      return { user, volunteer };
    });

    // Devolver resultado (excluyendo la contraseña)
    const { password: _, ...userWithoutPassword } = result.user;
    return {
      user: userWithoutPassword,
      volunteer: result.volunteer,
    };
  }
}

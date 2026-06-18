"use server";

import { requireAuth } from "@/lib/auth/guards";
import { userDomainService } from "@/domain/users/service";
import { revalidatePath } from "next/cache";
import { getPresignedUploadUrl } from "@/lib/storage/r2";
import { prisma } from "@/lib/prisma";

export async function getProfileAction() {
  try {
    const session = await requireAuth();
    const user = await userDomainService.getCurrentUser(session.userId) as any;

    if (!user) {
      return { success: false, error: "Usuario no encontrado" };
    }

    return { 
      success: true, 
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        roles: user.userRoles?.map((r: any) => r.role) || [],
        volunteer: user.volunteers ? {
          phone: user.volunteers.phone,
          nationality: user.volunteers.nationality,
          profession: user.volunteers.profession,
          emergencyContactName: user.volunteers.emergencyContactName,
          emergencyContactPhone: user.volunteers.emergencyContactPhone,
          inmediateAvailability: user.volunteers.inmediateAvailability,
        } : null
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProfileAction(data: any) {
  try {
    const session = await requireAuth();
    
    await userDomainService.updateProfile({
      userId: session.userId,
      name: data.name,
      imageUrl: data.imageUrl,
      volunteerData: data.volunteer,
    });

    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPresignedUploadUrlAction(fileName: string, fileType: string) {
  try {
    await requireAuth();
    
    const ALLOWED_MIME_TYPES = [
      "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    ];

    if (!ALLOWED_MIME_TYPES.includes(fileType)) {
      return { success: false, error: "Tipo de archivo no permitido" };
    }

    const data = await getPresignedUploadUrl(fileName, fileType);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getVolunteerAvailabilitiesAction() {
  try {
    const session = await requireAuth();
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: session.userId }
    });
    if (!volunteer) return { success: true, data: [] };

    const availabilities = await prisma.volunteerAvailability.findMany({
      where: { volunteerId: volunteer.id },
      orderBy: { startDate: "asc" }
    });
    return { success: true, data: availabilities };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addVolunteerAvailabilityAction(data: { startDate: Date, endDate: Date, notes?: string }) {
  try {
    const session = await requireAuth();
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: session.userId }
    });
    if (!volunteer) throw new Error("Volunteer profile not found");

    const availability = await prisma.volunteerAvailability.create({
      data: {
        volunteerId: volunteer.id,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes
      }
    });
    revalidatePath("/dashboard/profile");
    return { success: true, data: availability };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteVolunteerAvailabilityAction(id: number) {
  try {
    const session = await requireAuth();
    const volunteer = await prisma.volunteer.findUnique({
      where: { userId: session.userId }
    });
    if (!volunteer) throw new Error("Volunteer profile not found");

    await prisma.volunteerAvailability.delete({
      where: { id, volunteerId: volunteer.id }
    });
    revalidatePath("/dashboard/profile");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

"use server";

import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Admin Actions ---

export async function getAdminPymesAction() {
  await requireRole(["ADMIN"]);
  const pymes = await prisma.pyme.findMany({
    include: {
      manager: {
        include: {
          user: true,
        },
      },
      products: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return pymes;
}

export async function getAdminPymeDetailAction(pymeId: number) {
  await requireRole(["ADMIN"]);
  const pyme = await prisma.pyme.findUnique({
    where: { id: pymeId },
    include: {
      manager: {
        include: {
          user: true,
        },
      },
      products: true,
    },
  });
  return pyme;
}

export async function evaluatePymeAction(pymeId: number, isApproved: boolean) {
  await requireRole(["ADMIN"]);
  const pyme = await prisma.pyme.update({
    where: { id: pymeId },
    data: {
      isActive: isApproved,
      publishedAt: isApproved ? new Date() : null,
    },
  });

  revalidatePath("/dashboard/admin/pymes");
  revalidatePath(`/dashboard/admin/pymes/${pymeId}`);
  return pyme;
}

// --- Entrepreneur Actions ---

export async function getMyPymeAction() {
  const session = await requireRole(["PYME_MANAGER"]);
  
  const pymeManager = await prisma.pymeManager.findUnique({
    where: { userId: session.userId },
    include: {
      pyme: {
        include: {
          products: true,
        },
      },
    },
  });
  
  return pymeManager;
}

type UpsertPymeData = {
  name: string;
  category: string;
  phone: string;
  description: string;
  catalogSlug: string;
};

export async function upsertMyPymeAction(data: UpsertPymeData) {
  const session = await requireRole(["PYME_MANAGER"]);
  
  // Need the user details to populate PymeManager
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId }
  });

  // Check if they already have a pyme
  const existingManager = await prisma.pymeManager.findUnique({
    where: { userId: session.userId }
  });

  if (existingManager) {
    // Update existing Pyme
    const pyme = await prisma.pyme.update({
      where: { id: existingManager.pymeId },
      data: {
        name: data.name,
        category: data.category,
        phone: data.phone,
        description: data.description,
        catalogSlug: data.catalogSlug,
      },
    });
    
    // Also update manager phone if needed
    await prisma.pymeManager.update({
      where: { id: existingManager.id },
      data: {
        name: user.name,
        phone: data.phone,
      }
    });

    revalidatePath("/dashboard/pyme");
    return pyme;
  } else {
    // Create new Pyme and Manager
    const newPyme = await prisma.pyme.create({
      data: {
        name: data.name,
        category: data.category,
        phone: data.phone,
        description: data.description,
        catalogSlug: data.catalogSlug,
        isActive: false, // Requires admin review
        manager: {
          create: {
            userId: session.userId,
            name: user.name,
            phone: data.phone,
            email: user.email,
          }
        }
      }
    });

    revalidatePath("/dashboard/pyme");
    return newPyme;
  }
}

type AddProductData = {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
};

export async function addProductAction(data: AddProductData) {
  const session = await requireRole(["PYME_MANAGER"]);
  
  const existingManager = await prisma.pymeManager.findUniqueOrThrow({
    where: { userId: session.userId }
  });

  const product = await prisma.product.create({
    data: {
      pymeId: existingManager.pymeId,
      name: data.name,
      description: data.description,
      price: data.price,
      imageUrl: data.imageUrl,
      isActive: true,
    }
  });

  revalidatePath("/dashboard/pyme");
  return product;
}

export async function deleteProductAction(productId: number) {
  const session = await requireRole(["PYME_MANAGER"]);
  
  const existingManager = await prisma.pymeManager.findUniqueOrThrow({
    where: { userId: session.userId }
  });

  // Verify the product belongs to this pyme
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId }
  });

  if (product.pymeId !== existingManager.pymeId) {
    throw new Error("Unauthorized");
  }

  await prisma.product.delete({
    where: { id: productId }
  });

  revalidatePath("/dashboard/pyme");
  return { success: true };
}

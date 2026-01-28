"use server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function deleteUser(id: string) {
  try {
    const user = await prisma.user.delete({
      where: { id },
    });

    revalidatePath("/");
    return user;
  } catch (error) {
    console.error("Failed to delete user:", error);
    throw new Error("Could not delete user");
  }
}

export async function updateUser({
  id,
  name,
  role,
}: {
  id: string;
  name: string;
  role: Role;
}) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role,
      },
    });

    revalidatePath("/");

    return user;
  } catch (error) {
    console.error("Failed to update user:", error);
    throw new Error("Could not update user");
  }
}

export async function changeUserPassword(userId: string, newPass: string) {
  try {
    const ctx = await auth.$context;
    const hash = await ctx.password.hash(newPass);

    await ctx.internalAdapter.updatePassword(userId, hash); //(you can also use your orm directly)

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

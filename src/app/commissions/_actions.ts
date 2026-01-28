"use server";

import prisma from "@/lib/prisma";
import { Commission } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function addCommission({
  policyId,
  commissionAmount,
  status,
  commissionDate,
}: {
  policyId: string;
  commissionAmount: string;
  status: Commission["status"];
  commissionDate: Date;
}) {
  try {
    // Validate inputs
    if (!policyId || !commissionAmount || !status || !commissionDate) {
      throw new Error("All fields are required");
    }

    // Convert commission amount to number
    const amount = parseFloat(commissionAmount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Invalid commission amount");
    }

    // Create the commission record in the database
    const commission = await prisma.commission.create({
      data: {
        policyId,
        amount,
        status,
        commissionDate: commissionDate,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Commission added successfully",
      commissionId: commission.id,
    };
  } catch (error: any) {
    console.error("Error adding commission:", error);
    return {
      success: false,
      message: "Failed to add commission: " + error.message,
    };
  }
}

export async function updateCommission({
  commissionId,
  commissionAmount,
  status,
  commissionDate,
}: {
  commissionId: string;
  commissionAmount: string;
  status: Commission["status"];
  commissionDate: Date;
}) {
  try {
    const amount = parseFloat(commissionAmount);
    if (
      !commissionId ||
      isNaN(amount) ||
      amount <= 0 ||
      !status ||
      !commissionDate
    ) {
      throw new Error("Invalid input.");
    }

    const updated = await prisma.commission.update({
      where: { id: commissionId },
      data: {
        amount,
        status,
        commissionDate,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Commission updated",
      commissionId: updated.id,
    };
  } catch (err: any) {
    console.error("Update error:", err);
    return { success: false, message: "Failed to update: " + err.message };
  }
}

// Delete commission by id
export async function deleteCommission(id: string) {
  try {
    await prisma.commission.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete commission:", error);
    return { success: false, error: "Could not delete commission" };
  }
}

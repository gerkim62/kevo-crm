"use server";
import { prisma } from "@/lib/prisma"; // adjust path based on your project
import { PolicyStatus, PolicyType, Prisma } from "@prisma/client";

type CreatePolicyInput = {
  policyNumber: string;
  clientName: string;
  clientPhone?: string;
  insurer: string;
  vehicleRegistrationNumber?: string;
  type: PolicyType;
  status: PolicyStatus;
  premium: number;
  sumInsured: number;
  startDate: string; // ISO string
  expiryDate: string; // ISO string
};

export async function createPolicy(data: CreatePolicyInput) {
  try {
    const policy = await prisma.policy.create({
      data: {
        policyNumber: data.policyNumber,
        clientName: data.clientName,
        clientPhone: data.clientPhone,
        insurer: data.insurer,
        vehicleRegistrationNumber: data.vehicleRegistrationNumber,
        type: data.type,
        status: data.status,
        premium: data.premium,
        sumInsured: data.sumInsured,
        startDate: new Date(data.startDate),
        expiryDate: new Date(data.expiryDate),
      },
    });

    return policy;
  } catch (error) {
    console.error("Failed to create policy:", error);
    throw new Error("Could not create policy");
  }
}

// Delete policy by id
export async function deletePolicy(id: string) {
  try {
    await prisma.policy.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete policy:", error);

    // if foreign key issue then means has claim
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        success: false,
        error:
          "Cannot delete policy with existing claims. You must remove all claims first.",
      };
    }

    return { success: false, error: "Could not delete policy" };
  }
}
type UpdatePolicyInput = CreatePolicyInput & { id: string };
export async function updatePolicy(data: UpdatePolicyInput) {
  return await prisma.policy.update({
    where: { id: data.id },
    data: {
      policyNumber: data.policyNumber,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      insurer: data.insurer,
      vehicleRegistrationNumber: data.vehicleRegistrationNumber,
      type: data.type,
      status: data.status,
      premium: data.premium,
      sumInsured: data.sumInsured,
      startDate: new Date(data.startDate),
      expiryDate: new Date(data.expiryDate),
    },
  });
}

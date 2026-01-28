"use server";

import prisma from "@/lib/prisma";
import { ClaimStatus, ClaimType } from "@prisma/client";
import { UTApi, UTFile } from "uploadthing/server";

const utapi = new UTApi({
  // ...options,
});

// Delete claim by id
export async function deleteClaim(id: string) {
  try {
    await prisma.claim.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete claim:", error);
    return { success: false, error: "Could not delete claim" };
  }
}

export async function fetchByPolicyNumber(number: string) {
  if (!number) {
    return {
      success: false,
      message: "Policy number is required",
      policy: null,
    };
  }

  const policy = await prisma.policy.findFirst({
    where: { policyNumber: number },
  });

  if (!policy) {
    return {
      success: false,
      message: "Policy not found",
      policy: null,
    };
  }

  return { policy, success: true, message: "Policy found" };
}

//

export interface ClaimSubmissionResult {
  success: boolean;
  message: string;
  claimId?: string;
}

export async function submitClaim(
  formData: FormData
): Promise<ClaimSubmissionResult> {
  try {
    // Extract form data
    const policyId = formData.get("policyId") as string;
    const incidentDate = formData.get("incidentDate") as string;
    const type = formData.get("type") as string;
    const estimatedLosKes = formData.get("estimatedLosKes") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;

    // Get all evidence documents
    const evidenceDocuments = formData.getAll("evidenceDocuments") as File[];

    // Console log the received data
    console.log("=== CLAIM SUBMISSION DATA ===");
    console.log("Policy ID:", policyId);
    console.log("Incident Date:", incidentDate);
    console.log("Type:", type);
    console.log("Estimated Loss (KES):", estimatedLosKes);
    console.log("Description:", description);
    console.log("Number of evidence documents:", evidenceDocuments.length);
    console.log("Status:", status);

    // Log file details
    console.log("\n=== EVIDENCE DOCUMENTS ===");
    evidenceDocuments.forEach((file: File, index: number) => {
      if (file && file.name) {
        console.log(`File ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString(),
        });
      }
    });

    // Log complete form data for debugging
    console.log("\n=== COMPLETE FORM DATA ENTRIES ===");
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}:`, `File - ${value.name} (${value.size} bytes)`);
      } else {
        console.log(`${key}:`, value);
      }
    }

    const evidenceDocumentsUploadResults =
      (await uploadFiles(evidenceDocuments)) || [];

    const claim = await prisma.claim.create({
      data: {
        status: status as ClaimStatus,
        policyId,
        incidentDate: new Date(incidentDate),
        type: type as ClaimType,
        estimatedLosKes: parseFloat(estimatedLosKes),
        description,
        evidenceDocuments: {
          createMany: {
            data: evidenceDocumentsUploadResults.map((doc) => ({
              name: doc.name,
              url: doc.url,
              sizeBytes: doc.sizeBytes,
            })),
          },
        },
      },
    });
    // Return success response
    return {
      success: true,
      message: "Claim submitted successfully!",
      claimId: `${claim.id}`,
    };
  } catch (error: any) {
    console.error("Error processing claim submission:", error);
    return {
      success: false,
      message: "Failed to submit claim: Internal server error.",
    };
  }
}

export async function uploadFiles(files: File[]) {
  console.log(
    "Uploading files:",
    files.map((file) => file.name)
  );
  const utFiles = await Promise.all(
    files.map(async (file) => new UTFile([await file.arrayBuffer()], file.name))
  );

  const result = await utapi.uploadFiles(utFiles);

  if (result.length) {
    return result.map((res) => ({
      name: res.data?.name || "",
      url: res.data?.ufsUrl || "",
      type: res.data?.type || "Unknown",
      sizeBytes: res.data?.size || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }

  return null;
}

export interface ClaimEditResult {
  success: boolean;
  message: string;
}

export async function editClaim(
  claimId: string,
  formData: FormData
): Promise<ClaimEditResult> {
  try {
    // Extract form data
    const policyId = formData.get("policyId") as string;
    const incidentDate = formData.get("incidentDate") as string;
    const type = formData.get("type") as string;
    const estimatedLosKes = formData.get("estimatedLosKes") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;

    const evidenceDocuments = formData.getAll("evidenceDocuments") as File[];

    console.log("=== CLAIM EDIT DATA ===");
    console.log("Claim ID:", claimId);
    console.log("Policy ID:", policyId);
    console.log("Incident Date:", incidentDate);
    console.log("Type:", type);
    console.log("Estimated Loss (KES):", estimatedLosKes);
    console.log("Description:", description);
    console.log("Status:", status);
    console.log("New evidence documents count:", evidenceDocuments.length);

    console.log("\n=== NEW DOCUMENT FILES ===");
    evidenceDocuments.forEach((file, index) => {
      if (file && file.name) {
        console.log(`File ${index + 1}:`, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: new Date(file.lastModified).toISOString(),
        });
      }
    });

    const evidenceDocumentsUploadResults =
      (await uploadFiles(evidenceDocuments)) || [];

    // Update claim
    await prisma.claim.update({
      where: { id: claimId },
      data: {
        policyId,
        incidentDate: new Date(incidentDate),
        type: type as ClaimType,
        estimatedLosKes: parseFloat(estimatedLosKes),
        description,
        status: status as ClaimStatus,
        evidenceDocuments: {
          createMany: {
            data: evidenceDocumentsUploadResults.map((doc) => ({
              name: doc.name,
              url: doc.url,
              sizeBytes: doc.sizeBytes,
            })),
          },
        },
      },
    });

    return {
      success: true,
      message: "Claim updated successfully.",
    };
  } catch (error: any) {
    console.error("Error editing claim:", error);
    return {
      success: false,
      message: "Failed to edit claim due to an internal error.",
    };
  }
}

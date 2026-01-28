"use server";
import prisma from "@/lib/prisma";
import { DocumentType } from "@prisma/client";
import { UTApi, UTFile } from "uploadthing/server";

const utapi = new UTApi({
  // ...options,
});

export async function uploadFile(file: File) {
  console.log("Uploading file:", file.name);
  const utFile = new UTFile([await file.arrayBuffer()], file.name);
  const result = await utapi.uploadFiles([utFile]);

  if (result[0].data) {
    return result[0].data;
  }

  return null;
}

export async function submitDocumentUpload(formData: FormData) {
  const clientName = formData.get("clientName");
  const documentType = formData.get("documentType");
  const file = formData.get("file");

  console.log("Submitting document upload:", {
    clientName,
    documentType,
    file,
  });

  if (DocumentType[documentType as keyof typeof DocumentType] === undefined) {
    throw new Error("Invalid document type.");
  }

  if (!clientName || !documentType || !file) {
    throw new Error("All fields are required.");
  }

  const uploadResult = await uploadFile(file as File);
  if (!uploadResult) {
    throw new Error("File upload failed.");
  }

  const dbResult = await prisma.document.create({
    data: {
      clientName: clientName.toString(),
      name: uploadResult.name,
      type: documentType as DocumentType,
      url: uploadResult.ufsUrl,
      sizeBytes: uploadResult.size,
    },
  });
}

export async function deleteDocument(id: string) {
  return await prisma.document.delete({
    where: { id },
  });
}

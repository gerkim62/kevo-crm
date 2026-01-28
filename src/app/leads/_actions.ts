"use server";

import { prisma } from "@/lib/prisma";

// Types
type LeadStatus = "new" | "converted" | "lost";
type LeadPriority = "low" | "high";
type LeadSource = "referral" | "call" | "social_media";

type NewLead = {
  fullName: string;
  phoneNumber: string;
  email?: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  notes?: string;
};

type UpdateLeadInput = {
  id: string;
  data: Partial<NewLead>;
};

// Add a new lead
export async function addLead(data: NewLead) {
  return prisma.lead.create({ data });
}

// Delete lead by id
export async function deleteLead(id: string) {
  try {
    await prisma.lead.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Failed to delete lead:", error);
    return { success: false, error: "Could not delete lead" };
  }
}

// Update an existing lead
export async function updateLead({ id, data }: UpdateLeadInput) {
  return prisma.lead.update({
    where: { id },
    data,
  });
}

// Fetch all leads
export async function getAllLeads() {
  return prisma.lead.findMany({
    orderBy: { createdAt: "desc" }, // Optional: requires createdAt field in schema
  });
}

// Convert a lead (change status to "converted")
export async function convertLead(id: string) {
  return prisma.lead.update({
    where: { id },
    data: { status: "converted" },
  });
}

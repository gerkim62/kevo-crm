import React from "react";
import LeadManagement from "./_main";
import { getAllLeads } from "./_actions";
import { unauthorized } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type Props = {};
export const dynamic = "force-dynamic";

export default async function LeadManagementPage({}: Props) {
  const authenticatedUser = (
    await auth.api.getSession({ headers: await headers() })
  )?.user;
  if (!authenticatedUser) throw unauthorized();
  const leads = await getAllLeads();
  return <LeadManagement leads={leads} />;
}

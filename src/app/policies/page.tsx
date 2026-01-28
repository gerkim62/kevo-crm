import React from "react";
import PolicyManagement from "./_main";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { unauthorized } from "next/navigation";

type Props = {};
export const dynamic = "force-dynamic";

export default async function PoliciesPage({}: Props) {
  const authenticatedUser = (await auth.api.getSession({ headers: await headers() }))
    ?.user;
  if (!authenticatedUser) throw unauthorized();
  const policies = await prisma.policy.findMany();
  return <PolicyManagement policies={policies} />;
}

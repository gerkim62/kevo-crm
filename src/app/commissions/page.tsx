import React from "react";
import { CommissionTrackingPage } from "./_main";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";

type Props = {};

export default async function CommisiosPage({}: Props) {
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "admin";
  if (!isAdmin) throw unauthorized();

  const commissionsData = await prisma.commission.findMany({
    include: {
      policy: true, // Include related policy data
    },
  });
  return <CommissionTrackingPage commissionsData={commissionsData} />;
}

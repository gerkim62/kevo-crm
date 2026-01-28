import React from "react";
import DocumentManager from "./_main";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";

type Props = {};
export const dynamic = "force-dynamic";

export default async function DocumentsPage({}: Props) {
  const authenticatedUser = (
    await auth.api.getSession({ headers: await headers() })
  )?.user;
  if (!authenticatedUser) throw unauthorized();
  const documents = await prisma.document.findMany();
  return <DocumentManager documents={documents} />;
}

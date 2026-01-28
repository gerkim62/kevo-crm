import prisma from "@/lib/prisma";
import ClaimsTrackingDashboard from "./_main";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unauthorized, } from "next/navigation";

type Props = {};

export const dynamic = "force-dynamic";

export default async function ClaimsPage({}: Props) {
  const authenticatedUser = (
    await auth.api.getSession({ headers: await headers() })
  )?.user;
  if (!authenticatedUser) throw unauthorized();
  const claims = await prisma.claim.findMany({
    include: {
      policy: true, // Include related policy data
      evidenceDocuments: true, // Include related evidence documents
    },
  });
  return <ClaimsTrackingDashboard claims={claims} />;
}

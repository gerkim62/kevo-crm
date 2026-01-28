import React from "react";
import UserManagementDashboard from "./_main";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";

type Props = {};

export default async function UsersPage({}: Props) {
  const users = await prisma.user.findMany({});
  const session = await auth.api.getSession({ headers: await headers() });
  const isAdmin = session?.user?.role === "admin";
  if (!isAdmin) throw unauthorized();
  return <UserManagementDashboard users={users} />;
}

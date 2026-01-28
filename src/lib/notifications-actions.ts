"use server";
import prisma from "@/lib/prisma";

export async function getUnreadNotificationsCount(userId: string) {
  // Adjust userId logic if notifications are per-user
  return await prisma.notification.count({
    where: { read: false },
  });
}

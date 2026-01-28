import { NextResponse } from "next/server";
import { getUnreadNotificationsCount } from "@/lib/notifications-actions";

export async function GET() {
  // TODO: Use user id from session if notifications are per-user
  const count = await getUnreadNotificationsCount("");
  return NextResponse.json({ count });
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

async function getNotifications() {
  // Fetch notifications from the database, ordered by createdAt desc
  return await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export default async function NotificationsPage() {
  const notifications = await getNotifications();

  await prisma.notification.updateMany({
    data: {
      read: true,
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="border-b pb-2 mb-0 flex items-center">
          <CardTitle className="text-xl font-semibold text-primary flex items-center">
            <svg
              width="22"
              height="22"
              fill="none"
              viewBox="0 0 24 24"
              className="text-primary mr-2"
            >
              <path
                d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z"
                fill="currentColor"
              />
            </svg>
            Notifications ({unreadCount} unread)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-base font-medium">
              No notifications found.
            </div>
          ) : (
            <ul>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-center px-4 py-3 transition-colors ${
                    !n.read ? "bg-accent/30" : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {!n.read ? (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full bg-primary animate-pulse mr-3"
                        title="Unread"
                      />
                    ) : (
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full bg-muted-foreground/30 mr-3"
                        title="Read"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-medium text-foreground text-base">
                        {n.title}
                      </span>
                      {!n.read && (
                        <Badge variant="secondary" className="ml-2">
                          New
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {n.message}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center mt-0.5">
                      Sent {format(new Date(n.createdAt), "PPpp")}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

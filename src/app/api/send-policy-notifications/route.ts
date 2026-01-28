import prisma from "@/lib/prisma";

export async function GET() {
  const expiringPolicies = await prisma.policy.findMany({
    where: {
      status: "active",
      expiryDate: {
        gte: new Date(),
        lt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // Next 10 days
      },
      //  with 0 notifications
      notifications: {
        none: {},
      },
    },
    orderBy: { expiryDate: "asc" },
  });

  if (expiringPolicies.length === 0) {
    return new Response("No expiring policies found", { status: 201 });
  }

  // create notifications for each expiring policy
  const notifications = await Promise.all(
    expiringPolicies.map(async (policy) => {
      return prisma.notification.create({
        data: {
          policyId: policy.id,
          title: "Policy Expiry Alert",
          message: `Policy #${policy.policyNumber} is expiring on ${policy.expiryDate
            .toISOString()
            .slice(0, 10)}. Please renew it.`,
          createdAt: new Date(),
          read: false,
        },
      });
    })
  );

  return new Response(
    `Created ${notifications.length} notifications for expiring policies`,
    { status: 201 }
  );
}

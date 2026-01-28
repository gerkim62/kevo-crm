import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";
import { createAuthClient } from "better-auth/react";
import { Role } from "@prisma/client"; // Assuming UserRole is defined in your Prisma schema

import { inferAdditionalFields } from "better-auth/client/plugins";
import { sendEmail } from "./_actions";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    minPasswordLength: 4,
    sendResetPassword: async ({ user, url, token }, request) => {
      await sendEmail({
        resetLink: url,
        toEmail: user.email,
      });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: Role.user,
        input: true,
        references: {
          model: "user",
          field: "role",
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 10,
  },
});

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

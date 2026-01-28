"use server";

import emailjs from "@emailjs/nodejs";

type SendEmailInput = {
  toEmail: string;
  resetLink: string;
};

console.log("Initializing EmailJS with public and private keys...");
if (
  !process.env.EMAILJS_PUBLIC_KEY ||
  !process.env.EMAILJS_PRIVATE_KEY ||
  !process.env.EMAILJS_SERVICE_ID ||
  !process.env.EMAILJS_TEMPLATE_ID
) {
  throw new Error("EmailJS keys are not set in environment variables");
}

emailjs.init({
  publicKey: process.env.EMAILJS_PUBLIC_KEY!,
  privateKey: process.env.EMAILJS_PRIVATE_KEY!,
});

export async function sendEmail({ resetLink, toEmail }: SendEmailInput) {
  console.log("Sending email to:", toEmail);
  try {
    const res = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID!,
      process.env.EMAILJS_TEMPLATE_ID!,
      {
        email: toEmail,
        link: resetLink,
      }
    );

    console.log("EmaiJs res:", res);
    return { success: true };
  } catch (error) {
    console.error("EmailJS error:", error);
    throw new Error("Could not send email");
  }
}

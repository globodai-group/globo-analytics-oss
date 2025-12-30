"use server";

import { z } from "zod";
import { logger, logError } from "@/lib/logger";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

interface ActionResult {
  success: boolean;
  error?: string;
}

export async function sendContactMessageAction(
  data: z.infer<typeof contactSchema>
): Promise<ActionResult> {
  try {
    const validated = contactSchema.parse(data);

    // In production, send email using Resend or similar
    // For now, just log the message
    logger.info({
      type: "contact",
      event: "form_submission",
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
      messageLength: validated.message.length,
    });

    // TODO: Send email notification to admin
    // await sendEmail({
    //   to: process.env.CONTACT_EMAIL || 'admin@example.com',
    //   subject: `Contact Form: ${validated.subject}`,
    //   html: `...`,
    // });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    logError(error, { context: "contact", operation: "sendMessage" });
    return { success: false, error: "Failed to send message" };
  }
}

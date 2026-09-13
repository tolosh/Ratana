import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const enquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be under 100 characters"),
  organisation: z.string().trim().max(150, "Organisation must be under 150 characters").optional(),
  email: z.string().trim().email("Enter a valid email address").max(255, "Email must be under 255 characters"),
  message: z.string().trim().min(1, "Message is required").max(2000, "Message must be under 2,000 characters"),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data) => enquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("lantern_enquiries").insert({
      name: data.name,
      organisation: data.organisation || null,
      email: data.email,
      message: data.message,
    });
    if (error) throw new Error("Your enquiry could not be sent. Please try again.");
    return { ok: true };
  });

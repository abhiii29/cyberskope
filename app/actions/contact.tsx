"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

interface ContactFormData {
  name: string
  email: string
  company: string
  message: string
}

export async function sendContactEmail(formData: ContactFormData) {
  try {
    // For production: verify cyberskope.eu domain at resend.com/domains
    // Then change from to "CyberSkope <noreply@cyberskope.eu>" and to to "info@cyberskope.eu"
    const { data, error } = await resend.emails.send({
      from: "CyberSkope Contact Form <onboarding@resend.dev>",
      to: "abhi.gahane29@gmail.com", // Your verified email for testing
      replyTo: formData.email, // Allows you to reply directly to the submitter
      subject: `New Contact Form Submission from ${formData.name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Company:</strong> ${formData.company}</p>
        <p><strong>Message:</strong></p>
        <p>${formData.message || "No message provided"}</p>
        <hr />
        <p style="color: #666; font-size: 12px;">
          You can reply directly to this email to respond to ${formData.name} at ${formData.email}
        </p>
      `,
    })

    if (error) {
      console.error("[v0] Resend error:", error)
      return { success: false, error: error.message }
    }

    console.log("[v0] Email sent successfully:", data)
    return { success: true }
  } catch (error) {
    console.error("[v0] Failed to send email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}

"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendContactEmail(formData: {
  name: string
  email: string
  company: string
  message: string
}) {
  try {
    const { data, error } = await resend.emails.send({
      from: "CyberSkope Contact Form <onboarding@resend.dev>",
      to: ["info@cyberskope.eu"],
      replyTo: formData.email,
      subject: `New Contact Form Submission from ${formData.name} - ${formData.company}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Company:</strong> ${formData.company}</p>
        <p><strong>Message:</strong></p>
        <p>${formData.message || "No message provided"}</p>
      `,
    })

    if (error) {
      console.error("[v0] Error sending email:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error in sendContactEmail:", error)
    return { success: false, error: "Failed to send email" }
  }
}

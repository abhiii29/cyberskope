"use server"

import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

// Sent from a different address than the inbox it lands in: mail that claims to
// come from the recipient's own address is a spoofing pattern that Microsoft 365
// tends to quarantine. Both are on cyberskope.eu, the domain verified in Resend.
const FROM = "CyberSkope Contact <noreply@cyberskope.eu>"
const TO = "info@cyberskope.eu"

const LIMITS = { name: 100, email: 254, company: 100, message: 5000 }

// Visitor input goes into an HTML email, so escape it before interpolating.
const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")

// Header values must stay on one line.
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim()

export async function sendContactEmail(formData: {
  name: string
  email: string
  company: string
  message: string
}) {
  // A server action is a public endpoint, so re-validate what the form already checks.
  const name = oneLine(String(formData.name ?? ""))
  const email = oneLine(String(formData.email ?? ""))
  const company = oneLine(String(formData.company ?? ""))
  const message = String(formData.message ?? "").trim()

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { success: false, error: "Please fill in your name, a valid email and a message." }
  if (
    name.length > LIMITS.name ||
    email.length > LIMITS.email ||
    company.length > LIMITS.company ||
    message.length > LIMITS.message
  )
    return { success: false, error: "One of the fields is too long." }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `New contact form message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company || "-"}\n\n${message}`,
      html: `
        <h2>New contact form message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Company:</strong> ${escapeHtml(company || "-")}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    })

    if (error) {
      console.error("[contact] Resend error:", error)
      return { success: false, error: error.message }
    }

    console.info("[contact] sent", data?.id)
    return { success: true, data }
  } catch (error) {
    console.error("[contact] Contact form error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

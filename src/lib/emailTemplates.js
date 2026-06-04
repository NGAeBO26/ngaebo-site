/* emailTemplates.js */

/**
 * Generates the clean HTML structure for the transactional MailerSend delivery email.
 * @param {string} routeTitle - The name of the map (e.g., "BULL MTN.")
 * @param {string} downloadUrl - The unique digital download gateway URL
 */
export function getRideGuideHTML(routeTitle, downloadUrl) {
  return `
    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.5;">
      <h2 style="color: #111827; margin-bottom: 20px;">Your RideGuide is ready! 👋</h2>
      <p>Thank you for purchasing the <strong>${routeTitle}</strong> map from North Georgia eBike Outfitters.</p>
      <p style="margin: 35px 0;">
        <a href="${downloadUrl}" style="background-color: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Download Your RideGuide</a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
        If you have any issues with your download link, simply reply directly to this email and our team will get you squared away.
      </p>
    </div>
  `;
}

/**
 * Generates a clean plaintext fallback version for basic email clients.
 */
export function getRideGuideText(routeTitle, downloadUrl) {
  return `Hi! Thank you for purchasing the ${routeTitle} map from North Georgia eBike Outfitters.\n\nDownload your copy here: ${downloadUrl}\n\nIf you have any issues, simply reply directly to this email!`;
}
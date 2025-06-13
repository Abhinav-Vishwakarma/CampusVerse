import { google } from "googleapis"

// Google Drive API setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI,
)

const drive = google.drive({
  version: "v3",
  auth: oauth2Client,
})

export { oauth2Client, drive }

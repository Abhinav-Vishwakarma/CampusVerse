import fs from "fs"
import { drive, oauth2Client } from "../config/googleDrive.js"
import User from "../models/User.js"

/**
 * Authenticate user with Google Drive
 * @param {string} code - Authorization code from Google OAuth
 * @param {string} userId - User ID
 * @returns {Object} - Tokens
 */
const authenticateUser = async (code, userId) => {
  try {
    const { tokens } = await oauth2Client.getToken(code)

    // Save tokens to user in database
    await User.findByIdAndUpdate(userId, {
      "googleDriveAuth.accessToken": tokens.access_token,
      "googleDriveAuth.refreshToken": tokens.refresh_token,
      "googleDriveAuth.expiryDate": tokens.expiry_date,
    })

    return tokens
  } catch (error) {
    console.error("Error authenticating with Google Drive:", error)
    throw error
  }
}

/**
 * Set OAuth credentials for a user
 * @param {Object} user - User object with Google Drive auth tokens
 */
const setUserCredentials = (user) => {
  if (user.googleDriveAuth && user.googleDriveAuth.accessToken) {
    oauth2Client.setCredentials({
      access_token: user.googleDriveAuth.accessToken,
      refresh_token: user.googleDriveAuth.refreshToken,
      expiry_date: user.googleDriveAuth.expiryDate,
    })
    return true
  }
  return false
}

/**
 * Upload file to Google Drive
 * @param {Object} user - User object
 * @param {Buffer|string} fileContent - File content or path
 * @param {string} fileName - File name
 * @param {string} mimeType - File MIME type
 * @returns {Object} - Uploaded file metadata
 */
const uploadFile = async (user, fileContent, fileName, mimeType) => {
  try {
    if (!setUserCredentials(user)) {
      throw new Error("User not authenticated with Google Drive")
    }

    let media

    if (typeof fileContent === "string") {
      // If fileContent is a path
      media = {
        body: fs.createReadStream(fileContent),
      }
    } else {
      // If fileContent is a buffer
      media = {
        body: fileContent,
      }
    }

    const fileMetadata = {
      name: fileName,
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType,
        body: media.body,
      },
      fields: "id,name,webViewLink",
    })

    // Make the file accessible via link
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    })

    return response.data
  } catch (error) {
    console.error("Error uploading file to Google Drive:", error)
    throw error
  }
}

/**
 * Create a folder in Google Drive
 * @param {Object} user - User object
 * @param {string} folderName - Folder name
 * @returns {Object} - Created folder metadata
 */
const createFolder = async (user, folderName) => {
  try {
    if (!setUserCredentials(user)) {
      throw new Error("User not authenticated with Google Drive")
    }

    const fileMetadata = {
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: "id,name,webViewLink",
    })

    return response.data
  } catch (error) {
    console.error("Error creating folder in Google Drive:", error)
    throw error
  }
}

export { authenticateUser, uploadFile, createFolder, setUserCredentials }

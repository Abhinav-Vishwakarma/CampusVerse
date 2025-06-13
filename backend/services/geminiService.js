import genAI from "../config/geminiAI.js"

/**
 * Generate a career roadmap based on user skills
 * @param {Object} userSkills - User skills and preferences
 * @returns {Object} - Generated roadmap
 */
const generateRoadmap = async (userSkills) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
      Generate a detailed career roadmap for a person with the following skills and preferences:
      
      Skills: ${userSkills.skills.join(", ")}
      Current Level: ${userSkills.currentLevel}
      Career Goals: ${userSkills.careerGoals}
      Timeframe: ${userSkills.timeframe}
      
      Please provide a structured roadmap with:
      1. Short-term goals (next 3-6 months)
      2. Medium-term goals (6-18 months)
      3. Long-term goals (1.5-3 years)
      4. Recommended courses and certifications
      5. Skills to develop
      6. Projects to build
      7. Industry connections to make
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return {
      roadmap: text,
      generatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error generating roadmap:", error)
    throw error
  }
}

/**
 * Generate a resume based on user inputs
 * @param {Object} userInfo - User information for resume
 * @returns {Object} - Generated resume content
 */
const generateResume = async (userInfo) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
      Generate a professional resume in markdown format for a person with the following information:
      
      Personal Information:
      - Name: ${userInfo.name}
      - Email: ${userInfo.email}
      - Phone: ${userInfo.phone}
      - Location: ${userInfo.location}
      
      Education:
      ${userInfo.education.map((edu) => `- ${edu.degree} in ${edu.field}, ${edu.institution}, ${edu.year}`).join("\n")}
      
      Work Experience:
      ${userInfo.experience
        .map(
          (exp) =>
            `- ${exp.position} at ${exp.company}, ${exp.duration}
         ${exp.responsibilities.map((resp) => `  - ${resp}`).join("\n")}`,
        )
        .join("\n\n")}
      
      Skills:
      ${userInfo.skills.join(", ")}
      
      Projects:
      ${userInfo.projects
        .map(
          (proj) =>
            `- ${proj.name}: ${proj.description}
         Technologies used: ${proj.technologies.join(", ")}`,
        )
        .join("\n\n")}
      
      Make it ATS-friendly, professional, and well-structured.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    return {
      resumeContent: text,
      generatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error generating resume:", error)
    throw error
  }
}

/**
 * Check resume ATS score
 * @param {string} resumeContent - Resume content
 * @param {string} jobDescription - Job description
 * @returns {Object} - ATS score and recommendations
 */
const checkATSScore = async (resumeContent, jobDescription) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    const prompt = `
      You are an ATS (Applicant Tracking System) expert. Analyze the following resume against the job description.
      
      Resume:
      ${resumeContent}
      
      Job Description:
      ${jobDescription}
      
      Please provide:
      1. An ATS compatibility score out of 100
      2. Keyword match percentage
      3. Missing important keywords
      4. Recommendations for improvement
      5. Overall assessment
      
      Format your response as a structured JSON object with these sections.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Extract JSON from the response
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/)
    let parsedResponse

    if (jsonMatch) {
      try {
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } catch (e) {
        parsedResponse = { error: "Could not parse JSON response" }
      }
    } else {
      // If no JSON found, return the text as analysis
      parsedResponse = { analysis: text }
    }

    return {
      ...parsedResponse,
      analyzedAt: new Date(),
    }
  } catch (error) {
    console.error("Error checking ATS score:", error)
    throw error
  }
}

export { generateRoadmap, generateResume, checkATSScore }

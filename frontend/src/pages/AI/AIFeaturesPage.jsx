"use client"

import { useState } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { FileText, CheckCircle, Download, Upload, Zap, Map, CreditCard, AlertCircle } from "lucide-react"

const AIFeaturesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [credits, setCredits] = useState(15) // Mock initial credits
  const [activeFeature, setActiveFeature] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [loading, setLoading] = useState(false)

  // Form states
  const [resumeData, setResumeData] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    experience: "",
    education: "",
  })
  const [atsFile, setAtsFile] = useState(null)
  const [roadmapGoal, setRoadmapGoal] = useState("")

  const aiFeatures = [
    {
      id: "resume",
      name: "Resume Builder",
      description: "Generate professional resumes using AI",
      credits: 3,
      icon: FileText,
      color: "blue",
    },
    {
      id: "ats",
      name: "ATS Checker",
      description: "Check your resume against ATS systems",
      credits: 5,
      icon: CheckCircle,
      color: "green",
    },
    {
      id: "roadmap",
      name: "Roadmap Generator",
      description: "Create personalized learning roadmaps",
      credits: 1,
      icon: Map,
      color: "purple",
    },
  ]

  const handleFeatureSelect = (featureId) => {
    const feature = aiFeatures.find((f) => f.id === featureId)
    if (credits < feature.credits) {
      showError(`Insufficient credits. You need ${feature.credits} credits for this feature.`)
      return
    }
    setActiveFeature(featureId)
    setGeneratedContent(null)
  }

  const handleResumeGeneration = async () => {
    if (!resumeData.name || !resumeData.email || !resumeData.skills) {
      showError("Please fill in all required fields")
      return
    }

    setLoading(true)
    try {
      // Mock AI generation
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const mockResume = {
        content: `
# ${resumeData.name}
**Email:** ${resumeData.email} | **Phone:** ${resumeData.phone}

## Skills
${resumeData.skills}

## Experience
${resumeData.experience || "Fresh Graduate"}

## Education
${resumeData.education}

## Projects
- AI-powered web application using React and Node.js
- Machine learning model for data analysis
- Full-stack e-commerce platform

## Achievements
- Dean's List for academic excellence
- Winner of college hackathon 2023
- Certified in cloud computing technologies
        `,
        downloadUrl: "#",
      }

      setGeneratedContent(mockResume)
      setCredits((prev) => prev - 3)
      showSuccess("Resume generated successfully!")
    } catch (error) {
      showError("Failed to generate resume")
    } finally {
      setLoading(false)
    }
  }

  const handleATSCheck = async () => {
    if (!atsFile) {
      showError("Please upload a resume file")
      return
    }

    setLoading(true)
    try {
      // Mock ATS analysis
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockATSResult = {
        score: 85,
        feedback: [
          { type: "success", message: "Strong keyword optimization" },
          { type: "warning", message: "Consider adding more quantifiable achievements" },
          { type: "error", message: "Missing contact information formatting" },
          { type: "success", message: "Good section organization" },
          { type: "warning", message: "Skills section could be more detailed" },
        ],
        suggestions: [
          "Add more industry-specific keywords",
          "Include quantifiable results in experience section",
          "Optimize formatting for ATS readability",
          "Add relevant certifications",
        ],
      }

      setGeneratedContent(mockATSResult)
      setCredits((prev) => prev - 5)
      showSuccess("ATS analysis completed!")
    } catch (error) {
      showError("Failed to analyze resume")
    } finally {
      setLoading(false)
    }
  }

  const handleRoadmapGeneration = async () => {
    if (!roadmapGoal.trim()) {
      showError("Please enter your learning goal")
      return
    }

    setLoading(true)
    try {
      // Mock roadmap generation
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockRoadmap = {
        goal: roadmapGoal,
        timeline: "6 months",
        phases: [
          {
            phase: "Foundation (Month 1-2)",
            topics: ["HTML/CSS Basics", "JavaScript Fundamentals", "Git & Version Control", "Basic Algorithms"],
            resources: ["MDN Web Docs", "freeCodeCamp", "Codecademy"],
          },
          {
            phase: "Intermediate (Month 3-4)",
            topics: ["React.js", "Node.js", "Database Basics", "API Development"],
            resources: ["React Documentation", "Node.js Guides", "MongoDB University"],
          },
          {
            phase: "Advanced (Month 5-6)",
            topics: ["Advanced React", "System Design", "Testing", "Deployment"],
            resources: ["Advanced React Patterns", "System Design Primer", "Jest Documentation"],
          },
        ],
      }

      setGeneratedContent(mockRoadmap)
      setCredits((prev) => prev - 1)
      showSuccess("Learning roadmap generated!")
    } catch (error) {
      showError("Failed to generate roadmap")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showSuccess(`${filename} downloaded successfully!`)
  }

  const renderFeatureForm = () => {
    switch (activeFeature) {
      case "resume":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume Builder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={resumeData.name}
                onChange={(e) => setResumeData({ ...resumeData, name: e.target.value })}
                className="input-field"
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={resumeData.email}
                onChange={(e) => setResumeData({ ...resumeData, email: e.target.value })}
                className="input-field"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={resumeData.phone}
                onChange={(e) => setResumeData({ ...resumeData, phone: e.target.value })}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Education"
                value={resumeData.education}
                onChange={(e) => setResumeData({ ...resumeData, education: e.target.value })}
                className="input-field"
              />
            </div>
            <textarea
              placeholder="Skills (comma separated) *"
              value={resumeData.skills}
              onChange={(e) => setResumeData({ ...resumeData, skills: e.target.value })}
              className="input-field"
              rows={3}
            />
            <textarea
              placeholder="Experience (optional)"
              value={resumeData.experience}
              onChange={(e) => setResumeData({ ...resumeData, experience: e.target.value })}
              className="input-field"
              rows={4}
            />
            <button
              onClick={handleResumeGeneration}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{loading ? "Generating..." : "Generate Resume (3 credits)"}</span>
            </button>
          </div>
        )

      case "ats":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ATS Checker</h3>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500">
                    <span>Upload your resume</span>
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => setAtsFile(e.target.files[0])}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">PDF, DOC, DOCX up to 10MB</p>
                {atsFile && <p className="mt-2 text-sm text-green-600 dark:text-green-400">Selected: {atsFile.name}</p>}
              </div>
            </div>
            <button
              onClick={handleATSCheck}
              disabled={loading || !atsFile}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{loading ? "Analyzing..." : "Analyze Resume (5 credits)"}</span>
            </button>
          </div>
        )

      case "roadmap":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Roadmap Generator</h3>
            <textarea
              placeholder="What do you want to learn? (e.g., Full Stack Web Development, Data Science, Mobile App Development)"
              value={roadmapGoal}
              onChange={(e) => setRoadmapGoal(e.target.value)}
              className="input-field"
              rows={4}
            />
            <button
              onClick={handleRoadmapGeneration}
              disabled={loading || !roadmapGoal.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Map className="w-4 h-4" />
              )}
              <span>{loading ? "Generating..." : "Generate Roadmap (1 credit)"}</span>
            </button>
          </div>
        )

      default:
        return null
    }
  }

  const renderGeneratedContent = () => {
    if (!generatedContent) return null

    switch (activeFeature) {
      case "resume":
        return (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Resume</h3>
              <button
                onClick={() => handleDownload(generatedContent.content, "resume.txt")}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
                {generatedContent.content}
              </pre>
            </div>
          </div>
        )

      case "ats":
        return (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">ATS Analysis Results</h3>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {generatedContent.score}%
                </div>
                <p className="text-gray-600 dark:text-gray-400">ATS Compatibility Score</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Detailed Feedback</h4>
                <div className="space-y-2">
                  {generatedContent.feedback.map((item, index) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 p-2 rounded ${
                        item.type === "success"
                          ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200"
                          : item.type === "warning"
                            ? "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200"
                            : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200"
                      }`}
                    >
                      {item.type === "success" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      <span className="text-sm">{item.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Improvement Suggestions</h4>
                <ul className="space-y-1">
                  {generatedContent.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )

      case "roadmap":
        return (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Learning Roadmap</h3>
              <button
                onClick={() =>
                  handleDownload(
                    JSON.stringify(generatedContent, null, 2),
                    `${generatedContent.goal.replace(/\s+/g, "_")}_roadmap.json`,
                  )
                }
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{generatedContent.goal}</h4>
                <p className="text-gray-600 dark:text-gray-400">Timeline: {generatedContent.timeline}</p>
              </div>

              <div className="space-y-4">
                {generatedContent.phases.map((phase, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3">{phase.phase}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics to Learn</h6>
                        <ul className="space-y-1">
                          {phase.topics.map((topic, topicIndex) => (
                            <li
                              key={topicIndex}
                              className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2"
                            >
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Recommended Resources
                        </h6>
                        <ul className="space-y-1">
                          {phase.resources.map((resource, resourceIndex) => (
                            <li
                              key={resourceIndex}
                              className="text-sm text-blue-600 dark:text-blue-400 flex items-center space-x-2"
                            >
                              <FileText className="w-3 h-3" />
                              <span>{resource}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Features</h1>
          <p className="text-gray-600 dark:text-gray-400">Use AI-powered tools to enhance your career prospects</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
          <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <span className="font-semibold text-blue-600 dark:text-blue-400">{credits} Credits</span>
        </div>
      </div>

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {aiFeatures.map((feature) => {
          const IconComponent = feature.icon
          return (
            <div
              key={feature.id}
              className={`card p-6 cursor-pointer transition-all hover:shadow-lg ${
                activeFeature === feature.id ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => handleFeatureSelect(feature.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 bg-${feature.color}-100 dark:bg-${feature.color}-900 rounded-lg`}>
                  <IconComponent className={`w-6 h-6 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{feature.credits} credits</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{feature.description}</p>
            </div>
          )
        })}
      </div>

      {/* Feature Form */}
      {activeFeature && <div className="card p-6">{renderFeatureForm()}</div>}

      {/* Generated Content */}
      {renderGeneratedContent()}
    </div>
  )
}

export default AIFeaturesPage

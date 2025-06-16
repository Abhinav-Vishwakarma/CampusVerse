"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { aiAPI } from "../../services/api"
import {
  FileText, CheckCircle, Download, Upload, Zap, Map, CreditCard
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

const AIFeaturesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [credits, setCredits] = useState(0)
  const [activeFeature, setActiveFeature] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [loading, setLoading] = useState(false)

  // Resume form state
  const [resumeForm, setResumeForm] = useState({
    template: "modern",
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
      linkedin: "",
      github: "",
    },
    summary: "",
    experience: [{ title: "", company: "", duration: "", description: "" }],
    education: [{ degree: "", institution: "", year: "", cgpa: "" }],
    skills: [""],
    projects: [{ name: "", description: "", technologies: [""], link: "" }],
    achievements: [""],
  })

  // ATS form state
  const [atsForm, setAtsForm] = useState({
    resumeContent: "",
    jobDescription: "",
  })
  const [atsFile, setAtsFile] = useState(null)
  const [atsUploading, setAtsUploading] = useState(false)

  // Roadmap form state
  const [roadmapForm, setRoadmapForm] = useState({
    targetRole: "",
    currentLevel: "beginner",
    duration: "",
  })

  // Fetch AI credits on mount
  useEffect(() => {
    if (user?._id || user?.id) fetchCredits()
    // eslint-disable-next-line
  }, [user])

  const fetchCredits = async () => {
    try {
      const res = await aiAPI.getCredits(user.id || user.id)
      setCredits(res.data?.data?.remainingCredits ?? 0)
    } catch {
      setCredits(0)
    }
  }

  // Feature configs
  const aiFeatures = [
    {
      id: "resume",
      name: "Resume Builder",
      description: "Generate a professional resume using AI.",
      credits: 10,
      icon: FileText,
      color: "blue",
    },
    {
      id: "ats",
      name: "ATS Checker",
      description: "Check your resume against a job description.",
      credits: 5,
      icon: CheckCircle,
      color: "green",
    },
    {
      id: "roadmap",
      name: "Roadmap Generator",
      description: "Create a personalized learning roadmap.",
      credits: 15,
      icon: Map,
      color: "purple",
    },
  ]

  // Feature selection
  const handleFeatureSelect = (featureId) => {
    const feature = aiFeatures.find((f) => f.id === featureId)
    if (credits < feature.credits) {
      showError(`Insufficient credits. You need ${feature.credits} credits for this feature.`)
      return
    }
    setActiveFeature(featureId)
    setGeneratedContent(null)
  }

  // Resume form handlers
  const handleResumeChange = (field, value) => {
    setResumeForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }
  const handlePersonalInfoChange = (field, value) => {
    setResumeForm((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }))
  }
  const handleArrayChange = (field, idx, subfield, value) => {
    setResumeForm((prev) => {
      const arr = [...prev[field]]
      arr[idx][subfield] = value
      return { ...prev, [field]: arr }
    })
  }
  const handleAddArrayItem = (field, emptyObj) => {
    setResumeForm((prev) => ({
      ...prev,
      [field]: [...prev[field], emptyObj],
    }))
  }
  const handleRemoveArrayItem = (field, idx) => {
    setResumeForm((prev) => {
      const arr = [...prev[field]]
      arr.splice(idx, 1)
      return { ...prev, [field]: arr }
    })
  }
  const handleSkillsChange = (idx, value) => {
    setResumeForm((prev) => {
      const arr = [...prev.skills]
      arr[idx] = value
      return { ...prev, skills: arr }
    })
  }
  const handleAddSkill = () => {
    setResumeForm((prev) => ({
      ...prev,
      skills: [...prev.skills, ""],
    }))
  }
  const handleRemoveSkill = (idx) => {
    setResumeForm((prev) => {
      const arr = [...prev.skills]
      arr.splice(idx, 1)
      return { ...prev, skills: arr }
    })
  }

  // Resume Generation
  const handleResumeGeneration = async () => {
    if (
      !resumeForm.personalInfo.name ||
      !resumeForm.personalInfo.email ||
      !resumeForm.skills.filter((s) => s.trim()).length
    ) {
      showError("Please fill in all required fields (Name, Email, Skills)")
      return
    }
    setLoading(true)
    try {
      const payload = {
        userId: user._id || user.id,
        ...resumeForm,
        skills: resumeForm.skills.filter((s) => s.trim()),
        experience: resumeForm.experience.filter((e) => e.title || e.company),
        education: resumeForm.education.filter((e) => e.degree || e.institution),
        projects: resumeForm.projects.filter((p) => p.name),
        achievements: resumeForm.achievements.filter((a) => a.trim()),
      }
      const res = await aiAPI.generateResume(payload)
      setGeneratedContent(res.data?.data?.resume?.generatedContent || res.data?.data?.resume)
      setCredits(res.data?.data?.creditsRemaining ?? credits)
      showSuccess("Resume generated successfully!")
    } catch (error) {
      showError(error.message || "Failed to generate resume")
    } finally {
      setLoading(false)
    }
  }

  // ATS PDF Upload Handler (uses new backend route)
  const handleATSFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.endsWith(".pdf")) {
      showError("Please upload a PDF file.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showError("File size should be less than 5MB.")
      return
    }
    setAtsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      // Use the new Gemini-powered backend endpoint for PDF extraction
      const res = await aiAPI.uploadATSResume(formData)
      setAtsForm((f) => ({ ...f, resumeContent: res.data?.text || "" }))
      setAtsFile(file)
      showSuccess("PDF uploaded and text extracted!")
    } catch (error) {
      showError("Failed to extract text from PDF.")
    } finally {
      setAtsUploading(false)
    }
  }

  // ATS Check
  const handleATSCheck = async () => {
    if (!atsForm.resumeContent || !atsForm.jobDescription) {
      showError("Please provide both resume content and job description")
      return
    }
    setLoading(true)
    try {
      const payload = {
        userId: user._id || user.id,
        resumeContent: atsForm.resumeContent,
        jobDescription: atsForm.jobDescription,
      }
      const res = await aiAPI.checkATS(payload)
      setGeneratedContent(res.data?.data?.report)
      setCredits(res.data?.data?.creditsRemaining ?? credits)
      showSuccess("ATS analysis completed!")
    } catch (error) {
      showError(error.message || "Failed to analyze resume")
    } finally {
      setLoading(false)
    }
  }

  // Roadmap Generation
  const handleRoadmapGeneration = async () => {
    if (!roadmapForm.targetRole || !roadmapForm.duration) {
      showError("Please fill in all required fields")
      return
    }
    setLoading(true)
    try {
      const payload = {
        userId: user._id || user.id,
        ...roadmapForm,
      }
      const res = await aiAPI.generateRoadmap(payload)
      setGeneratedContent(res.data?.data?.roadmap)
      setCredits(res.data?.data?.creditsRemaining ?? credits)
      showSuccess("Learning roadmap generated!")
    } catch (error) {
      showError(error.message || "Failed to generate roadmap")
    } finally {
      setLoading(false)
    }
  }

  // Download helpers
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

  // Feature forms
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
                value={resumeForm.personalInfo.name}
                onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                className="input-field"
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={resumeForm.personalInfo.email}
                onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                className="input-field"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={resumeForm.personalInfo.phone}
                onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                className="input-field"
              />
              <input
                type="text"
                placeholder="Location"
                value={resumeForm.personalInfo.location}
                onChange={(e) => handlePersonalInfoChange("location", e.target.value)}
                className="input-field"
              />
              <input
                type="text"
                placeholder="LinkedIn"
                value={resumeForm.personalInfo.linkedin}
                onChange={(e) => handlePersonalInfoChange("linkedin", e.target.value)}
                className="input-field"
              />
              <input
                type="text"
                placeholder="GitHub"
                value={resumeForm.personalInfo.github}
                onChange={(e) => handlePersonalInfoChange("github", e.target.value)}
                className="input-field"
              />
            </div>
            <textarea
              placeholder="Professional Summary"
              value={resumeForm.summary}
              onChange={(e) => handleResumeChange("summary", e.target.value)}
              className="input-field"
              rows={3}
            />
            {/* Experience */}
            <div>
              <label className="block font-medium mb-1">Experience</label>
              {resumeForm.experience.map((exp, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Title"
                    value={exp.title}
                    onChange={(e) => handleArrayChange("experience", idx, "title", e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    value={exp.company}
                    onChange={(e) => handleArrayChange("experience", idx, "company", e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={exp.duration}
                    onChange={(e) => handleArrayChange("experience", idx, "duration", e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={exp.description}
                    onChange={(e) => handleArrayChange("experience", idx, "description", e.target.value)}
                    className="input-field"
                  />
                  {resumeForm.experience.length > 1 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleRemoveArrayItem("experience", idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary mt-1"
                onClick={() =>
                  handleAddArrayItem("experience", { title: "", company: "", duration: "", description: "" })
                }
              >
                Add Experience
              </button>
            </div>
            {/* Education */}
            <div>
              <label className="block font-medium mb-1">Education</label>
              {resumeForm.education.map((edu, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Degree"
                    value={edu.degree}
                    onChange={(e) => handleArrayChange("education", idx, "degree", e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Institution"
                    value={edu.institution}
                    onChange={(e) => handleArrayChange("education", idx, "institution", e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Year"
                    value={edu.year}
                    onChange={(e) => handleArrayChange("education", idx, "year", e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="CGPA"
                    value={edu.cgpa}
                    onChange={(e) => handleArrayChange("education", idx, "cgpa", e.target.value)}
                    className="input-field"
                  />
                  {resumeForm.education.length > 1 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleRemoveArrayItem("education", idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary mt-1"
                onClick={() =>
                  handleAddArrayItem("education", { degree: "", institution: "", year: "", cgpa: "" })
                }
              >
                Add Education
              </button>
            </div>
            {/* Skills */}
            <div>
              <label className="block font-medium mb-1">Skills *</label>
              {resumeForm.skills.map((skill, idx) => (
                <div key={idx} className="flex items-center mb-1">
                  <input
                    type="text"
                    placeholder="Skill"
                    value={skill}
                    onChange={(e) => handleSkillsChange(idx, e.target.value)}
                    className="input-field"
                  />
                  {resumeForm.skills.length > 1 && (
                    <button
                      type="button"
                      className="btn-secondary ml-2"
                      onClick={() => handleRemoveSkill(idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-secondary mt-1" onClick={handleAddSkill}>
                Add Skill
              </button>
            </div>
            {/* Projects */}
            <div>
              <label className="block font-medium mb-1">Projects</label>
              {resumeForm.projects.map((proj, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Project Name"
                    value={proj.name}
                    onChange={(e) => handleArrayChange("projects", idx, "name", e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Description"
                    value={proj.description}
                    onChange={(e) => handleArrayChange("projects", idx, "description", e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Technologies (comma separated)"
                    value={proj.technologies.join(", ")}
                    onChange={(e) =>
                      setResumeForm((prev) => {
                        const arr = [...prev.projects]
                        arr[idx].technologies = e.target.value.split(",").map((t) => t.trim())
                        return { ...prev, projects: arr }
                      })
                    }
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Link"
                    value={proj.link}
                    onChange={(e) => handleArrayChange("projects", idx, "link", e.target.value)}
                    className="input-field"
                  />
                  {resumeForm.projects.length > 1 && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleRemoveArrayItem("projects", idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary mt-1"
                onClick={() =>
                  handleAddArrayItem("projects", { name: "", description: "", technologies: [""], link: "" })
                }
              >
                Add Project
              </button>
            </div>
            {/* Achievements */}
            <div>
              <label className="block font-medium mb-1">Achievements</label>
              {resumeForm.achievements.map((ach, idx) => (
                <div key={idx} className="flex items-center mb-1">
                  <input
                    type="text"
                    placeholder="Achievement"
                    value={ach}
                    onChange={(e) => {
                      const arr = [...resumeForm.achievements]
                      arr[idx] = e.target.value
                      setResumeForm((prev) => ({ ...prev, achievements: arr }))
                    }}
                    className="input-field"
                  />
                  {resumeForm.achievements.length > 1 && (
                    <button
                      type="button"
                      className="btn-secondary ml-2"
                      onClick={() => handleRemoveArrayItem("achievements", idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary mt-1"
                onClick={() => handleAddArrayItem("achievements", "")}
              >
                Add Achievement
              </button>
            </div>
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
              <span>{loading ? "Generating..." : "Generate Resume (10 credits)"}</span>
            </button>
          </div>
        )
      case "ats":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ATS Checker</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload Resume (PDF)
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleATSFileUpload}
                className="input-field"
                disabled={atsUploading}
              />
              {atsFile && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {atsFile.name} uploaded
                </div>
              )}
            </div>
            <textarea
              placeholder="Paste the job description here"
              value={atsForm.jobDescription}
              onChange={(e) => setAtsForm((f) => ({ ...f, jobDescription: e.target.value }))}
              className="input-field"
              rows={6}
            />
            <button
              onClick={handleATSCheck}
              disabled={loading || atsUploading || !atsForm.resumeContent}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{loading ? "Analyzing..." : "Analyze Resume (5 credits)"}</span>
            </button>
            {atsUploading && (
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">Extracting text from PDF...</div>
            )}
            {atsForm.resumeContent && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-gray-500">Show extracted resume text</summary>
                <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs max-h-40 overflow-y-auto">
                  {atsForm.resumeContent}
                </pre>
              </details>
            )}
          </div>
        )
      case "roadmap":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Roadmap Generator</h3>
            <input
              type="text"
              placeholder="Target Role (e.g., Full Stack Developer)"
              value={roadmapForm.targetRole}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, targetRole: e.target.value }))}
              className="input-field"
            />
            <select
              value={roadmapForm.currentLevel}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, currentLevel: e.target.value }))}
              className="input-field"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <input
              type="text"
              placeholder="Duration (e.g., 6 months)"
              value={roadmapForm.duration}
              onChange={(e) => setRoadmapForm((f) => ({ ...f, duration: e.target.value }))}
              className="input-field"
            />
            <button
              onClick={handleRoadmapGeneration}
              disabled={loading}
              className="btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Map className="w-4 h-4" />
              )}
              <span>{loading ? "Generating..." : "Generate Roadmap (15 credits)"}</span>
            </button>
          </div>
        )
      default:
        return null
    }
  }

  // Render generated content
  const renderGeneratedContent = () => {
    if (!generatedContent) return null
    switch (activeFeature) {
      case "resume":
        return (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generated Resume</h3>
              <button
                onClick={() => handleDownload(generatedContent, "resume.md")}
                className="btn-secondary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg prose prose-blue dark:prose-invert max-w-none shadow-inner animate-fade-in">
              <ReactMarkdown
                children={generatedContent}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-4 mb-2 border-b border-blue-200 dark:border-blue-700 pb-1" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-200 mt-3 mb-1" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-lg font-semibold text-blue-500 dark:text-blue-100 mt-2 mb-1" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-2" {...props} />,
                  li: ({node, ...props}) => <li className="mb-1" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-blue-700 dark:text-blue-300" {...props} />,
                  a: ({node, ...props}) => <a className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2" {...props} />,
                  table: ({node, ...props}) => <table className="table-auto border-collapse w-full my-4" {...props} />,
                  th: ({node, ...props}) => <th className="border px-2 py-1 bg-blue-100 dark:bg-blue-900" {...props} />,
                  td: ({node, ...props}) => <td className="border px-2 py-1" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-600 dark:text-gray-300 my-2" {...props} />,
                  code: ({node, ...props}) => <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded text-sm" {...props} />,
                }}
              />
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
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Matched Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.analysis.matchedKeywords.map((kw, i) => (
                    <span key={i} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">{kw}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Missing Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {generatedContent.analysis.missingKeywords.map((kw, i) => (
                    <span key={i} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">{kw}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Suggestions</h4>
                <ul className="space-y-1">
                  {generatedContent.analysis.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start space-x-2">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Scores</h4>
                <ul className="space-y-1">
                  <li>Format Score: <b>{generatedContent.analysis.formatScore}</b></li>
                  <li>Content Score: <b>{generatedContent.analysis.contentScore}</b></li>
                  <li>Keyword Score: <b>{generatedContent.analysis.keywordScore}</b></li>
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
                    `${generatedContent.title.replace(/\s+/g, "_")}_roadmap.json`,
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
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{generatedContent.title}</h4>
                <p className="text-gray-600 dark:text-gray-400">Target Role: {generatedContent.targetRole}</p>
                <p className="text-gray-600 dark:text-gray-400">Duration: {generatedContent.duration}</p>
              </div>
              <div className="space-y-4">
                {generatedContent.phases.map((phase, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 dark:text-white mb-3">{phase.title}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics</h6>
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
                          Resources
                        </h6>
                        <ul className="space-y-1">
                          {phase.resources.map((resource, resourceIndex) => (
                            <li
                              key={resourceIndex}
                              className="text-sm text-blue-600 dark:text-blue-400 flex items-center space-x-2"
                            >
                              <FileText className="w-3 h-3" />
                              <span>
                                {resource.title} ({resource.type}){" "}
                                {resource.url && (
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="underline">
                                    Link
                                  </a>
                                )}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2 mb-1">Milestones</h6>
                      <ul className="space-y-1">
                        {phase.milestones.map((m, i) => (
                          <li key={i} className="text-sm text-purple-600 dark:text-purple-400 flex items-center space-x-2">
                            <CheckCircle className="w-3 h-3" />
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
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

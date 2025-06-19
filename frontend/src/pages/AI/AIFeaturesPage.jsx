"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { aiAPI } from "../../services/api"
import {
  FileText, CheckCircle, Download, Upload, Zap, Map, CreditCard, Trash2, ChevronDown, ChevronUp
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
// Add jsPDF for PDF generation
import jsPDF from "jspdf"
import "jspdf-autotable"
import html2pdf from "html2pdf.js"

const AIFeaturesPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [credits, setCredits] = useState(0)
  const [activeFeature, setActiveFeature] = useState(null)
  const [generatedContent, setGeneratedContent] = useState(null)
  const [loading, setLoading] = useState(false)

  // Roadmaps state
  const [roadmaps, setRoadmaps] = useState([])
  const [roadmapsLoading, setRoadmapsLoading] = useState(false)
  const [expandedRoadmap, setExpandedRoadmap] = useState(null)

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

  // PDF content state
  const [pdfContent, setPdfContent] = useState(null)
  const [pdfFilename, setPdfFilename] = useState("")
  const pdfRef = useRef()

  // Resumes state
  const [resumes, setResumes] = useState([])
  const [resumesLoading, setResumesLoading] = useState(false)
  const [expandedResume, setExpandedResume] = useState(null)

  // Fetch AI credits on mount
  useEffect(() => {
    if (user?._id || user?.id) fetchCredits()
    // eslint-disable-next-line
  }, [user])

  // Fetch old roadmaps when switching to roadmap feature
  useEffect(() => {
    if (activeFeature === "roadmap" && (user?._id || user?.id)) {
      fetchRoadmaps()
    }
    // eslint-disable-next-line
  }, [activeFeature])

  // Fetch old resumes when switching to resume feature
  useEffect(() => {
    if (activeFeature === "resume" && (user?._id || user?.id)) {
      fetchResumes()
    }
    // eslint-disable-next-line
  }, [activeFeature])

  const fetchCredits = async () => {
    try {
      const res = await aiAPI.getCredits(user.id || user._id)
      setCredits(res.data?.data?.remainingCredits ?? 0)
    } catch {
      setCredits(0)
    }
  }

  // Fetch user's old roadmaps
  const fetchRoadmaps = async () => {
    setRoadmapsLoading(true)
    try {
      const res = await aiAPI.getRoadmaps(user.id || user._id)
      setRoadmaps(res.data?.data || [])
    } catch {
      setRoadmaps([])
    } finally {
      setRoadmapsLoading(false)
    }
  }

  // Fetch user's old resumes
  const fetchResumes = async () => {
    setResumesLoading(true)
    try {
      const res = await aiAPI.getResumes(user.id || user._id)
      setResumes(res.data?.data || [])
    } catch {
      setResumes([])
    } finally {
      setResumesLoading(false)
    }
  }

  // Delete a roadmap
  const handleDeleteRoadmap = async (roadmapId) => {
    if (!window.confirm("Are you sure you want to delete this roadmap?")) return
    try {
      await aiAPI.deleteRoadmap(roadmapId)
      setRoadmaps((prev) => prev.filter((r) => r._id !== roadmapId))
      showSuccess("Roadmap deleted successfully!")
    } catch {
      showError("Failed to delete roadmap")
    }
  }

  // Delete a resume
  const handleDeleteResume = async (resumeId) => {
    if (!window.confirm("Are you sure you want to delete this resume?")) return
    try {
      await aiAPI.deleteResume(resumeId)
      setResumes((prev) => prev.filter((r) => r._id !== resumeId))
      showSuccess("Resume deleted successfully!")
    } catch {
      showError("Failed to delete resume")
    }
  }

  // PDF Download for roadmap
  const handleDownload = (roadmap, filename) => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    })
    const margin = 15
    let y = margin

    // Title
    doc.setFontSize(20)
    doc.setTextColor(40, 40, 120)
    doc.text(roadmap.title || "Learning Roadmap", margin, y)
    y += 10

    // Target Role & Duration
    doc.setFontSize(12)
    doc.setTextColor(60, 60, 60)
    doc.text(`Target Role: ${roadmap.targetRole || ""}`, margin, y)
    y += 7
    doc.text(`Duration: ${roadmap.duration || ""}`, margin, y)
    y += 10

    // Phases
    roadmap.phases?.forEach((phase, idx) => {
      // Phase Title
      doc.setFontSize(15)
      doc.setTextColor(30, 90, 160)
      doc.text(`${idx + 1}. ${phase.title}`, margin, y)
      y += 8

      // Topics
      doc.setFontSize(12)
      doc.setTextColor(80, 80, 80)
      doc.text("Topics:", margin + 2, y)
      y += 6
      phase.topics.forEach((topic) => {
        doc.text(`• ${topic}`, margin + 8, y)
        y += 5
      })

      // Resources
      doc.setTextColor(80, 80, 80)
      doc.text("Resources:", margin + 2, y)
      y += 6
      phase.resources.forEach((res) => {
        let text = `• ${res.title} (${res.type})`
        if (res.url) {
          // Add clickable link
          doc.textWithLink(text, margin + 8, y, { url: res.url })
        } else {
          doc.text(text, margin + 8, y)
        }
        y += 5
      })

      // Milestones
      doc.setTextColor(80, 80, 80)
      doc.text("Milestones:", margin + 2, y)
      y += 6
      phase.milestones.forEach((m) => {
        doc.text(`• ${m}`, margin + 8, y)
        y += 5
      })

      y += 6
      // Add new page if near bottom
      if (y > 270) {
        doc.addPage()
        y = margin
      }
    })

    doc.save(filename)
    showSuccess(`${filename} downloaded successfully!`)
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
      fetchResumes() // <-- fetch updated resumes
      showSuccess("Resume generated successfully!")
    } catch (error) {
      showError(error.message || "Failed to generate resume")
    } finally {
      setLoading(false)
    }
  }

  
  // ATS Check
 const handleATSCheck = async () => {
  if (!atsFile || !atsForm.jobDescription) {
    showError("Please upload a resume PDF and enter the job description.");
    return;
  }

  setAtsUploading(true);
  setLoading(true);

  try {
    const formData = new FormData();
    formData.append("file", atsFile); 
    formData.append("jobDescription", atsForm.jobDescription);
    formData.append("userId", user._id || user.id);
    for (let pair of formData.entries()) {
  console.log(pair[0] + ": ", pair[1]);
}
    console.log(formData)
    const res = await aiAPI.checkATS(formData);

    setGeneratedContent(res.data?.data?.report);
    setCredits(res.data?.data?.creditsRemaining ?? credits);
    showSuccess("ATS analysis completed!");
  } catch (error) {
    showError(error.response?.data?.message || error.message || "Failed to analyze resume");
  } finally {
    setAtsUploading(false);
    setLoading(false);
  }
};


  // Roadmap Generation
  const handleRoadmapGeneration = async () => {
    if (!roadmapForm.targetRole || !roadmapForm.duration) {
      showError("Please fill in all required fields")
      return
    }
    setLoading(true)
    try {
      const payload = {
        userId: user.id,
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

  // Render user's old roadmaps
  const renderOldRoadmaps = () => {
    if (roadmapsLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }
    if (!roadmaps.length) {
      return (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No saved roadmaps found.
        </div>
      )
    }
    return (
      <div className="space-y-4">
        {roadmaps.map((roadmap) => (
          <div key={roadmap._id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{roadmap.title}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Target Role: {roadmap.targetRole} | Duration: {roadmap.duration}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary flex items-center space-x-1"
                  onClick={() => handleDownload(roadmap, `${roadmap.title.replace(/\s+/g, "_")}_roadmap.pdf`)}
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  className="btn-danger flex items-center space-x-1"
                  onClick={() => handleDeleteRoadmap(roadmap._id)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  className="btn-secondary flex items-center space-x-1"
                  onClick={() =>
                    setExpandedRoadmap(expandedRoadmap === roadmap._id ? null : roadmap._id)
                  }
                >
                  {expandedRoadmap === roadmap._id ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {expandedRoadmap === roadmap._id && (
              <div className="mt-4">
                {/* You can reuse your roadmap rendering logic here */}
                <div className="space-y-6">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">{roadmap.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">Target Role: {roadmap.targetRole}</p>
                    <p className="text-gray-600 dark:text-gray-400">Duration: {roadmap.duration}</p>
                  </div>
                  <div className="space-y-4">
                    {roadmap.phases.map((phase, index) => (
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
            )}
          </div>
        ))}
      </div>
    )
  }

  // Feature forms
  const renderFeatureForm = () => {
    switch (activeFeature) {
      case "resume":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume Builder</h3>
            {/* Old Resumes */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Saved Resumes</h3>
              {renderOldResumes()}
            </div>
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
                onChange={e => setAtsFile(e.target.files[0])}
                className="input-field"
                disabled={atsUploading}
              />
              {atsFile && (
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {atsFile.name} attached
                </div>
              )}
            </div>
            <textarea
              placeholder="Paste the job description here"
              value={atsForm.jobDescription}
              onChange={e => setAtsForm(f => ({ ...f, jobDescription: e.target.value }))}
              className="input-field"
              rows={6}
              disabled={atsUploading}
            />
            <button
              onClick={handleATSCheck}
              disabled={loading || atsUploading}
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
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">Processing PDF and analyzing...</div>
            )}
          </div>
        )
      case "roadmap":
        return (
          <div>
            {/* Old Roadmaps */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Your Saved Roadmaps</h3>
              {renderOldRoadmaps()}
            </div>
            {/* New Roadmap Form */}
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
            <button
              onClick={() => handleDownloadPDF(getATSReportHtml(generatedContent), "ats_report.pdf")}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
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

  // Download PDF handler
  const handleDownloadPDF = (content, filename) => {
    setPdfContent(content)
    setPdfFilename(filename)
    setTimeout(() => {
      if (pdfRef.current) {
        html2pdf()
          .set({
            margin: [25, 20, 25, 20], // [top, right, bottom, left] margins in mm
            filename,
            html2canvas: { 
              scale: 2,
              useCORS: true,
              logging: true
            },
            jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: 'portrait',
              compress: true
            },
            pagebreak: { mode: 'avoid-all' }
          })
          .from(pdfRef.current)
          .save()
          .then(() => {
            setPdfContent(null)
            setPdfFilename("")
          })
      }
    }, 100)
  }

  const getRoadmapHtml = (roadmap) => (
    <div>
      <h1>{roadmap.title}</h1>
      <p><b>Target Role:</b> {roadmap.targetRole}</p>
      <p><b>Duration:</b> {roadmap.duration}</p>
      {roadmap.phases.map((phase, idx) => (
        <div key={idx}>
          <h2>{idx + 1}. {phase.title}</h2>
          <h3>Topics</h3>
          <ul>
            {phase.topics.map((topic, i) => <li key={i}>{topic}</li>)}
          </ul>
          <h3>Resources</h3>
          <ul>
            {phase.resources.map((res, i) => (
              <li key={i}>
                {res.title} ({res.type}){" "}
                {res.url && (
                  <a href={res.url} target="_blank" rel="noopener noreferrer">{res.url}</a>
                )}
              </li>
            ))}
          </ul>
          <h3>Milestones</h3>
          <ul>
            {phase.milestones.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )

  const getResumeHtml = (resume) => (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.5',
      color: '#000000'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          marginBottom: '8px',
          color: '#000000'
        }}>{resume.personalInfo.name}</h1>
        <p style={{ margin: '4px 0' }}>
          {resume.personalInfo.email} • {resume.personalInfo.phone}
        </p>
        <p style={{ margin: '4px 0' }}>
          {resume.personalInfo.location}
        </p>
        {(resume.personalInfo.linkedin || resume.personalInfo.github) && (
          <p style={{ margin: '4px 0' }}>
            {resume.personalInfo.linkedin && `LinkedIn: ${resume.personalInfo.linkedin}`}
            {resume.personalInfo.linkedin && resume.personalInfo.github && ' • '}
            {resume.personalInfo.github && `GitHub: ${resume.personalInfo.github}`}
          </p>
        )}
      </div>

      {resume.summary && (
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            borderBottom: '1px solid #000000',
            paddingBottom: '4px',
            marginBottom: '8px',
            color: '#000000'
          }}>Professional Summary</h2>
          <p>{resume.summary}</p>
        </div>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h2 style={{ 
          fontSize: '18px', 
          borderBottom: '1px solid #000000',
          paddingBottom: '4px',
          marginBottom: '8px',
          color: '#000000'
        }}>Skills</h2>
        <p>{resume.skills.filter(s => s.trim()).join(' • ')}</p>
      </div>

      {resume.experience.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            borderBottom: '1px solid #000000',
            paddingBottom: '4px',
            marginBottom: '8px',
            color: '#000000'
          }}>Professional Experience</h2>
          {resume.experience.filter(exp => exp.title || exp.company).map((exp, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {exp.title} - {exp.company}
              </div>
              <div style={{ 
                fontSize: '14px', 
                marginBottom: '4px',
                fontStyle: 'italic'
              }}>{exp.duration}</div>
              <p>{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {resume.education.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            borderBottom: '1px solid #000000',
            paddingBottom: '4px',
            marginBottom: '8px',
            color: '#000000'
          }}>Education</h2>
          {resume.education.filter(edu => edu.degree || edu.institution).map((edu, i) => (
            <div key={i} style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>
                {edu.degree} - {edu.institution}
              </div>
              <div style={{ fontSize: '14px' }}>
                {edu.year}{edu.cgpa && ` • CGPA: ${edu.cgpa}`}
              </div>
            </div>
          ))}
        </div>
      )}

      {resume.projects.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            borderBottom: '1px solid #000000',
            paddingBottom: '4px',
            marginBottom: '8px',
            color: '#000000'
          }}>Projects</h2>
          {resume.projects.filter(proj => proj.name).map((proj, i) => (
            <div key={i} style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {proj.name}
                {proj.link && ` • ${proj.link}`}
              </div>
              <div style={{ marginBottom: '4px' }}>{proj.description}</div>
              {proj.technologies.length > 0 && (
                <div style={{ fontSize: '14px' }}>
                  <strong>Technologies:</strong> {proj.technologies.filter(t => t.trim()).join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {resume.achievements.length > 0 && (
        <div style={{ marginBottom: '15px' }}>
          <h2 style={{ 
            fontSize: '18px', 
            borderBottom: '1px solid #000000',
            paddingBottom: '4px',
            marginBottom: '8px',
            color: '#000000'
          }}>Achievements</h2>
          <ul style={{ 
            marginLeft: '20px',
            paddingLeft: 0,
            listStyleType: 'disc'
          }}>
            {resume.achievements.filter(a => a.trim()).map((achievement, i) => (
              <li key={i} style={{ marginBottom: '4px' }}>{achievement}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )

  const getATSReportHtml = (report) => (
    <div>
      <h1>ATS Analysis Report</h1>
      <h2>Score: {report.score}%</h2>
      <h3>Matched Keywords</h3>
      <ul>
        {report.analysis.matchedKeywords.map((kw, i) => <li key={i}>{kw}</li>)}
      </ul>
      <h3>Missing Keywords</h3>
      <ul>
        {report.analysis.missingKeywords.map((kw, i) => <li key={i}>{kw}</li>)}
      </ul>
      <h3>Suggestions</h3>
      <ul>
        {report.analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
      <h3>Scores</h3>
      <ul>
        <li>Format Score: <b>{report.analysis.formatScore}</b></li>
        <li>Content Score: <b>{report.analysis.contentScore}</b></li>
        <li>Keyword Score: <b>{report.analysis.keywordScore}</b></li>
      </ul>
    </div>
  )

  // Add this function inside your AIFeaturesPage component, before renderFeatureForm
  const renderOldResumes = () => {
    if (resumesLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }
    if (!resumes.length) {
      return (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No saved resumes found.
        </div>
      )
    }
    return (
      <div className="space-y-4">
        {resumes.map((resume) => (
          <div key={resume._id} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{resume.personalInfo?.name || "Resume"}</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {resume.personalInfo?.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary flex items-center space-x-1"
                  onClick={() => handleDownloadPDF(getResumeHtml(resume), `${resume.personalInfo?.name?.replace(/\s+/g, "_") || "resume"}_resume.pdf`)}
                >
                  <Download className="w-4 h-4" />
                  <span>PDF</span>
                </button>
                <button
                  className="btn-danger flex items-center space-x-1"
                  onClick={() => handleDeleteResume(resume._id)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  className="btn-secondary flex items-center space-x-1"
                  onClick={() =>
                    setExpandedResume(expandedResume === resume._id ? null : resume._id)
                  }
                >
                  {expandedResume === resume._id ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      <span>Hide</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      <span>Show</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            {expandedResume === resume._id && (
              <div className="mt-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg prose prose-blue dark:prose-invert max-w-none shadow-inner animate-fade-in">
                  <ReactMarkdown
                    children={resume.generatedContent || ""}
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
            )}
          </div>
        ))}
      </div>
    )
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

      {pdfContent && (
        <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
          <div ref={pdfRef} style={{ 
            width: "210mm",
            padding: "25mm 20mm",
            backgroundColor: "#ffffff",
            color: "#000000"
          }}>
            <style>
              {`
                @page {
                  margin: 25mm 20mm;
                }
                * {
                  font-family: Arial, sans-serif;
                  line-height: 1.5;
                  color: #000000;
                }
                a { 
                  color: #000000 !important; 
                  text-decoration: none;
                }
                h1, h2, h3, h4 { 
                  color: #000000;
                  margin-bottom: 8px;
                }
                ul { 
                  margin-left: 20px;
                  padding-left: 0;
                }
                li {
                  margin-bottom: 4px;
                }
              `}
            </style>
            {pdfContent}
          </div>
        </div>
      )}
    </div>
  )
}

export default AIFeaturesPage

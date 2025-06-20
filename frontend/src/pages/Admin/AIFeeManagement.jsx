"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { Brain, Plus, Search, Download, Eye, Edit } from "lucide-react"
import FeeManagement from "./FeeManagement"
import { usersAPI, aiAPI } from "../../services/api"

const AIFeeManagement = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [activeTab, setActiveTab] = useState("fee-management")
  const [students, setStudents] = useState([])
  const [feeRecords, setFeeRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const [creditForm, setCreditForm] = useState({
    studentId: "",
    credits: 0,
    reason: "",
  })

  const [feeForm, setFeeForm] = useState({
    type: "individual", // individual or bulk
    studentId: "",
    course: "",
    branch: "",
    semester: "",
    feeType: "",
    amount: "",
    dueDate: "",
    description: "",
  })

  useEffect(() => {
    fetchUsers()
    // Optionally, fetch fee records from backend here as well
  }, [])

  // Fetch users from backend
  const fetchUsers = async (query = "") => {
    setLoading(true)
    try {
      // Use the search query if provided
      const filters = query ? { q: query } : {}
      const res = await usersAPI.getUsers(filters)
      setStudents(res.data?.users || [])
    } catch (error) {
      showError("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  
  const handleAllocateCredits = async () => {
    if (!creditForm.studentId || !creditForm.credits || creditForm.credits <= 0) {
      showError("Please fill in all required fields")
      return
    }
    console.log(creditForm)
    try {

      await api.updateCredits({userId:creditForm.studentId,
        credits:creditForm.credits
      })

      setStudents((prev) =>
        prev.map((student) =>
          student._id === creditForm.studentId
            ? { ...student, aiCredits: student.aiCredits + Number.parseInt(creditForm.credits) }
            : student,
        ),
      )

      setCreditForm({ studentId: "", credits: 0, reason: "" })
      setShowCreditModal(false)
      showSuccess("AI credits allocated successfully!")
    } catch (error) {
      showError("Failed to allocate credits")
    }
  }

  const handleCreateFeeRecord = async () => {
    if (feeForm.type === "individual") {
      if (!feeForm.studentId || !feeForm.feeType || !feeForm.amount || !feeForm.dueDate) {
        showError("Please fill in all required fields")
        return
      }
    } else {
      if (
        !feeForm.course ||
        !feeForm.branch ||
        !feeForm.semester ||
        !feeForm.feeType ||
        !feeForm.amount ||
        !feeForm.dueDate
      ) {
        showError("Please fill in all required fields")
        return
      }
    }

    try {
      if (feeForm.type === "individual") {
        const student = students.find((s) => s._id === feeForm.studentId)
        const newFeeRecord = {
          _id: Date.now().toString(),
          student,
          feeType: feeForm.feeType,
          amount: Number.parseInt(feeForm.amount),
          dueDate: feeForm.dueDate,
          status: "pending",
          semester: feeForm.semester || student.semester,
          description: feeForm.description,
          createdAt: new Date().toISOString(),
        }
        setFeeRecords((prev) => [newFeeRecord, ...prev])
        showSuccess("Fee record created successfully!")
      } else {
        // Bulk creation
        const eligibleStudents = students.filter(
          (student) =>
            student.course === feeForm.course &&
            student.branch === feeForm.branch &&
            student.semester === feeForm.semester,
        )

        const newFeeRecords = eligibleStudents.map((student) => ({
          _id: `${Date.now()}-${student._id}`,
          student,
          feeType: feeForm.feeType,
          amount: Number.parseInt(feeForm.amount),
          dueDate: feeForm.dueDate,
          status: "pending",
          semester: feeForm.semester,
          description: feeForm.description,
          createdAt: new Date().toISOString(),
        }))

        setFeeRecords((prev) => [...newFeeRecords, ...prev])
        showSuccess(`Fee records created for ${eligibleStudents.length} students!`)
      }

      setFeeForm({
        type: "individual",
        studentId: "",
        course: "",
        branch: "",
        semester: "",
        feeType: "",
        amount: "",
        dueDate: "",
        description: "",
      })
      setShowFeeModal(false)
    } catch (error) {
      showError("Failed to create fee record")
    }
  }

  const filteredStudents = students.filter(
    (student) =>
      (student.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.admissionNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.universityRollNo || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredFeeRecords = feeRecords.filter(
    (record) =>
      (record.student?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.student?.admissionNo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.feeType || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderAICredits = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">AI Credits Management</h2>
          <p className="text-gray-600 dark:text-gray-400">Allocate and manage AI credits for students</p>
        </div>
        <button onClick={() => setShowCreditModal(true)} className="btn-primary flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Allocate Credits</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by name, admission no, or university roll no..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course/Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  AI Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">{student.name[0]}</span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Adm: {student.admissionNo} | URN: {student.universityRollNo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{student.course}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {student.branch} - {student.semester}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {student.aiCredits}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedStudent(student)
                        setCreditForm((prev) => ({ ...prev, studentId: student._id }))
                        setShowCreditModal(true)
                      }}
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Add Credits
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderFeeManagement = () => (
    <div className="space-y-6">
      <FeeManagement />
    </div>
  )

  const handleSearch = async (e) => {
    const value = e.target.value
    setSearchTerm(value)
    fetchUsers(value)
  }

  const handleAllocate = async () => {
    if (!selectedStudent || !creditForm.credits || creditForm.credits <= 0) {
      showError("Select a user and enter credits")
      return
    }
    setLoading(true)
    try {
      await aiAPI.updateCredits(selectedStudent._id, creditForm.credits)
      showSuccess("Credits allocated successfully!")
      setCreditForm({ studentId: "", credits: 0, reason: "" })
      setSelectedStudent(null)
      setStudents([])
      setSearchTerm("")
    } catch (e) {
      showError(e.message || "Failed to allocate credits")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI + Fee Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage AI credits and fee records for students</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          
          <button
            onClick={() => setActiveTab("fee-management")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "fee-management"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Fee Records ({feeRecords.length})
          </button>
          <button
            onClick={() => setActiveTab("ai-credits")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "ai-credits"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            AI Credits ({students.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">{activeTab === "ai-credits" ? renderAICredits() : renderFeeManagement()}</div>

      {/* Credit Allocation Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Allocate AI Credits</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student</label>
                <select
                  value={creditForm.studentId}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, studentId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">Select Student</option>
                  {students.map((student) => (
                    <option key={student._id} value={student._id}>
                      {student.name} ({student.admissionNo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Credits to Add
                </label>
                <input
                  type="number"
                  value={creditForm.credits}
                  onChange={(e) =>
                    setCreditForm((prev) => ({ ...prev, credits: Number.parseInt(e.target.value) || 0 }))
                  }
                  className="input-field"
                  min="1"
                  placeholder="Enter number of credits"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reason</label>
                <textarea
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm((prev) => ({ ...prev, reason: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Reason for credit allocation"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCreditModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleAllocateCredits} className="btn-primary flex-1">
                Allocate Credits
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fee Record Modal */}
      {showFeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Fee Record</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Creation Type</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="individual"
                      checked={feeForm.type === "individual"}
                      onChange={(e) => setFeeForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="mr-2"
                    />
                    Individual
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="bulk"
                      checked={feeForm.type === "bulk"}
                      onChange={(e) => setFeeForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="mr-2"
                    />
                    Bulk (by Course/Branch/Semester)
                  </label>
                </div>
              </div>

              {feeForm.type === "individual" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Student</label>
                  <select
                    value={feeForm.studentId}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, studentId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select Student</option>
                    {students.map((student) => (
                      <option key={student._id} value={student._id}>
                        {student.name} ({student.admissionNo})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
                    <select
                      value={feeForm.course}
                      onChange={(e) => setFeeForm((prev) => ({ ...prev, course: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select Course</option>
                      <option value="B.Tech">B.Tech</option>
                      <option value="M.Tech">M.Tech</option>
                      <option value="BCA">BCA</option>
                      <option value="MCA">MCA</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Branch</label>
                    <select
                      value={feeForm.branch}
                      onChange={(e) => setFeeForm((prev) => ({ ...prev, branch: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select Branch</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Semester</label>
                    <select
                      value={feeForm.semester}
                      onChange={(e) => setFeeForm((prev) => ({ ...prev, semester: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                        <option
                          key={sem}
                          value={`${sem}${sem === 1 ? "st" : sem === 2 ? "nd" : sem === 3 ? "rd" : "th"}`}
                        >
                          {sem}
                          {sem === 1 ? "st" : sem === 2 ? "nd" : sem === 3 ? "rd" : "th"} Semester
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Fee Type</label>
                  <select
                    value={feeForm.feeType}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, feeType: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select Fee Type</option>
                    <option value="Tuition Fee">Tuition Fee</option>
                    <option value="Lab Fee">Lab Fee</option>
                    <option value="Library Fee">Library Fee</option>
                    <option value="Exam Fee">Exam Fee</option>
                    <option value="Hostel Fee">Hostel Fee</option>
                    <option value="Transport Fee">Transport Fee</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={feeForm.amount}
                    onChange={(e) => setFeeForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="input-field"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                  value={feeForm.dueDate}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  value={feeForm.description}
                  onChange={(e) => setFeeForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowFeeModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleCreateFeeRecord} className="btn-primary flex-1">
                Create Fee Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIFeeManagement

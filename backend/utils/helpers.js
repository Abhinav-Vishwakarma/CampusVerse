/**
 * Calculate attendance percentage
 * @param {number} present - Number of classes attended
 * @param {number} total - Total number of classes
 * @returns {number} - Attendance percentage
 */
const calculateAttendancePercentage = (present, total) => {
  if (total === 0) return 0
  return (present / total) * 100
}

/**
 * Calculate classes needed to reach target percentage
 * @param {number} currentPresent - Current number of classes attended
 * @param {number} currentTotal - Current total number of classes
 * @param {number} targetPercentage - Target attendance percentage
 * @returns {number} - Number of consecutive classes needed to attend
 */
const calculateClassesNeeded = (currentPresent, currentTotal, targetPercentage) => {
  if (targetPercentage <= calculateAttendancePercentage(currentPresent, currentTotal)) {
    return 0
  }

  let classesNeeded = 0
  let present = currentPresent
  let total = currentTotal

  while (calculateAttendancePercentage(present, total) < targetPercentage) {
    present++
    total++
    classesNeeded++
  }

  return classesNeeded
}

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
const generateRandomString = (length) => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return result
}

export { calculateAttendancePercentage, calculateClassesNeeded, generateRandomString }

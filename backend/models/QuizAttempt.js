import mongoose from "mongoose"

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quiz: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    answers: [
      {
        question: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Question",
        },
        selectedOption: String,
        textAnswer: String,
        isCorrect: Boolean,
        marksObtained: Number,
      },
    ],
    startTime: {
      type: Date,
      required: true,
    },
    endTime: Date,
    totalMarksObtained: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["in-progress", "completed", "abandoned"],
      default: "in-progress",
    },
    timeSpent: Number, // in minutes
    isPassed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

// Compound index to track attempts per student per quiz
quizAttemptSchema.index({ student: 1, quiz: 1 })

const QuizAttempt = mongoose.model("QuizAttempt", quizAttemptSchema)
export default QuizAttempt

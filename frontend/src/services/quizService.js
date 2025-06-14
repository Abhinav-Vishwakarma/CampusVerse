// src/services/quizService.js
import axiosInstance from './axiosInstance';

const QUIZ_BASE_URL = '/quizzes';
const QUIZ_QUESTION_URL = '/quizzes/questions';
const QUIZ_ATTEMPT_URL = '/quizzes/attempts';

export const quizService = {
    /**
     * Create a new quiz question (Faculty and Admin).
     * POST /api/quizzes/questions
     * @param {object} questionData - Data for the new question.
     */
    createQuizQuestion: async (questionData) => {
        try {
            const response = await axiosInstance.post(QUIZ_QUESTION_URL, questionData);
            return response.data;
        } catch (error) {
            console.error('Error creating quiz question:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create quiz question.');
        }
    },

    /**
     * Get all quiz questions (Faculty and Admin).
     * GET /api/quizzes/questions
     */
    getAllQuizQuestions: async () => {
        try {
            const response = await axiosInstance.get(QUIZ_QUESTION_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching all quiz questions:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch quiz questions.');
        }
    },

    /**
     * Create a new quiz (Faculty and Admin).
     * POST /api/quizzes
     * @param {object} quizData - Data for the new quiz.
     */
    createQuiz: async (quizData) => {
        try {
            const response = await axiosInstance.post(QUIZ_BASE_URL, quizData);
            return response.data;
        } catch (error) {
            console.error('Error creating quiz:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to create quiz.');
        }
    },

    /**
     * Get all quiz attempts for a specific quiz (Faculty and Admin).
     * GET /api/quizzes/:id/attempts
     * @param {string} quizId - The ID of the quiz.
     */
    getQuizAttempts: async (quizId) => {
        try {
            const response = await axiosInstance.get(`${QUIZ_BASE_URL}/${quizId}/attempts`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching quiz attempts for quiz ${quizId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch quiz attempts for quiz ${quizId}.`);
        }
    },

    /**
     * Evaluate a specific quiz attempt (Faculty and Admin).
     * PUT /api/quizzes/attempts/:attemptId/evaluate
     * @param {string} attemptId - The ID of the quiz attempt.
     * @param {object} evaluationData - Data for evaluation (e.g., marks).
     */
    evaluateQuizAttempt: async (attemptId, evaluationData) => {
        try {
            const response = await axiosInstance.put(`${QUIZ_ATTEMPT_URL}/${attemptId}/evaluate`, evaluationData);
            return response.data;
        } catch (error) {
            console.error(`Error evaluating quiz attempt ${attemptId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to evaluate quiz attempt ${attemptId}.`);
        }
    },

    /**
     * Verify quiz code (Student only).
     * POST /api/quizzes/verify-code
     * @param {object} codeData - Data containing the quiz code.
     */
    verifyQuizCode: async (codeData) => {
        try {
            const response = await axiosInstance.post(`${QUIZ_BASE_URL}/verify-code`, codeData);
            return response.data;
        } catch (error) {
            console.error('Error verifying quiz code:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to verify quiz code.');
        }
    },

    /**
     * Start a new quiz attempt (Student only).
     * POST /api/quizzes/:id/attempt
     * @param {string} quizId - The ID of the quiz to attempt.
     */
    startQuizAttempt: async (quizId) => {
        try {
            const response = await axiosInstance.post(`${QUIZ_BASE_URL}/${quizId}/attempt`);
            return response.data; // Should return attempt ID and quiz questions
        } catch (error) {
            console.error(`Error starting quiz attempt for quiz ${quizId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to start quiz attempt for quiz ${quizId}.`);
        }
    },

    /**
     * Submit/update quiz attempt answers (Student only).
     * PUT /api/quizzes/:id/attempt/:attemptId
     * @param {string} quizId - The ID of the quiz.
     * @param {string} attemptId - The ID of the attempt.
     * @param {object} attemptData - Data containing quiz answers.
     */
    submitQuizAttempt: async (quizId, attemptId, attemptData) => {
        try {
            const response = await axiosInstance.put(`${QUIZ_BASE_URL}/${quizId}/attempt/${attemptId}`, attemptData);
            return response.data;
        } catch (error) {
            console.error(`Error submitting quiz attempt ${attemptId} for quiz ${quizId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to submit quiz attempt ${attemptId}.`);
        }
    },

    /**
     * Get all quiz attempts for the current student.
     * GET /api/quizzes/student/attempts
     */
    getStudentQuizAttempts: async () => {
        try {
            const response = await axiosInstance.get(`${QUIZ_BASE_URL}/student/attempts`);
            return response.data;
        } catch (error) {
            console.error('Error fetching student quiz attempts:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch student quiz attempts.');
        }
    },

    /**
     * Get all quizzes (accessible to all authenticated users).
     * GET /api/quizzes
     */
    getAllQuizzes: async () => {
        try {
            const response = await axiosInstance.get(QUIZ_BASE_URL);
            return response.data;
        } catch (error) {
            console.error('Error fetching all quizzes:', error.response?.data || error.message);
            throw error.response?.data || new Error('Failed to fetch all quizzes.');
        }
    },

    /**
     * Get a specific quiz by ID.
     * GET /api/quizzes/:id
     * @param {string} quizId - The ID of the quiz.
     */
    getQuizById: async (quizId) => {
        try {
            const response = await axiosInstance.get(`${QUIZ_BASE_URL}/${quizId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching quiz ${quizId}:`, error.response?.data || error.message);
            throw error.response?.data || new Error(`Failed to fetch quiz ${quizId}.`);
        }
    },
};
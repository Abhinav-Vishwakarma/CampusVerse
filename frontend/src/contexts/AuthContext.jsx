"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"
import axios from "axios"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  // Set up axios interceptor for token
  useEffect(() => {
    const token = localStorage.getItem("campusverse_token")
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    }

    // Add response interceptor for 401 errors
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem("campusverse_token")
          setUser(null)
          delete axios.defaults.headers.common["Authorization"]
        }
        return Promise.reject(error)
      }
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  // Authentication check on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("campusverse_token")
      if (!token) {
        setLoading(false)
        setInitialized(true)
        return
      }

      try {
        const response = await authAPI.getProfile()
        if (response?.data) {
          setUser(response.data)
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        localStorage.removeItem("campusverse_token")
        delete axios.defaults.headers.common["Authorization"]
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    if (!initialized) {
      initAuth()
    }
  }, [initialized])

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        return { success: false, error: "Email and password are required" }
      }

      const response = await authAPI.login(email, password)

      if (response?.data?.token && response?.data?.user) {
        localStorage.setItem("campusverse_token", response.data.token)
        axios.defaults.headers.common["Authorization"] = `Bearer ${response.data.token}`
        setUser(response.data.user)
        return { success: true, user: response.data.user }
      }

      return { success: false, error: "Invalid response from server" }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Login failed. Please try again.",
      }
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("campusverse_token")
      delete axios.defaults.headers.common["Authorization"]
      setUser(null)
    }
  }

  const register = async (userData) => {
    try {
      if (!userData?.email || !userData?.password || !userData?.name) {
        return { success: false, error: "Name, email and password are required" }
      }

      const response = await authAPI.register(userData)

      if (response?.data?.user) {
        // Don't auto-login after registration, redirect to login
        return { success: true, user: response.data.user }
      } else {
        return { success: false, error: "Registration failed. Please try again." }
      }
    } catch (error) {
      console.error("Registration error:", error)
      return {
        success: false,
        error: error.message || "Registration failed. Please try again.",
      }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      if (!profileData) {
        throw new Error("Profile data is required")
      }

      const response = await authAPI.updateProfile(profileData)

      if (response?.data) {
        setUser(response.data)
        return { success: true, user: response.data }
      } else {
        throw new Error("Failed to update profile")
      }
    } catch (error) {
      console.error("Update profile error:", error)
      throw new Error(error.message || "Failed to update profile")
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    updateProfile,
    loading,
    initialized,
  }

  if (!initialized) {
    return null // or a loading spinner
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

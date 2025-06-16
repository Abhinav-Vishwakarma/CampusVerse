"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"

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

  useEffect(() => {
    const token = localStorage.getItem("campusverse_token")
    if (token) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await authAPI.getProfile()
      if (response?.data) {
        setUser(response.data)
      } else {
        // Handle null/undefined response
        localStorage.removeItem("campusverse_token")
        setUser(null)
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      localStorage.removeItem("campusverse_token")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        return { success: false, error: "Email and password are required" }
      }

      const response = await authAPI.login(email, password)

      if (response?.data?.token && response?.data?.user) {
        localStorage.setItem("campusverse_token", response.data.token)
        setUser(response.data.user)
        return { success: true, user: response.data.user }
      } else {
        return { success: false, error: "Invalid response from server" }
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error.message || "Login failed. Please try again.",
      }
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

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      localStorage.removeItem("campusverse_token")
      setUser(null)
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
    fetchProfile,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

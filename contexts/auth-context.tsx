"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type User, type LoginResponse, type ApiUser, type UserRole } from "@/lib/auth"

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session and token
    const storedUser = localStorage.getItem("amaze_user")
    const storedToken = localStorage.getItem("amaze_token")
    
    if (storedUser && storedToken) {
      // Check if token is still valid (basic expiration check)
      try {
        const tokenParts = storedToken.split('.')
        const payload = JSON.parse(atob(tokenParts[1])) as ApiUser
        
        if (payload.exp * 1000 > Date.now()) {
          setUser(JSON.parse(storedUser))
        } else {
          // Token expired, clear storage
          localStorage.removeItem("amaze_user")
          localStorage.removeItem("amaze_token")
        }
      } catch (error) {
        // Invalid token, clear storage
        localStorage.removeItem("amaze_user")
        localStorage.removeItem("amaze_token")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        return false
      }

      const data: LoginResponse = await response.json()
      
      // Store the token
      localStorage.setItem("amaze_token", data.access_token)
      
      // Decode the JWT token to get user info (basic decode without verification for now)
      const tokenParts = data.access_token.split('.')
      const payload = JSON.parse(atob(tokenParts[1])) as ApiUser
      
      // Create user object from token payload
      const user: User = {
        id: payload.sub,
        username,
        role: payload.role as UserRole,
        name: username, // We'll use username as name for now
        email: `${username}@amazeframing.com`, // Default email format
      }

      setUser(user)
      localStorage.setItem("amaze_user", JSON.stringify(user))
      return true
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("amaze_user")
    localStorage.removeItem("amaze_token")
  }

  return <AuthContext.Provider value={{ user, login, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

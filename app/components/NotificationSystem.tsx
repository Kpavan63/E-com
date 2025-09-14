'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearAll: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    }

    setNotifications(prev => [...prev, newNotification])

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAll
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  )
}

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

interface NotificationItemProps {
  notification: Notification
  onRemove: () => void
}

const NotificationItem = ({ notification, onRemove }: NotificationItemProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleRemove = () => {
    setIsRemoving(true)
    setTimeout(onRemove, 300) // Wait for exit animation
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/30 text-green-100'
      case 'error':
        return 'bg-red-500/20 border-red-500/30 text-red-100'
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-100'
      case 'info':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-100'
      default:
        return 'bg-gray-500/20 border-gray-500/30 text-gray-100'
    }
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible && !isRemoving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
        ${getColors()}
        backdrop-blur-lg border rounded-none p-4 shadow-2xl
        hover:scale-105 cursor-pointer group
      `}
      onClick={handleRemove}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold truncate">
              {notification.title}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleRemove()
              }}
              className="flex-shrink-0 ml-2 p-1 rounded-none hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <p className="text-sm opacity-90 mt-1 leading-relaxed">
            {notification.message}
          </p>
          
          {notification.action && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                notification.action!.onClick()
                handleRemove()
              }}
              className="mt-2 text-xs font-medium underline hover:no-underline transition-all"
            >
              {notification.action.label}
            </button>
          )}
        </div>
      </div>
      
      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full overflow-hidden">
          <div 
            className="h-full bg-white/40 animate-shrink-width"
            style={{ 
              animationDuration: `${notification.duration}ms`,
              animationTimingFunction: 'linear'
            }}
          />
        </div>
      )}
    </div>
  )
}

// Utility functions for easy use - use these within components
export const createNotificationHelpers = (addNotification: (notification: Omit<Notification, 'id'>) => void) => ({
  showSuccess: (title: string, message: string, duration?: number) => {
    addNotification({ type: 'success', title, message, duration })
  },
  showError: (title: string, message: string, duration?: number) => {
    addNotification({ type: 'error', title, message, duration })
  },
  showWarning: (title: string, message: string, duration?: number) => {
    addNotification({ type: 'warning', title, message, duration })
  },
  showInfo: (title: string, message: string, duration?: number) => {
    addNotification({ type: 'info', title, message, duration })
  }
})
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { useNotification } from "../../contexts/NotificationContext"
import { eventsAPI } from "../../services/api"
import { Calendar, MapPin, Users, Clock, Plus, ExternalLink } from "lucide-react"

const EventsPage = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useNotification()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getEvents()
      setEvents(response.data)
    } catch (error) {
      showError("Failed to fetch events")
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId) => {
    try {
      await eventsAPI.registerForEvent(eventId)
      showSuccess("Successfully registered for event!")
      fetchEvents()
    } catch (error) {
      showError("Failed to register for event")
    }
  }

  const getEventStatus = (event) => {
    const now = new Date()
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)

    if (now < startDate) return "upcoming"
    if (now >= startDate && now <= endDate) return "ongoing"
    return "completed"
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "completed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
    }
  }

  const filteredEvents = events.filter((event) => {
    if (filter === "all") return true
    return getEventStatus(event) === filter
  })

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Events</h1>
          <p className="text-gray-600 dark:text-gray-400">Discover and register for campus events</p>
        </div>
        {(user?.role === "admin" || user?.role === "faculty") && (
          <button className="btn-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex space-x-4">
          {["all", "upcoming", "ongoing", "completed"].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === filterOption
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              {filterOption} (
              {events.filter((e) => filterOption === "all" || getEventStatus(e) === filterOption).length})
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <div key={event._id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className={`text-xs px-2 py-1 rounded capitalize ${getStatusColor(getEventStatus(event))}`}>
                {getEventStatus(event)}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{event.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{event.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Calendar className="w-4 h-4 mr-2" />
                <span>
                  {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-2" />
                <span>{new Date(event.startDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{event.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4 mr-2" />
                <span>{event.registrations?.length || 0} registered</span>
              </div>
            </div>

            {/* Event Type */}
            <div className="mb-4">
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                {event.eventType || "General"}
              </span>
            </div>

            <div className="flex space-x-2">
              {user?.role === "student" ? (
                <>
                  <button
                    onClick={() => handleRegister(event._id)}
                    disabled={
                      getEventStatus(event) === "completed" ||
                      event.registrations?.some((reg) => reg.student === user._id)
                    }
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {event.registrations?.some((reg) => reg.student === user._id)
                      ? "Registered"
                      : getEventStatus(event) === "completed"
                        ? "Completed"
                        : "Register"}
                  </button>
                  <button onClick={() => setSelectedEvent(event)} className="btn-secondary">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-secondary flex-1">View Registrations</button>
                  <button className="btn-primary flex-1">Edit</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === "all" ? "No events have been created yet." : `No ${filter} events at the moment.`}
          </p>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedEvent.title}</h3>
                <span
                  className={`inline-block mt-1 text-xs px-2 py-1 rounded capitalize ${getStatusColor(getEventStatus(selectedEvent))}`}
                >
                  {getEventStatus(selectedEvent)}
                </span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Start Date & Time</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(selectedEvent.startDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">End Date & Time</h4>
                  <p className="text-gray-600 dark:text-gray-400">{new Date(selectedEvent.endDate).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Location</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedEvent.location}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Registrations</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedEvent.registrations?.length || 0} people</p>
                </div>
              </div>

              {selectedEvent.organizer && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">Organizer</h4>
                  <p className="text-gray-600 dark:text-gray-400">{selectedEvent.organizer}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button onClick={() => setSelectedEvent(null)} className="btn-secondary flex-1">
                  Close
                </button>
                {user?.role === "student" && (
                  <button
                    onClick={() => {
                      handleRegister(selectedEvent._id)
                      setSelectedEvent(null)
                    }}
                    disabled={
                      getEventStatus(selectedEvent) === "completed" ||
                      selectedEvent.registrations?.some((reg) => reg.student === user._id)
                    }
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedEvent.registrations?.some((reg) => reg.student === user._id)
                      ? "Already Registered"
                      : getEventStatus(selectedEvent) === "completed"
                        ? "Event Completed"
                        : "Register Now"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventsPage

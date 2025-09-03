"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Eye, Ban, CheckCircle, X, Flag, MessageSquare, User, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { PERMISSIONS } from "@/types/auth"
import type { ContentReport } from "@/types/admin"

// Mock data
const mockReports: ContentReport[] = [
  {
    id: "1",
    type: "post",
    contentId: "post-123",
    contentPreview: "This is inappropriate content that violates our community guidelines...",
    reportedBy: {
      id: "user1",
      name: "Alice Johnson",
      avatar: "/professional-woman-avatar.png",
    },
    reportedUser: {
      id: "user2",
      name: "Bob Smith",
      avatar: "/professional-man-avatar.png",
    },
    reason: "inappropriate",
    description: "This post contains offensive language and inappropriate images.",
    status: "pending",
    priority: "high",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
  },
  {
    id: "2",
    type: "comment",
    contentId: "comment-456",
    contentPreview: "Spam comment with multiple links to suspicious websites...",
    reportedBy: {
      id: "user3",
      name: "Carol Davis",
      avatar: "/diverse-user-avatars.png",
    },
    reportedUser: {
      id: "user4",
      name: "David Wilson",
      avatar: "/professional-man-avatar.png",
    },
    reason: "spam",
    status: "reviewed",
    priority: "medium",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
    reviewedBy: { id: "admin1", name: "Admin User" },
    action: "content_removed",
  },
  {
    id: "3",
    type: "profile",
    contentId: "profile-789",
    contentPreview: "Fake profile impersonating a celebrity...",
    reportedBy: {
      id: "user5",
      name: "Eve Brown",
      avatar: "/professional-woman-avatar.png",
    },
    reportedUser: {
      id: "user6",
      name: "Fake Celebrity",
      avatar: "/diverse-user-avatars.png",
    },
    reason: "fake",
    description: "This profile is impersonating a well-known public figure.",
    status: "pending",
    priority: "critical",
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
  },
]

export function ContentModeration() {
  const { hasPermission } = useAuth()
  const [reports, setReports] = useState<ContentReport[]>(mockReports)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [selectedReport, setSelectedReport] = useState<ContentReport | null>(null)
  const [reviewNote, setReviewNote] = useState("")

  const canModerate = hasPermission(PERMISSIONS.MODERATE_CONTENT)

  const filteredReports = reports.filter((report) => {
    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    const matchesPriority = priorityFilter === "all" || report.priority === priorityFilter
    return matchesStatus && matchesPriority
  })

  const handleReportAction = (reportId: string, action: string) => {
    setReports(
      reports.map((report) =>
        report.id === reportId
          ? {
              ...report,
              status: "reviewed" as const,
              reviewedAt: new Date(),
              reviewedBy: { id: "current-user", name: "Current User" },
              action: action as any,
            }
          : report,
      ),
    )
    setSelectedReport(null)
    setReviewNote("")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "post":
        return <FileText className="h-4 w-4" />
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "profile":
        return <User className="h-4 w-4" />
      default:
        return <Flag className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500 text-white"
      case "high":
        return "bg-orange-500 text-white"
      case "medium":
        return "bg-yellow-500 text-white"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-500 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "reviewed":
        return "bg-green-100 text-green-800"
      case "resolved":
        return "bg-blue-100 text-blue-800"
      case "dismissed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (!canModerate) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">You don't have permission to moderate content.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter((r) => r.status === "pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Priority</CardTitle>
            <Flag className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.filter((r) => r.priority === "critical").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviewed Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reports.filter((r) => r.reviewedAt && r.reviewedAt.toDateString() === new Date().toDateString()).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Content Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content Reports</CardTitle>
            <div className="flex space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(report.type)}
                      <Badge className={getPriorityColor(report.priority)}>{report.priority}</Badge>
                      <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">{formatTimeAgo(report.createdAt)}</div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Reported Content</h4>
                    <p className="text-sm text-muted-foreground mb-2">{report.contentPreview}</p>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={report.reportedUser.avatar || "/placeholder.svg"}
                          alt={report.reportedUser.name}
                        />
                        <AvatarFallback>{report.reportedUser.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">by {report.reportedUser.name}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Report Details</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      <strong>Reason:</strong> {report.reason}
                    </p>
                    {report.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Description:</strong> {report.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={report.reportedBy.avatar || "/placeholder.svg"}
                          alt={report.reportedBy.name}
                        />
                        <AvatarFallback>{report.reportedBy.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">reported by {report.reportedBy.name}</span>
                    </div>
                  </div>
                </div>

                {report.status === "pending" && (
                  <div className="mt-4 flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => setSelectedReport(report)}>
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Review Report</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Content Preview:</p>
                            <p className="text-sm text-muted-foreground p-3 bg-muted rounded">
                              {selectedReport?.contentPreview}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Review Notes (Optional)</label>
                            <Textarea
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              placeholder="Add any notes about your decision..."
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => handleReportAction(report.id, "none")}
                              className="w-full"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Dismiss
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleReportAction(report.id, "warning")}
                              className="w-full"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Warning
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleReportAction(report.id, "content_removed")}
                              className="w-full"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Remove Content
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleReportAction(report.id, "user_suspended")}
                              className="w-full"
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend User
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {report.status === "reviewed" && report.reviewedBy && (
                  <div className="mt-4 p-3 bg-muted rounded text-sm">
                    <p>
                      <strong>Reviewed by:</strong> {report.reviewedBy.name} on{" "}
                      {report.reviewedAt?.toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Action taken:</strong> {report.action?.replace("_", " ")}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

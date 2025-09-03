"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ChatErrorBoundaryProps {
  children: React.ReactNode
}

interface ChatErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ChatErrorBoundary extends React.Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  constructor(props: ChatErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chat Error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="h-full flex items-center justify-center">
          <CardContent className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
            <div>
              <CardTitle className="text-lg mb-2">Chat Error</CardTitle>
              <p className="text-muted-foreground mb-4">
                Something went wrong with the chat component.
              </p>
              {this.state.error && (
                <details className="text-sm text-left bg-muted p-2 rounded mb-4">
                  <summary className="cursor-pointer">Error Details</summary>
                  <pre className="mt-2 text-xs overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
              <Button onClick={this.handleRetry} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
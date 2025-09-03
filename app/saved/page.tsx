"use client"

import { SavedPosts } from "@/components/posts/saved-posts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SavedPostsPage() {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <SavedPosts />
        </CardContent>
      </Card>
    </div>
  )
}
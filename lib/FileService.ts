class FileService {
  static async uploadPostMedia(files: File[], userId: string, idToken: string): Promise<string[]> {
    const mediaUrls: string[] = [];

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'post'); // Assuming 'post' type for post media
        formData.append('targetId', userId); // Use userId as targetId for posts

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to upload file via API');
        }

        const result = await response.json();
        if (result && result.url) {
          mediaUrls.push(result.url);
        } else {
          console.error('API upload failed for file:', file.name, 'No URL returned.');
          throw new Error('Failed to upload file, no URL returned.');
        }
      } catch (error) {
        console.error('Error uploading file via API:', file.name, error);
        // Continue to next file or re-throw based on desired error handling
        throw error; // Re-throw to indicate failure for the current file
      }
    }
    return mediaUrls;
  }

  static async uploadFile(file: File, type: 'post' | 'profile' | 'chat' | 'story' | 'voice', userId: string, idToken: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('targetId', userId); // Use userId as targetId for single file uploads

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload file via API');
      }

      const result = await response.json();
      if (result && result.url) {
        return result.url;
      } else {
        console.error('API upload failed for file:', file.name, 'No URL returned.');
        throw new Error('Failed to upload file, no URL returned.');
      }
    } catch (error) {
      console.error('Error uploading single file via API:', file.name, error);
      throw error;
    }
  }
}

export default FileService;
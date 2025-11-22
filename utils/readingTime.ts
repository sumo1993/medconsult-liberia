// Calculate reading time for content
// Average reading speed: 200-250 words per minute
// We'll use 200 for a conservative estimate

export function calculateReadingTime(content: string): number {
  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Count words (split by whitespace and filter empty strings)
  const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Calculate reading time in minutes (200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);
  
  // Minimum 1 minute
  return Math.max(1, readingTime);
}

export function formatReadingTime(minutes: number): string {
  if (minutes === 1) {
    return '1 min read';
  }
  return `${minutes} min read`;
}

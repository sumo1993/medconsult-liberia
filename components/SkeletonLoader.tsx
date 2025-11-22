export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-5 w-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
          <div className="flex items-center space-x-4">
            <div className="h-6 w-24 bg-gray-200 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 rounded"></div>
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex space-x-2 ml-4">
          <div className="h-9 w-9 bg-gray-200 rounded-md"></div>
          <div className="h-9 w-9 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonPostList({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonPostDetail() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-10 mb-8">
        <div className="text-center mb-6">
          <div className="h-6 w-32 bg-gray-200 rounded-full mx-auto"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto mb-6"></div>
        <div className="h-6 bg-gray-200 rounded w-full max-w-3xl mx-auto mb-2"></div>
        <div className="h-6 bg-gray-200 rounded w-5/6 max-w-3xl mx-auto mb-8"></div>
        
        <div className="flex justify-center gap-6 border-t border-gray-200 pt-6 mb-6">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-4 w-24 bg-gray-200 rounded"></div>
          <div className="h-4 w-28 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex space-x-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-200">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';

// Base skeleton component
export const Skeleton = ({ className = '', width = 'w-full', height = 'h-4' }: { 
  className?: string; 
  width?: string; 
  height?: string; 
}) => (
  <div className={`${width} ${height} bg-gray-200 rounded animate-pulse ${className}`} />
);

// Card skeleton for assignment cards
export const AssignmentCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <Skeleton width="w-3/4" height="h-6" className="mb-2" />
        <Skeleton width="w-1/2" height="h-4" className="mb-2" />
        <Skeleton width="w-full" height="h-4" />
      </div>
      <Skeleton width="w-24" height="h-8" className="rounded-full" />
    </div>
    <div className="mb-4 p-3 bg-gray-100 rounded-lg">
      <Skeleton width="w-1/3" height="h-4" className="mb-2" />
      <Skeleton width="w-1/4" height="h-6" />
    </div>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Skeleton width="w-32" height="h-4" />
        <Skeleton width="w-24" height="h-4" />
      </div>
      <Skeleton width="w-20" height="h-4" />
    </div>
  </div>
);

// Stats card skeleton for dashboard
export const StatsCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <Skeleton width="w-1/2" height="h-4" className="mb-2" />
    <Skeleton width="w-1/3" height="h-8" />
  </div>
);

// Message skeleton for chat
export const MessageSkeleton = () => (
  <div className="flex items-start space-x-3 mb-4 animate-pulse">
    <Skeleton width="w-10" height="h-10" className="rounded-full flex-shrink-0" />
    <div className="flex-1">
      <Skeleton width="w-1/4" height="h-4" className="mb-2" />
      <Skeleton width="w-3/4" height="h-16" className="rounded-lg" />
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4"><Skeleton width="w-full" height="h-4" /></td>
    <td className="px-6 py-4"><Skeleton width="w-full" height="h-4" /></td>
    <td className="px-6 py-4"><Skeleton width="w-full" height="h-4" /></td>
    <td className="px-6 py-4"><Skeleton width="w-24" height="h-8" className="rounded-full" /></td>
  </tr>
);

// Profile skeleton
export const ProfileSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 animate-pulse">
    <div className="flex items-center space-x-4 mb-6">
      <Skeleton width="w-20" height="h-20" className="rounded-full" />
      <div className="flex-1">
        <Skeleton width="w-1/3" height="h-6" className="mb-2" />
        <Skeleton width="w-1/4" height="h-4" />
      </div>
    </div>
    <div className="space-y-4">
      <div>
        <Skeleton width="w-1/4" height="h-4" className="mb-2" />
        <Skeleton width="w-full" height="h-10" className="rounded" />
      </div>
      <div>
        <Skeleton width="w-1/4" height="h-4" className="mb-2" />
        <Skeleton width="w-full" height="h-10" className="rounded" />
      </div>
      <div>
        <Skeleton width="w-1/4" height="h-4" className="mb-2" />
        <Skeleton width="w-full" height="h-24" className="rounded" />
      </div>
    </div>
  </div>
);

// List skeleton - generic for any list
export const ListSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <AssignmentCardSkeleton key={i} />
    ))}
  </div>
);

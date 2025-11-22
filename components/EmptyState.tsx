import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-lg shadow">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-gray-100 p-6">
            <Icon size={48} className="text-gray-400" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>

        {/* Description */}
        <p className="text-gray-600 mb-8 leading-relaxed">{description}</p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-sm"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              onClick={onSecondaryAction}
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Specific empty states for common scenarios
export const NoAssignmentsEmpty: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => {
  const FileTextIcon = require('lucide-react').FileText;
  return (
    <EmptyState
      icon={FileTextIcon}
      title="No Assignments Yet"
      description="You haven't submitted any assignment requests yet. Get started by submitting your first request and connect with our expert consultants."
      actionLabel="Submit First Request"
      onAction={onCreateNew}
    />
  );
};

export const NoFilteredResultsEmpty: React.FC<{ filterName: string; onClearFilter: () => void }> = ({ 
  filterName, 
  onClearFilter 
}) => {
  const SearchIcon = require('lucide-react').Search;
  return (
    <EmptyState
      icon={SearchIcon}
      title={`No ${filterName} Assignments`}
      description={`You don't have any assignments in the "${filterName}" category. Try viewing all assignments or check other categories.`}
      actionLabel="View All Assignments"
      onAction={onClearFilter}
    />
  );
};

export const NoMessagesEmpty: React.FC = () => {
  const MessageSquareIcon = require('lucide-react').MessageSquare;
  return (
    <EmptyState
      icon={MessageSquareIcon}
      title="No Messages Yet"
      description="Start the conversation! Send a message to discuss your assignment details, ask questions, or provide updates."
      actionLabel="Send First Message"
    />
  );
};

export const NoResearchEmpty: React.FC<{ onBrowse?: () => void }> = ({ onBrowse }) => {
  const BookOpenIcon = require('lucide-react').BookOpen;
  return (
    <EmptyState
      icon={BookOpenIcon}
      title="No Research Available"
      description="There are no published research articles at the moment. Check back later for new medical research and educational content."
      actionLabel={onBrowse ? "Browse Categories" : undefined}
      onAction={onBrowse}
    />
  );
};

export const NoNotificationsEmpty: React.FC = () => {
  const BellIcon = require('lucide-react').Bell;
  return (
    <EmptyState
      icon={BellIcon}
      title="All Caught Up!"
      description="You don't have any new notifications. We'll notify you when there are updates on your assignments or messages."
    />
  );
};

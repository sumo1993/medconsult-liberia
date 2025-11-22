import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
  showCount?: boolean;
  count?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 20,
  showCount = false,
  count = 0,
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => handleClick(value)}
          onMouseEnter={() => !readonly && setHoverRating(value)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          aria-label={`${value} star${value > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            className={`${
              value <= displayRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-200 text-gray-300'
            } transition-colors`}
          />
        </button>
      ))}
      {showCount && count > 0 && (
        <span className="text-sm text-gray-600 ml-2">
          ({count} {count === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
};

interface RatingFormProps {
  assignmentId: number;
  onSubmit: (rating: number, review: string) => Promise<void>;
  onCancel?: () => void;
  existingRating?: number;
  existingReview?: string;
}

export const RatingForm: React.FC<RatingFormProps> = ({
  assignmentId,
  onSubmit,
  onCancel,
  existingRating = 0,
  existingReview = '',
}) => {
  const [rating, setRating] = useState(existingRating);
  const [review, setReview] = useState(existingReview);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await onSubmit(rating, review);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rate your experience
        </label>
        <RatingStars rating={rating} onRatingChange={setRating} size={32} />
        {rating > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            {rating === 1 && '⭐ Poor'}
            {rating === 2 && '⭐⭐ Fair'}
            {rating === 3 && '⭐⭐⭐ Good'}
            {rating === 4 && '⭐⭐⭐⭐ Very Good'}
            {rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="review" className="block text-sm font-medium text-gray-700 mb-2">
          Write a review (optional)
        </label>
        <textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience with this consultant..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <div className="flex space-x-3">
        <button
          type="submit"
          disabled={rating === 0 || submitting}
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          {submitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

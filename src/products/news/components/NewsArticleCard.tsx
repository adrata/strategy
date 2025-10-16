"use client";

import React from 'react';
import { NewsArticle, NEWS_CATEGORIES } from '../types';
import { useNews } from '../hooks/useNews';

interface NewsArticleCardProps {
  article: NewsArticle;
  onClick?: (article: NewsArticle) => void;
  showActions?: boolean;
}

export function NewsArticleCard({ article, onClick, showActions = true }: NewsArticleCardProps) {
  const { markAsRead, toggleFavorite } = useNews();

  const categoryConfig = NEWS_CATEGORIES.find(cat => cat.id === article.category) || NEWS_CATEGORIES[3];

  const handleClick = () => {
    if (onClick) {
      onClick(article);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await markAsRead(article.id, !article.isRead);
  };

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(article.id, !article.isFavorite);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getContextDisplay = () => {
    if (article.relatedPerson) {
      const companyName = article.relatedPerson.company?.name;
      return companyName 
        ? `${article.relatedPerson.fullName} · ${companyName}`
        : article.relatedPerson.fullName;
    }
    
    if (article.relatedCompany) {
      return article.relatedCompany.name;
    }
    
    return null;
  };

  return (
    <div 
      className={`bg-[var(--background)] border border-[var(--border)] rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group ${
        !article.isRead ? 'ring-2 ring-blue-200' : ''
      }`}
      onClick={handleClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {article.title}
          </h3>
          
          {/* Category and Context */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${categoryConfig.bgColor} ${categoryConfig.color} border ${categoryConfig.borderColor}`}>
              {categoryConfig.label}
            </span>
            
            {getContextDisplay() && (
              <span className="text-sm text-[var(--muted)] font-medium">
                {getContextDisplay()}
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                article.isFavorite 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-[var(--muted)] hover:text-yellow-500'
              }`}
              title={article.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg className="w-4 h-4" fill={article.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            
            <button
              onClick={handleMarkAsRead}
              className={`p-2 rounded-lg transition-colors ${
                article.isRead 
                  ? 'text-[var(--muted)] hover:text-blue-500' 
                  : 'text-blue-500 hover:text-blue-600'
              }`}
              title={article.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {article.isRead ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Description */}
      {article.description && (
        <p className="text-[var(--muted)] text-sm mb-4 line-clamp-3">
          {article.description}
        </p>
      )}

      {/* Image */}
      {article.imageUrl && (
        <div className="mb-4">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-48 object-cover rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
        <div className="flex items-center gap-4">
          <span className="font-medium">{article.source}</span>
          {article.author && (
            <span>by {article.author}</span>
          )}
          <span>{formatDate(article.publishedAt)}</span>
        </div>
        
        {/* Relevance Score */}
        {article.relevanceScore > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium">{Math.round(article.relevanceScore)}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {article.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="px-2 py-1 text-xs bg-[var(--hover)] text-[var(--muted)] rounded-md"
            >
              {tag}
            </span>
          ))}
          {article.tags.length > 3 && (
            <span className="px-2 py-1 text-xs bg-[var(--hover)] text-[var(--muted)] rounded-md">
              +{article.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

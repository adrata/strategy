"use client";

import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { useNews } from '../hooks/useNews';
import { useVoiceControls } from '@/platform/hooks/useVoiceControls';

interface NewsArticleDetailProps {
  article: NewsArticle;
  onBack: () => void;
}

export function NewsArticleDetail({ article, onBack }: NewsArticleDetailProps) {
  const { markAsRead, toggleFavorite } = useNews();
  const { speak, isVoiceActive } = useVoiceControls();
  const [isReading, setIsReading] = useState(false);

  const handleMarkAsRead = async () => {
    await markAsRead(article.id, !article.isRead);
  };

  const handleToggleFavorite = async () => {
    await toggleFavorite(article.id, !article.isFavorite);
  };

  const handleReadAloud = async () => {
    if (isReading) return;
    
    setIsReading(true);
    try {
      const textToRead = `${article.title}. ${article.description || ''}. ${article.content || ''}`;
      await speak(textToRead);
    } catch (error) {
      console.error('Error reading article:', error);
    } finally {
      setIsReading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to News
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`p-2 rounded-lg transition-colors ${
                article.isFavorite 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-muted hover:text-yellow-500'
              }`}
              title={article.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg className="w-5 h-5" fill={article.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            
            <button
              onClick={handleMarkAsRead}
              className={`p-2 rounded-lg transition-colors ${
                article.isRead 
                  ? 'text-muted hover:text-blue-500' 
                  : 'text-blue-500 hover:text-blue-600'
              }`}
              title={article.isRead ? 'Mark as unread' : 'Mark as read'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {article.isRead ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
            </button>
            
            {isVoiceActive && (
              <button
                onClick={handleReadAloud}
                disabled={isReading}
                className="p-2 rounded-lg text-muted hover:text-blue-500 transition-colors disabled:opacity-50"
                title="Read article aloud"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343a1 1 0 000 1.414L8.172 9.586a1 1 0 01-1.414 1.414L4.93 8.757a1 1 0 010-1.414z" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-foreground mb-4 leading-tight">
          {article.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-muted">
          <span className="font-medium">{article.source}</span>
          {article.author && (
            <span>by {article.author}</span>
          )}
          <span>{formatDate(article.publishedAt)}</span>
          {getContextDisplay() && (
            <span className="font-medium text-foreground">
              {getContextDisplay()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Image */}
        {article.imageUrl && (
          <div className="mb-6">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full max-w-2xl mx-auto rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Description */}
        {article.description && (
          <div className="mb-6">
            <p className="text-lg text-muted leading-relaxed">
              {article.description}
            </p>
          </div>
        )}

        {/* Content */}
        {article.content && (
          <div className="prose prose-gray max-w-none">
            <div className="text-foreground leading-relaxed whitespace-pre-wrap">
              {article.content}
            </div>
          </div>
        )}

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-medium text-muted mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 text-sm bg-hover text-muted rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* External Link */}
        <div className="mt-8 pt-6 border-t border-border">
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Read Full Article</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

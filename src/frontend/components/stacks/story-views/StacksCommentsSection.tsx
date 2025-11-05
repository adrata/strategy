"use client";

import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, PencilIcon, TrashIcon, ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/platform/auth';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  replies?: Comment[];
}

interface StacksCommentsSectionProps {
  storyId: string;
}

export function StacksCommentsSection({ storyId }: StacksCommentsSectionProps) {
  const { user } = useUnifiedAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`/api/v1/stacks/stories/${storyId}/comments`, {
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error('Failed to fetch comments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      fetchComments();
    }
  }, [storyId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/v1/stacks/stories/${storyId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
        // Refresh comments to get nested structure
        const refreshResponse = await fetch(`/api/v1/stacks/stories/${storyId}/comments`, {
          credentials: 'include'
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setComments(refreshData.comments || []);
        }
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await fetch(`/api/v1/stacks/stories/${storyId}/comments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyContent.trim(), parentId })
      });

      if (response.ok) {
        setReplyContent('');
        setReplyingTo(null);
        // Refresh comments
        const refreshResponse = await fetch(`/api/v1/stacks/stories/${storyId}/comments`, {
          credentials: 'include'
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setComments(refreshData.comments || []);
        }
      }
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/v1/stacks/stories/${storyId}/comments?commentId=${commentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() })
      });

      if (response.ok) {
        setEditingId(null);
        setEditContent('');
        // Refresh comments
        const refreshResponse = await fetch(`/api/v1/stacks/stories/${storyId}/comments`, {
          credentials: 'include'
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setComments(refreshData.comments || []);
        }
      }
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/v1/stacks/stories/${storyId}/comments?commentId=${commentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Refresh comments
        const refreshResponse = await fetch(`/api/v1/stacks/stories/${storyId}/comments`, {
          credentials: 'include'
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          setComments(refreshData.comments || []);
        }
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  const isOwnComment = (comment: Comment) => {
    return comment.author.id === user?.id;
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isEditing = editingId === comment.id;
    const isReplying = replyingTo === comment.id;

    return (
      <div key={comment.id} className={isReply ? 'ml-8 mt-3' : 'mb-4'}>
        <div className="bg-panel-background rounded-lg border border-border p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-foreground">
                {comment.author.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{comment.author.name}</div>
                <div className="text-xs text-muted">{formatDate(comment.createdAt)}</div>
              </div>
            </div>
            {isOwnComment(comment) && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingId(comment.id);
                    setEditContent(comment.content);
                  }}
                  className="p-1 text-muted hover:text-foreground transition-colors"
                  title="Edit comment"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="p-1 text-muted hover:text-error-text transition-colors"
                  title="Delete comment"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditComment(comment.id)}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setEditContent('');
                  }}
                  className="px-3 py-1.5 text-sm bg-panel-background border border-border rounded-md hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-foreground whitespace-pre-wrap mb-3">
                {comment.content}
              </div>
              {!isReply && (
                <button
                  onClick={() => setReplyingTo(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
                >
                  <ArrowUturnLeftIcon className="h-3 w-3" />
                  Reply
                </button>
              )}
            </>
          )}

          {isReplying && !isReply && (
            <div className="mt-3 pt-3 border-t border-border">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                  Reply
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-3 py-1.5 text-sm bg-panel-background border border-border rounded-md hover:bg-hover transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Render replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-background rounded-lg border border-border p-6">
        <div className="text-muted">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg border border-border p-6">
      <h3 className="text-sm font-medium text-foreground uppercase tracking-wide border-b border-border pb-2 mb-4 flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        Comments
      </h3>

      {/* Comments List */}
      <div className="space-y-4 mb-6">
        {comments.length === 0 ? (
          <div className="text-muted text-sm py-8 text-center">No comments yet. Be the first to comment!</div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>

      {/* Add New Comment */}
      <form onSubmit={handleSubmitComment} className="border-t border-border pt-4">
        <div className="space-y-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post Comment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}


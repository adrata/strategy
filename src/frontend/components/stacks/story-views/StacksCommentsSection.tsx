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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteComment = (commentId: string) => {
    setDeleteConfirmId(commentId);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/v1/stacks/stories/${storyId}/comments?commentId=${deleteConfirmId}`, {
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
    } finally {
      setIsDeleting(false);
      setDeleteConfirmId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirmId(null);
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
      <div key={comment.id} className={`group ${isReply ? 'ml-12 mt-4' : 'mb-6'}`}>
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-foreground/70">
              {comment.author.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-baseline gap-2 mb-1.5">
              <span className="text-sm font-medium text-foreground">
                {comment.author.name}
              </span>
              <span className="text-xs text-foreground/50">
                {formatDate(comment.createdAt)}
              </span>
              {isOwnComment(comment) && (
                <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}
                    className="p-1.5 text-foreground/40 hover:text-foreground transition-colors"
                    title="Edit comment"
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="p-1.5 text-foreground/40 hover:text-foreground transition-colors"
                    title="Delete comment"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Comment Content */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border/50 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditComment(comment.id)}
                    className="px-3 py-1.5 text-sm font-medium text-background bg-foreground rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditContent('');
                    }}
                    className="px-3 py-1.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed mb-2">
                  {comment.content}
                </p>
                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(comment.id)}
                    className="flex items-center gap-1.5 text-xs font-medium text-foreground/50 hover:text-foreground transition-colors -ml-1"
                  >
                    <ArrowUturnLeftIcon className="h-3.5 w-3.5" />
                    Reply
                  </button>
                )}

                {/* Reply Form */}
                {isReplying && !isReply && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write a reply..."
                      className="w-full px-3 py-2 text-sm border border-border/50 rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 resize-none mb-3"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSubmitReply(comment.id)}
                        className="px-3 py-1.5 text-sm font-medium text-background bg-foreground rounded-lg hover:opacity-90 transition-opacity"
                      >
                        Reply
                      </button>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setReplyContent('');
                        }}
                        className="px-3 py-1.5 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Render replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-4">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-background rounded-lg p-6">
        <div className="text-foreground/40 text-sm">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ChatBubbleLeftRightIcon className="h-4 w-4 text-foreground/60" />
        <h3 className="text-sm font-semibold text-foreground tracking-tight">
          Comments
        </h3>
        {comments.length > 0 && (
          <span className="text-xs text-foreground/40 font-medium">
            {comments.length}
          </span>
        )}
      </div>

      {/* Comments List */}
      <div className="mb-8">
        {comments.length === 0 ? (
          <div className="text-foreground/40 text-sm py-12 text-center">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>

      {/* Add New Comment */}
      <form onSubmit={handleSubmitComment} className="border-t border-border/30 pt-6">
        <div className="space-y-3">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-3 py-2.5 text-sm border border-border/50 rounded-lg bg-background text-foreground placeholder:text-foreground/30 focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:border-foreground/30 resize-none"
            rows={3}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-4 py-2 text-sm font-medium text-background bg-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Post Comment
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]" 
          onClick={handleCancelDelete}
        >
          <div 
            className="bg-background rounded-lg shadow-lg p-6 max-w-sm mx-4 border border-border/30" 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-foreground mb-2">Delete Comment</h3>
            <p className="text-sm text-foreground/60 mb-6">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-background bg-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


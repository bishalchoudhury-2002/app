import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Heart, MessageCircle, Share2, Send, Image as ImageIcon, Video as VideoIcon, Smile, ThumbsUp } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';
import { api, BACKEND_URL } from '../App';
import Layout from './Layout';

export default function Feed({ user, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postFiles, setPostFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/posts/feed');
      setPosts(response.data.posts);
    } catch (error) {
      toast.error('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim() && postFiles.length === 0) {
      toast.error('Please add some content or media');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', postContent);
      formData.append('post_type', 'regular');
      
      postFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('Post created!');
        setPostContent('');
        setPostFiles([]);
        fetchPosts();
      }
    } catch (error) {
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      const formData = new FormData();
      formData.append('reaction_type', reactionType);
      await api.post(`/reactions/${postId}`, formData);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to add reaction');
    }
  };

  const reactionEmojis = {
    like: '👍',
    love: '❤️',
    haha: '😂',
    wow: '😮',
    sad: '😢',
    angry: '😡'
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" data-testid="feed-container">
        {/* Create Post Card */}
        <Card className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="flex items-start space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
              <AvatarFallback>{user.name?.[0]}</AvatarFallback>
            </Avatar>
            <form onSubmit={handleCreatePost} className="flex-1" data-testid="create-post-form">
              <Textarea
                placeholder="What's on your mind?"
                className="mb-4 rounded-xl border-gray-200 focus:border-blue-400 resize-none"
                rows={3}
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                data-testid="post-content-textarea"
              />
              
              {postFiles.length > 0 && (
                <div className="mb-4 flex gap-2 flex-wrap">
                  {Array.from(postFiles).map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="h-24 w-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setPostFiles(Array.from(postFiles).filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  <Button type="button" variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600" onClick={() => document.getElementById('post-file-input').click()} data-testid="add-media-btn">
                    <ImageIcon className="w-5 h-5 mr-2" />
                    Photo
                  </Button>
                  <input
                    id="post-file-input"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={(e) => setPostFiles(Array.from(e.target.files))}
                  />
                </div>
                <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 rounded-xl" data-testid="post-submit-btn">
                  {submitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
            <p className="text-gray-500 text-lg">No posts yet. Start following people to see their posts!</p>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="p-6 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300" data-testid={`post-${post.id}`}>
              {/* Post Header */}
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.user?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${post.user?.name}`} />
                  <AvatarFallback>{post.user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{post.user?.name}</h4>
                  <p className="text-sm text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>

              {/* Post Media */}
              {post.media_urls && post.media_urls.length > 0 && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  {post.media_urls.map((url, index) => (
                    <img
                      key={index}
                      src={`${BACKEND_URL}${url}`}
                      alt="post media"
                      className="w-full max-h-96 object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Reaction Bar */}
              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div className="flex items-center space-x-6">
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-600"
                      data-testid={`post-${post.id}-like-btn`}
                    >
                      <Heart className={`w-5 h-5 mr-2 ${post.user_reaction === 'like' ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{Object.values(post.reaction_counts || {}).reduce((a, b) => a + b, 0)}</span>
                    </Button>
                    {/* Reaction Picker */}
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex bg-white rounded-full shadow-xl p-2 space-x-2 border border-gray-200">
                      {Object.entries(reactionEmojis).map(([type, emoji]) => (
                        <button
                          key={type}
                          onClick={() => handleReaction(post.id, type)}
                          className="text-2xl hover:scale-125 transition-transform duration-200"
                          title={type}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {post.comment_count || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                    <Share2 className="w-5 h-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}

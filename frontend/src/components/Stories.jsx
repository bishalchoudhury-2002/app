import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, X } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent } from './ui/dialog';
import { api, BACKEND_URL } from '../App';
import Layout from './Layout';

export default function Stories({ user, onLogout }) {
  const [userStories, setUserStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await api.get('/stories');
      setUserStories(response.data.user_stories);
    } catch (error) {
      toast.error('Failed to load stories');
    }
  };

  const handleCreateStory = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Story created!');
      fetchStories();
    } catch (error) {
      toast.error('Failed to create story');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div data-testid="stories-container">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Stories</h1>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Create Story */}
          <div className="relative h-64 bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow border border-gray-100">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleCreateStory}
              className="hidden"
              id="story-upload"
            />
            <label
              htmlFor="story-upload"
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer"
              data-testid="create-story-btn"
            >
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-gray-900">Create Story</p>
            </label>
          </div>

          {/* User Stories */}
          {userStories.map((userStory) => (
            <div
              key={userStory.user.id}
              onClick={() => {
                setSelectedStory(userStory);
                setCurrentIndex(0);
              }}
              className="relative h-64 rounded-2xl shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              data-testid={`user-story-${userStory.user.id}`}
            >
              <img
                src={`${BACKEND_URL}${userStory.stories[0].media_url}`}
                alt="story"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-4 left-4 flex items-center space-x-2">
                <Avatar className="h-10 w-10 border-2 border-white">
                  <AvatarImage src={userStory.user.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${userStory.user.name}`} />
                  <AvatarFallback>{userStory.user.name?.[0]}</AvatarFallback>
                </Avatar>
                <p className="text-white font-medium text-sm">{userStory.user.name}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Story Viewer Dialog */}
        <Dialog open={!!selectedStory} onOpenChange={() => setSelectedStory(null)}>
          <DialogContent className="max-w-lg p-0 bg-black">
            {selectedStory && (
              <div className="relative h-[80vh]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                  onClick={() => setSelectedStory(null)}
                >
                  <X className="w-6 h-6" />
                </Button>
                
                <img
                  src={`${BACKEND_URL}${selectedStory.stories[currentIndex].media_url}`}
                  alt="story"
                  className="w-full h-full object-contain"
                />
                
                <div className="absolute top-4 left-4 flex items-center space-x-2">
                  <Avatar className="h-10 w-10 border-2 border-white">
                    <AvatarImage src={selectedStory.user.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedStory.user.name}`} />
                    <AvatarFallback>{selectedStory.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-white font-medium">{selectedStory.user.name}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

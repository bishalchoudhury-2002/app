import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Heart, MessageCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { api, BACKEND_URL } from '../App';
import Layout from './Layout';

export default function Reels({ user, onLogout }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const response = await api.get('/posts/reels');
      setReels(response.data.reels);
    } catch (error) {
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" data-testid="reels-container">
        <h1 className="text-3xl font-bold text-gray-900">Reels</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : reels.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
            <p className="text-gray-500 text-lg">No reels yet. Create your first reel!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {reels.map((reel) => (
              <div
                key={reel.id}
                className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                data-testid={`reel-${reel.id}`}
              >
                {reel.media_urls && reel.media_urls[0] && (
                  <video
                    src={`${BACKEND_URL}${reel.media_urls[0]}`}
                    className="w-full h-full object-cover"
                    loop
                    muted
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Avatar className="h-8 w-8 border-2 border-white">
                      <AvatarImage src={reel.user?.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${reel.user?.name}`} />
                      <AvatarFallback>{reel.user?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <p className="text-white font-medium text-sm">{reel.user?.name}</p>
                  </div>
                  <p className="text-white text-sm line-clamp-2">{reel.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

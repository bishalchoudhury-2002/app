import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { Card } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { api } from '../App';
import Layout from './Layout';

export default function Notifications({ user, onLogout }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'follow':
        return <UserPlus className="w-5 h-5 text-blue-600" />;
      case 'reaction':
        return <Heart className="w-5 h-5 text-red-600" />;
      case 'comment':
      case 'mention':
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" data-testid="notifications-container">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border ${
                  notification.read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
                }`}
                data-testid={`notification-${notification.id}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{notification.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

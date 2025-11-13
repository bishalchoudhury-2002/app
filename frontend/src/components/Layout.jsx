import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Bell, User, Search, Users, ShoppingBag, Calendar, Briefcase, Video, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

export default function Layout({ user, onLogout, children }) {
  const location = useLocation();

  const navigation = [
    { name: 'Feed', path: '/feed', icon: <Home className="w-5 h-5" /> },
    { name: 'Messages', path: '/messages', icon: <MessageCircle className="w-5 h-5" /> },
    { name: 'Reels', path: '/reels', icon: <Video className="w-5 h-5" /> },
    { name: 'Groups', path: '/groups', icon: <Users className="w-5 h-5" /> },
    { name: 'Marketplace', path: '/marketplace', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Events', path: '/events', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Jobs', path: '/jobs', icon: <Briefcase className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/feed" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent" data-testid="nav-logo">
              Social X
            </Link>

            <div className="flex items-center space-x-4">
              <Link to="/search" data-testid="nav-search-btn">
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5" />
                </Button>
              </Link>
              <Link to="/notifications" data-testid="nav-notifications-btn">
                <Button variant="ghost" size="icon">
                  <Bell className="w-5 h-5" />
                </Button>
              </Link>
              <Link to={`/profile/${user.id}`} data-testid="nav-profile-btn">
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                  <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                data-testid="nav-logout-btn"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-lg sticky top-24 border border-gray-100">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      data-testid={`sidebar-${item.name.toLowerCase()}-link`}
                    >
                      {item.icon}
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl mx-auto">
            {children}
          </main>

          {/* Right Sidebar - Suggestions */}
          <aside className="hidden xl:block w-80 shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-lg sticky top-24 border border-gray-100">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Posts</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Followers</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Following</span>
                  <span className="font-semibold text-gray-900">0</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="flex items-center justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-3 rounded-xl transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-600'
                }`}
                data-testid={`mobile-nav-${item.name.toLowerCase()}-link`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

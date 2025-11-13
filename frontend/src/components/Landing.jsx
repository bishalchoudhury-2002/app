import { useNavigate } from 'react-router-dom';
import { Users, MessageCircle, Heart, Share2, Video, Briefcase } from 'lucide-react';
import { Button } from './ui/button';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: <Users className="w-8 h-8" />, title: 'Connect', description: 'Follow friends and build your network' },
    { icon: <MessageCircle className="w-8 h-8" />, title: 'Chat', description: 'Real-time messaging and group chats' },
    { icon: <Video className="w-8 h-8" />, title: 'Share', description: 'Post photos, videos, and stories' },
    { icon: <Heart className="w-8 h-8" />, title: 'Engage', description: 'React, comment, and share content' },
    { icon: <Share2 className="w-8 h-8" />, title: 'Discover', description: 'Explore groups, marketplace, and events' },
    { icon: <Briefcase className="w-8 h-8" />, title: 'Careers', description: 'Find jobs and showcase your skills' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight" data-testid="landing-hero-title">
            Welcome to
            <span className="block mt-2 bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              Social X
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl" data-testid="landing-hero-description">
            Connect with friends, share your moments, discover communities, and build your professional network all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button 
              size="lg"
              className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-xl"
              onClick={() => navigate('/auth')}
              data-testid="landing-get-started-btn"
            >
              Get Started
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-300"
              onClick={() => navigate('/auth')}
              data-testid="landing-sign-in-btn"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100"
              data-testid={`feature-card-${index}`}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center text-white mb-6">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-32 bg-gradient-to-r from-blue-600 to-violet-600 rounded-3xl p-12 text-center text-white shadow-2xl max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to join?</h2>
          <p className="text-xl text-blue-100 mb-8">Start connecting with people around the world today</p>
          <Button 
            size="lg"
            className="text-lg px-10 py-6 bg-white text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-300 hover:scale-105 font-semibold"
            onClick={() => navigate('/auth')}
            data-testid="landing-join-now-btn"
          >
            Join Now - It's Free
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-600 border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <p>&copy; 2025 Social X. All rights reserved.</p>
      </footer>
    </div>
  );
}

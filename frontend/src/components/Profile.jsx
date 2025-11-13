import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Camera, MapPin, Briefcase, GraduationCap, Edit } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { api, BACKEND_URL } from '../App';
import Layout from './Layout';

export default function Profile({ currentUser, onLogout }) {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const isOwnProfile = currentUser.id === userId;

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/profile/${userId}`);
      setProfile(response.data);
      setEditData(response.data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      await api.post(`/connections/follow/${userId}`);
      toast.success('Following user');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to follow');
    }
  };

  const handleUnfollow = async () => {
    try {
      await api.delete(`/connections/unfollow/${userId}`);
      toast.success('Unfollowed user');
      fetchProfile();
    } catch (error) {
      toast.error('Failed to unfollow');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (editData.bio) formData.append('bio', editData.bio);
      if (editData.work) formData.append('work', editData.work);
      if (editData.education) formData.append('education', editData.education);
      if (editData.city) formData.append('city', editData.city);

      await api.put('/profile', formData);
      toast.success('Profile updated');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <Layout user={currentUser} onLogout={onLogout}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={currentUser} onLogout={onLogout}>
      <div className="space-y-6" data-testid="profile-container">
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* Cover Photo */}
          <div className="h-48 bg-gradient-to-r from-blue-500 to-violet-500 relative">
            {profile.cover_photo && (
              <img src={`${BACKEND_URL}${profile.cover_photo}`} alt="cover" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            <div className="flex items-end justify-between -mt-16 mb-4">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                <AvatarImage src={profile.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`} />
                <AvatarFallback className="text-3xl">{profile.name?.[0]}</AvatarFallback>
              </Avatar>
              
              <div className="mt-20">
                {isOwnProfile ? (
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" data-testid="edit-profile-btn">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                          <Label>Bio</Label>
                          <Textarea
                            value={editData.bio || ''}
                            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                            placeholder="Tell us about yourself"
                          />
                        </div>
                        <div>
                          <Label>Work</Label>
                          <Input
                            value={editData.work || ''}
                            onChange={(e) => setEditData({ ...editData, work: e.target.value })}
                            placeholder="Your occupation"
                          />
                        </div>
                        <div>
                          <Label>Education</Label>
                          <Input
                            value={editData.education || ''}
                            onChange={(e) => setEditData({ ...editData, education: e.target.value })}
                            placeholder="Your education"
                          />
                        </div>
                        <div>
                          <Label>City</Label>
                          <Input
                            value={editData.city || ''}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                            placeholder="Your location"
                          />
                        </div>
                        <Button type="submit" className="w-full">Save Changes</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="space-x-2">
                    {profile.connection_status === 'accepted' ? (
                      <Button onClick={handleUnfollow} variant="outline" className="rounded-xl" data-testid="unfollow-btn">
                        Unfollow
                      </Button>
                    ) : (
                      <Button onClick={handleFollow} className="bg-blue-600 hover:bg-blue-700 rounded-xl" data-testid="follow-btn">
                        Follow
                      </Button>
                    )}
                    <Button variant="outline" className="rounded-xl">Message</Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-gray-900">{profile.name}</h1>
              {profile.bio && <p className="text-gray-600">{profile.bio}</p>}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {profile.work && (
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {profile.work}
                  </div>
                )}
                {profile.education && (
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    {profile.education}
                  </div>
                )}
                {profile.city && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {profile.city}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Posts</h2>
          <p className="text-gray-500 text-center py-8">No posts yet</p>
        </div>
      </div>
    </Layout>
  );
}

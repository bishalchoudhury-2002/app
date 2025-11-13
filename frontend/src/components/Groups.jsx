import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card } from './ui/card';
import { api } from '../App';
import Layout from './Layout';

export default function Groups({ user, onLogout }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', group_type: 'public' });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups');
      setGroups(response.data.groups);
    } catch (error) {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', newGroup.name);
      formData.append('description', newGroup.description);
      formData.append('group_type', newGroup.group_type);
      
      await api.post('/groups', formData);
      toast.success('Group created!');
      setIsCreating(false);
      setNewGroup({ name: '', description: '', group_type: 'public' });
      fetchGroups();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" data-testid="groups-container">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" data-testid="create-group-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <Label>Group Name</Label>
                  <Input
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Enter group name"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="What's this group about?"
                    required
                  />
                </div>
                <div>
                  <Label>Privacy</Label>
                  <select
                    value={newGroup.group_type}
                    onChange={(e) => setNewGroup({ ...newGroup, group_type: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">Create Group</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : groups.length === 0 ? (
          <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No groups yet. Create your first group!</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {groups.map((group) => (
              <Card key={group.id} className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid={`group-${group.id}`}>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">{group.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{group.description}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-full font-medium">
                        {group.group_type}
                      </span>
                    </div>
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

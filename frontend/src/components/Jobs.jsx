import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Briefcase, Plus, MapPin, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { api } from '../App';
import Layout from './Layout';

export default function Jobs({ user, onLogout }) {
  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', description: '', requirements: '', location: '', salary_range: '' });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/posts');
      setJobPosts(response.data.job_posts);
    } catch (error) {
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newJob.title);
      formData.append('description', newJob.description);
      formData.append('requirements', newJob.requirements);
      formData.append('location', newJob.location);
      formData.append('salary_range', newJob.salary_range);
      
      await api.post('/jobs/posts', formData);
      toast.success('Job posted!');
      setIsPosting(false);
      setNewJob({ title: '', description: '', requirements: '', location: '', salary_range: '' });
      fetchJobs();
    } catch (error) {
      toast.error('Failed to post job');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" data-testid="jobs-container">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <Dialog open={isPosting} onOpenChange={setIsPosting}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" data-testid="post-job-btn">
                <Plus className="w-4 h-4 mr-2" />
                Post Job
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Post New Job</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePostJob} className="space-y-4">
                <div>
                  <Label>Job Title</Label>
                  <Input
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    placeholder="e.g., Senior Software Engineer"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    placeholder="Job description"
                    required
                  />
                </div>
                <div>
                  <Label>Requirements</Label>
                  <Textarea
                    value={newJob.requirements}
                    onChange={(e) => setNewJob({ ...newJob, requirements: e.target.value })}
                    placeholder="Required skills and experience"
                    required
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    placeholder="Job location"
                    required
                  />
                </div>
                <div>
                  <Label>Salary Range</Label>
                  <Input
                    value={newJob.salary_range}
                    onChange={(e) => setNewJob({ ...newJob, salary_range: e.target.value })}
                    placeholder="e.g., $100k - $150k"
                  />
                </div>
                <Button type="submit" className="w-full">Post Job</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="browse">Browse Jobs</TabsTrigger>
            <TabsTrigger value="profile">My Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="browse">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : jobPosts.length === 0 ? (
              <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
                <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500 text-lg">No job postings yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobPosts.map((job) => (
                  <Card key={job.id} className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid={`job-${job.id}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl text-gray-900 mb-2">{job.title}</h3>
                        <p className="text-gray-600 mb-3">{job.description}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {job.location}
                          </div>
                          {job.salary_range && (
                            <div className="flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              {job.salary_range}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-700"><strong>Requirements:</strong> {job.requirements}</p>
                      </div>
                      <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">Apply</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 text-lg mb-4">Build your professional profile</p>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">Create Job Profile</Button>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

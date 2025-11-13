import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Plus, MapPin, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card } from './ui/card';
import { api } from '../App';
import Layout from './Layout';

export default function Events({ user, onLogout }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '', location: '' });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data.events);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newEvent.title);
      formData.append('description', newEvent.description);
      formData.append('event_date', newEvent.event_date);
      formData.append('location', newEvent.location);
      
      await api.post('/events', formData);
      toast.success('Event created!');
      setIsCreating(false);
      setNewEvent({ title: '', description: '', event_date: '', location: '' });
      fetchEvents();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" data-testid="events-container">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" data-testid="create-event-btn">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <Label>Event Title</Label>
                  <Input
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event name"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event details"
                    required
                  />
                </div>
                <div>
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Event location"
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Create Event</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : events.length === 0 ? (
          <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
            <CalendarIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No upcoming events</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id} className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100" data-testid={`event-${event.id}`}>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex flex-col items-center justify-center text-white">
                    <p className="text-xs font-medium">{new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}</p>
                    <p className="text-2xl font-bold">{new Date(event.event_date).getDate()}</p>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-xl text-gray-900 mb-2">{event.title}</h3>
                    <p className="text-gray-600 mb-3">{event.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(event.event_date).toLocaleTimeString()}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">RSVP</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ShoppingBag, Plus, DollarSign } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card } from './ui/card';
import { api, BACKEND_URL } from '../App';
import Layout from './Layout';

export default function Marketplace({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', description: '', price: '' });
  const [itemImages, setItemImages] = useState([]);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/marketplace');
      setItems(response.data.items);
    } catch (error) {
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newItem.title);
      formData.append('description', newItem.description);
      formData.append('price', parseFloat(newItem.price));
      
      itemImages.forEach(file => {
        formData.append('files', file);
      });
      
      await api.post('/marketplace', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Item listed!');
      setIsCreating(false);
      setNewItem({ title: '', description: '', price: '' });
      setItemImages([]);
      fetchItems();
    } catch (error) {
      toast.error('Failed to list item');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" data-testid="marketplace-container">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl" data-testid="list-item-btn">
                <Plus className="w-4 h-4 mr-2" />
                List Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>List New Item</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="Item name"
                    required
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    placeholder="Describe your item"
                    required
                  />
                </div>
                <div>
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label>Images</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setItemImages(Array.from(e.target.files))}
                  />
                </div>
                <Button type="submit" className="w-full">List Item</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No items listed yet</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden border border-gray-100" data-testid={`marketplace-item-${item.id}`}>
                {item.images && item.images[0] && (
                  <img
                    src={`${BACKEND_URL}${item.images[0]}`}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-blue-600 font-bold text-xl">
                      <DollarSign className="w-5 h-5" />
                      {item.price}
                    </div>
                    <p className="text-sm text-gray-500">{item.seller?.name}</p>
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

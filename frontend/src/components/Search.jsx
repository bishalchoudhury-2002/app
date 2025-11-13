import { useState } from 'react';
import { toast } from 'sonner';
import { Search as SearchIcon, User } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { api } from '../App';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

export default function Search({ user, onLogout }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const response = await api.get(`/search/users?q=${encodeURIComponent(query)}`);
      setResults(response.data.users);
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="space-y-6" data-testid="search-container">
        <h1 className="text-3xl font-bold text-gray-900">Search</h1>
        
        <form onSubmit={handleSearch}>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for people..."
                className="pl-10 py-6 rounded-xl"
                data-testid="search-input"
              />
            </div>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8" data-testid="search-btn">
              Search
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : searched && results.length === 0 ? (
          <Card className="p-12 text-center bg-white rounded-2xl shadow-lg border border-gray-100">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 text-lg">No users found</p>
          </Card>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((resultUser) => (
              <Card
                key={resultUser.id}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 cursor-pointer"
                onClick={() => navigate(`/profile/${resultUser.id}`)}
                data-testid={`search-result-${resultUser.id}`}
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={resultUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${resultUser.name}`} />
                    <AvatarFallback>{resultUser.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{resultUser.name}</h4>
                    <p className="text-sm text-gray-500">{resultUser.email}</p>
                    {resultUser.bio && <p className="text-sm text-gray-600 mt-1">{resultUser.bio}</p>}
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">View Profile</Button>
                </div>
              </Card>
            ))}
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

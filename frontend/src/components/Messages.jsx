import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { api } from '../App';
import Layout from './Layout';

export default function Messages({ user, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/conversations');
      setConversations(response.data.conversations);
    } catch (error) {
      toast.error('Failed to load conversations');
    }
  };

  const fetchMessages = async (convId) => {
    try {
      const response = await api.get(`/messages/${convId}`);
      setMessages(response.data.messages);
    } catch (error) {
      toast.error('Failed to load messages');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      
      await api.post(`/messages/${selectedConv.id}`, formData);
      setNewMessage('');
      fetchMessages(selectedConv.id);
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="bg-white rounded-2xl shadow-lg h-[calc(100vh-12rem)] flex border border-gray-100 overflow-hidden" data-testid="messages-container">
        {/* Conversations List */}
        <div className="w-80 border-r border-gray-200 overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold">Messages</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {conversations.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No conversations yet</p>
            ) : (
              conversations.map((conv) => {
                const otherUser = conv.participant_users.find(u => u.id !== user.id) || conv.participant_users[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors ${
                      selectedConv?.id === conv.id ? 'bg-blue-50' : ''
                    }`}
                    data-testid={`conversation-${conv.id}`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.name}`} />
                      <AvatarFallback>{otherUser.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <h4 className="font-semibold text-gray-900">{otherUser.name}</h4>
                      <p className="text-sm text-gray-500 truncate">{conv.last_message?.content || 'No messages yet'}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-200 flex items-center space-x-3">
                {(() => {
                  const otherUser = selectedConv.participant_users.find(u => u.id !== user.id) || selectedConv.participant_users[0];
                  return (
                    <>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={otherUser.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${otherUser.name}`} />
                        <AvatarFallback>{otherUser.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
                    </>
                  );
                })()}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`} data-testid={`message-${msg.id}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        isMine
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          isMine ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-6 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="rounded-full"
                    data-testid="message-input"
                  />
                  <Button type="submit" className="rounded-full bg-blue-600 hover:bg-blue-700" size="icon" data-testid="send-message-btn">
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

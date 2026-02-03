import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { modelenceMutation } from '@modelence/react-query';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GenerateResponseResult extends ChatMessage {
  chatId?: string;
}

interface ChatMessagesProps {
  messages?: ChatMessage[];
  chatId?: string;
}

export default function ChatMessages({ messages = [], chatId }: ChatMessagesProps) {
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const { mutateAsync: generateResponse, isPending } = useMutation(
    modelenceMutation('aiChat.generateResponse')
  );

  const getAllMessages = () => {
    return [...messages, ...pendingMessages];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    const allMessages = getAllMessages();
    setPendingMessages(prev => [...prev, userMessage]);
    setInput('');
    
    const response = await generateResponse({ 
      messages: [...allMessages, userMessage],
      chatId,
    }) as GenerateResponseResult;
    
    const aiMessage: ChatMessage = { role: response.role, content: response.content };
    setPendingMessages(prev => [...prev, aiMessage]);
    
    if (!chatId && response.chatId) {
      navigate(`/chat/${response.chatId}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 160px)' }}>
        <div className="max-w-3xl mx-auto p-4 space-y-4 pb-24">
          {getAllMessages().map((message, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg ${
                message.role === 'user' 
                  ? 'bg-slate-200 ml-12' 
                  : 'bg-white mr-12'
              }`}
            >
              {message.content}
            </div>
          ))}
          {isPending && (
            <div className="bg-white mr-12 p-4 rounded-lg">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-64 right-0 bg-white border-t p-4 z-10">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              rows={1}
              className="flex-1 p-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto"
              placeholder="Type your message... (Shift + Enter for new line)"
              style={{ minHeight: '42px', maxHeight: '200px' }}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

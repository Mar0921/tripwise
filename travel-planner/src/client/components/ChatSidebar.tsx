import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import { Link } from 'react-router-dom';

interface Chat {
  _id: string;
  title: string;
  createdAt: string;
}

export default function ChatSidebar() {
  const { data: chats = [], isPending } = useQuery(
    modelenceQuery<Chat[]>('aiChat.getChats')
  );

  return (
    <div className="w-64 bg-gray-50 border-r flex flex-col h-full">
      <div className="p-4 border-b flex-shrink-0">
        <Link to="/" className="block w-full">
          <button className="w-full border border-primary text-primary rounded-lg py-2 px-4 hover:bg-primary/10 transition-colors">
            New Chat
          </button>
        </Link>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="p-2 space-y-1">
          {isPending ? (
            <PendingMessage />
          ) : (
            chats?.map((chat) => (
              <Link
                key={chat._id}
                to={`/chat/${chat._id}`}
                className="block p-2 rounded-lg hover:bg-gray-100 transition-colors truncate"
              >
                {chat.title}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 

function PendingMessage() {
  return (
    <div className="p-2">
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
      </div>
    </div>
  );
}
  
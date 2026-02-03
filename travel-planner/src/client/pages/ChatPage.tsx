import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { modelenceQuery } from '@modelence/react-query';
import Page from '../components/Page';
import ChatSidebar from '../components/ChatSidebar';
import ChatMessages from '../components/ChatMessages';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  messages: ChatMessage[];
  chatTitle: string;
}

export default function ChatPage() {
  const { chatId } = useParams<{ chatId: string }>();
  const { data, isPending } = useQuery(
    modelenceQuery<ChatResponse>('aiChat.getMessages', { chatId })
  );
  const messages = data?.messages ?? [];

  return (
    <Page sidebar={<ChatSidebar />}>
      {isPending ? (
        <div className="p-4 border-b bg-white flex-shrink-0">
          <div className="flex gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      ) : (
        <>
          {data?.chatTitle && (
            <div className="p-4 border-b bg-white flex-shrink-0">
              <h1 className="text-lg font-semibold text-gray-800">{data.chatTitle}</h1>
            </div>
          )}
          <ChatMessages messages={messages} chatId={chatId} />
        </>
      )}
    </Page>
  );
}

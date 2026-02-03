import Page from '../components/Page';
import ChatSidebar from '../components/ChatSidebar';
import ChatMessages from '../components/ChatMessages';

export default function HomePage() {
  return (
    <Page sidebar={<ChatSidebar />}>
      <ChatMessages />
    </Page>
  );
}

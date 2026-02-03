import { UserProfile } from '@modelence/auth-ui';
import Page from '../components/Page';

export default function ProfilePage() {
  return (
    <Page>
      <div className="container mx-auto px-4 py-8">
        <UserProfile />
      </div>
    </Page>
  );
}

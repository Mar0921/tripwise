import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../ui/Button';

export default function NotFoundPage() {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Header />
      
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
            <p className="text-gray-600 mb-8">
              Sorry, the page you're looking for doesn't exist or has been moved.
            </p>
          </div>
          
          <div className="space-y-4">
            <Link to="/">
              <Button variant="primary" size="lg">
                Go Home
              </Button>
            </Link>
            
            <div className="text-sm text-gray-500">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
              >
                Go back to previous page
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
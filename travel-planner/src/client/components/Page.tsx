import { ReactNode } from 'react';
import Header from './Header';

interface PageProps {
  children: ReactNode;
  className?: string;
  sidebar?: ReactNode;
}

export default function Page({ children, className = '', sidebar }: PageProps) {
  return (
    <div className={`h-screen flex bg-gray-100 ${className}`}>
      {sidebar}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Header />
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

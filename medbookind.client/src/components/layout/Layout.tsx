import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const mapRole = (role?: string) => {
    switch (role) {
      case 'Admin': return 'admin';
      case 'Doctor': return 'doctor';
      case 'Staff': return 'staff';
      case 'Developer': return 'developer';
      default: return 'patient';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 overflow-x-hidden">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="flex h-[calc(100vh-4rem)] overflow-x-hidden">
        <Sidebar 
          isOpen={sidebarOpen} 
          toggleSidebar={toggleSidebar} 
          userRole={mapRole(user?.role)} 
        />
        <main
          className={`
            flex-1 min-w-0 
            p-2 sm:p-4 md:p-6 
            lg:ml-5 
            transition-all duration-300 
            bg-slate-50
            overflow-x-auto
          `}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
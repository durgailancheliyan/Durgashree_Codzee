import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  Activity, 
  Settings,
  X,
  Clock,
  User,
  BarChart4,
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  userRole: 'admin' | 'doctor' | 'staff' | 'patient' | 'developer';
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggleSidebar, userRole }) => {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);
  
  const isActiveRoute = (route: string) => {
    return location.pathname === route || location.pathname.startsWith(`${route}/`);
  };
  
  const navLinkClass = (route: string) => {
    return `flex items-center ${
      isHovered ? 'p-3' : 'py-4 lg:py-3'
    } rounded-lg ${
      isActiveRoute(route)
        ? 'bg-cyan-600 text-white'
        : 'text-gray-600 hover:bg-cyan-50 hover:text-cyan-600'
    } transition-all duration-200 ${
      !isHovered ? 'lg:justify-center' : ''
    }`;
  };

  const renderNavItems = () => {
    // Common navigation items
    const commonItems = [
      {
        to: '/dashboard',
        icon: <Home className="w-6 h-6" />,
        label: 'Dashboard',
        roles: ['admin', 'doctor', 'staff', 'patient'],
      }
    ];

    // Role-specific navigation items
    const roleSpecificItems = {
      admin: [
        {
          to: '/admin/dashboard',
          icon: <BarChart4 className="w-6 h-6" />,
          label: 'Admin Dashboard',
        },
        {
          to: '/admin/appointments',
          icon: <Calendar className="w-6 h-6" />,
          label: 'Appointments',
        },
        {
          to: '/admin/consult-manager',
          icon: <Calendar className="w-6 h-6" />,
          label: 'Consult Manager',
        },
        {
          to: '/admin/departments',
          icon: <FileText className="w-6 h-6" />,
          label: 'Departments',
        },
        {
          to: '/admin/reports',
          icon: <CreditCard className="w-6 h-6" />,
          label: 'Reports & export',
        },
        {
          to: '/admin/settings',
          icon: <Settings className="w-6 h-6" />,
          label: 'Settings',
        },
        {
          to: '/admin/configuration/treatment',
          icon: <Activity className="w-6 h-6" />,
          label: 'Treatment config',
        },
        {
          to: '/admin/configuration/patient',
          icon: <Users className="w-6 h-6" />,
          label: 'Patient config',
        },
        {
          to: '/admin/configuration/payment',
          icon: <CreditCard className="w-6 h-6" />,
          label: 'Payment config',
        },
        {
          to: '/admin/configuration/appointment',
          icon: <Calendar className="w-6 h-6" />,
          label: 'Appointment config',
        },
      ],
      doctor: [
        {
          to: '/doctor/dashboard',
          icon: <Activity className="w-6 h-6" />,
          label: 'Doctor Dashboard',
        },
        {
          to: '/doctor/consult-manager',
          icon: <Calendar className="w-6 h-6" />,
          label: 'Consult Manager',
        },
        {
          to: '/doctor/doctor-schedule',
          icon: <Clock className="w-6 h-6" />,
          label: 'My Schedule',
        },
        {
          to: '/doctor/patients',
          icon: <Users className="w-6 h-6" />,
          label: 'My Patients',
        },
        {
          to: '/doctor/reports',
          icon: <BarChart4 className="w-6 h-6" />,
          label: 'Reports & export',
        },
      ],
      staff: [
        {
          to: '/staff/dashboard',
          icon: <Users className="w-6 h-6" />,
          label: 'Dashboard',
        },
        {
          to: '/staff/consult-manager',
          icon: <Calendar className="w-6 h-6" />,
          label: 'Consult Manager',
        },
        {
          to: '/staff/appointments',
          icon: <FileText className="w-6 h-6" />,
          label: 'Appointments',
        },
        {
          to: '/staff/reports',
          icon: <BarChart4 className="w-6 h-6" />,
          label: 'Reports & export',
        },
      ],
      patient: [
        {
          to: '/patient/patient-dashboard',
          icon: <User className="w-6 h-6" />,
          label: 'My Dashboard',
        },
        {
          to: '/patient/book-appointment',
          icon: <Calendar className="w-6 h-6" />,
          label: 'Book Appointment',
        },
        {
          to: '/patient/patient-profile',
          icon: <FileText className="w-6 h-6" />,
          label: 'Medical Records',
        },
      ],
      developer:[
        {
          to: '/developer/dashboard',
          icon: <BarChart4 className="w-6 h-6" />,
          label: 'Developer Dashboard',
        },
        {
          to: '/developer/practicemanagement',
          icon: <Activity className="w-6 h-6" />,
          label: 'Practice Management',
        }
      ]
    };

    // Filter common items based on user role
    const filteredCommonItems = commonItems.filter(item => 
      item.roles.includes(userRole)
    );

    // Combine common and role-specific items
    const navItems = [
      ...(roleSpecificItems[userRole] || [])
    ];

    return navItems.map((item) => (
      <li key={`${item.to}-${item.label}`}>
        <Link to={item.to} className={navLinkClass(item.to)}>
          {item.icon}
          <span className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 lg:w-0 hidden'
          }`}>
            {item.label}
          </span>
        </Link>
      </li>
    ));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button 
          className="fixed inset-0 z-20 w-full h-full bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
          onKeyDown={(e) => e.key === 'Escape' && toggleSidebar()}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 bg-white shadow-lg transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 lg:static lg:inset-0 transition-all duration-300 ease-in-out ${
          isHovered ? 'lg:w-64' : 'lg:w-20'
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <div className="flex items-center">
            <span className={`text-[15px] font-bold text-cyan-600 whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isHovered ? 'opacity-100 w-auto' : 'opacity-0 w-0 lg:w-0'
            }`}>
              HSMS
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-5 px-5">
          <ul className="space-y-2">
            {renderNavItems()}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
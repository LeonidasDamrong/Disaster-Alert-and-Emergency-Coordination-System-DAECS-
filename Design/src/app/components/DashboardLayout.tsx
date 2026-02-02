import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { 
  ShieldAlert, 
  LayoutDashboard, 
  Radio, 
  AlertTriangle, 
  Home as HomeIcon, 
  Package,
  Users,
  LogOut,
  Bell
} from 'lucide-react';
import { Badge } from './ui/badge';

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['Admin', 'Emergency Officer', 'Shelter Manager', 'Resource Manager'] },
    { path: '/sos', icon: Radio, label: 'SOS Monitoring', roles: ['Admin', 'Emergency Officer'] },
    { path: '/alerts', icon: AlertTriangle, label: 'Alert Broadcasting', roles: ['Admin', 'Emergency Officer'] },
    { path: '/shelters', icon: HomeIcon, label: 'Shelter Management', roles: ['Admin', 'Shelter Manager'] },
    { path: '/resources', icon: Package, label: 'Resource Management', roles: ['Admin', 'Resource Manager'] },
    { path: '/admin', icon: Users, label: 'Admin Management', roles: ['Admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-red-600 p-2 rounded">
                <ShieldAlert className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">DAECS</h1>
                <p className="text-xs text-gray-500">Disaster Alert & Emergency Coordination</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-600 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </Button>
              
              <div className="flex items-center gap-3 border-l pl-4">
                <div className="text-right">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <Badge variant="outline" className="text-xs">{user?.role}</Badge>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-1">
            {filteredNavItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  className={`w-full justify-start gap-3 ${
                    isActive(item.path)
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

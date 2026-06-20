import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  LayoutDashboard,
  Users,
  Compass,
  CreditCard,
  FileBarChart,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  User as UserIcon,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout, theme, toggleTheme, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const data = await api.notifications.list();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll notifications every 30 seconds for real-time feel
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await api.notifications.markRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const adminMenu = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Driver Management', path: '/admin/drivers', icon: Users },
    { name: 'Trip Management', path: '/admin/trips', icon: Compass },
    { name: 'Expense Verification', path: '/admin/expenses', icon: CheckCircle },
    { name: 'Settlement Requests', path: '/admin/settlements', icon: CreditCard },
    { name: 'Reports & Analytics', path: '/admin/reports', icon: FileBarChart },
    { name: 'My Profile', path: '/admin/profile', icon: UserIcon },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const driverMenu = [
    { name: 'My Dashboard', path: '/driver', icon: LayoutDashboard },
    { name: 'My Trips', path: '/driver/trips', icon: Compass },
    { name: 'Settlement History', path: '/driver/settlements', icon: Clock },
    { name: 'My Profile', path: '/driver/profile', icon: UserIcon },
    { name: 'Settings', path: '/driver/settings', icon: Settings },
  ];

  const menuItems = isAdmin ? adminMenu : driverMenu;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close sidebar on navigation change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
    setNotifDropdownOpen(false);
  }, [location]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300 dark:bg-zinc-950 dark:text-zinc-100">
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-900 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6 dark:border-zinc-800">
          <Link to="/" className="flex flex-col">
            <span className="text-md font-bold tracking-tight text-blue-600 dark:text-blue-400">MANIVTHA</span>
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-widest">Tours & Travels</span>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User profile short summary */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4 dark:border-zinc-800">
          <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-blue-100 text-blue-600 dark:border-zinc-850 dark:bg-blue-950 dark:text-blue-400 font-bold items-center justify-center">
            {user?.profileImageUrl ? (
              <img src={user.profileImageUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold">{user?.name}</span>
            <span className="text-xs font-medium text-slate-400 dark:text-zinc-500 capitalize">{user?.role}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-4 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path) && (item.path !== '/admin' || location.pathname === '/admin') && (item.path !== '/driver' || location.pathname === '/driver'));
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/10 dark:bg-blue-500 dark:shadow-blue-500/10'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="border-t border-slate-200 p-4 dark:border-zinc-800">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Navbar */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900 shadow-premium">
          
          {/* Hamburger Menu Toggle (Mobile) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="hidden text-lg font-bold text-slate-800 dark:text-zinc-100 md:block">
              {isAdmin ? 'Admin Console' : 'Driver Portal'}
            </h2>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-zinc-900">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 z-50 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto py-1">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400 dark:text-zinc-500">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`flex items-start gap-3 rounded-xl px-4 py-2.5 transition-colors ${
                            notif.isRead 
                              ? 'opacity-60 hover:bg-slate-50 dark:hover:bg-zinc-800/40' 
                              : 'bg-blue-50/50 hover:bg-blue-50 dark:bg-blue-950/10 dark:hover:bg-blue-950/20'
                          }`}
                        >
                          <div className="flex-1 text-xs font-medium">
                            <p className="text-slate-700 dark:text-zinc-300">{notif.message}</p>
                            <span className="mt-1 block text-[10px] text-slate-400 dark:text-zinc-500">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!notif.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notif.id, e)}
                              className="rounded-full bg-blue-100 p-1 text-blue-600 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400"
                              title="Mark as read"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown Shortcut */}
            <Link to={isAdmin ? '/admin/profile' : '/driver/profile'} className="flex h-9 w-9 shrink-0 overflow-hidden items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold border border-blue-200/50 dark:border-blue-900/50 hover:opacity-85 transition-opacity">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </Link>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
};

export default DashboardLayout;

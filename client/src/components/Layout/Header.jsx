import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Search, Settings, ChevronDown, LogOut, User, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CommandPalette from './CommandPalette';
import { getImageUrl } from '../../utils/helpers';
import { SidebarTrigger } from '../ui/sidebar';
import Popover11 from '../ui/popover-11';

const Header = ({ schoolData }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const openPalette = () => setIsCommandPaletteOpen(true);
    document.addEventListener('open-command-palette', openPalette);
    return () => document.removeEventListener('open-command-palette', openPalette);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const logo = schoolData?.logo_url || schoolData?.logo;
  const schoolName = schoolData?.name || 'School Management System';
  const academicYear = schoolData?.academic_year || '2026-2027';

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-white/10 dark:bg-[#162B5B]">
        {/* Left Section: Logo/Title */}
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 truncate">
            {logo ? (
              <img
                src={getImageUrl(logo)}
                alt="School Logo"
                className="size-8 rounded-full object-contain bg-slate-100 p-0.5 shrink-0 dark:bg-white/10"
              />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#5B3FD8] text-white font-extrabold text-xs">
                C
              </div>
            )}
            <div className="flex flex-col min-w-0 truncate">
              <span className="text-sm font-bold text-slate-900 dark:text-white truncate leading-snug">
                {schoolName}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-white/60 truncate leading-none">
                Academic Year: {academicYear}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Search + Notifications Popover + User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="header-search hidden sm:flex" onClick={() => setIsCommandPaletteOpen(true)}>
            <Search size={16} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search students, fees, reports..." 
              className="search-input text-xs" 
              readOnly 
            />
            <div className="search-shortcut">⌘K</div>
          </div>

          <Popover11 />

          <div className="header-dropdown-container shrink-0" ref={profileRef}>
            <button 
              className="user-profile-btn flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="avatar size-8 shrink-0 rounded-full overflow-hidden">
                {user?.profileImage ? (
                  <img src={getImageUrl(user.profileImage)} alt={user.name} className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-[#5B3FD8] text-white text-xs font-bold flex items-center justify-center">
                    {getInitials(user?.name)}
                  </div>
                )}
              </div>
              <div className="user-info hidden md:flex flex-col items-start min-w-0 truncate">
                <div className="user-name text-xs font-bold text-slate-900 dark:text-white truncate leading-tight">
                  {user?.name || 'User'}
                </div>
                <div className="user-role text-[10px] font-medium text-slate-500 dark:text-white/60 capitalize leading-none">
                  {user?.role || 'Staff'}
                </div>
              </div>
              <ChevronDown size={14} className="chevron-icon text-slate-400 shrink-0" />
            </button>

            <AnimatePresence>
              {showProfileMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="header-dropdown profile-dropdown"
                >
                  <div className="dropdown-user-header">
                    <div className="avatar avatar-lg">
                      {user?.profileImage ? (
                        <img src={getImageUrl(user.profileImage)} alt={user.name} />
                      ) : (
                        getInitials(user?.name)
                      )}
                    </div>
                    <div className="user-details">
                      <div className="name">{user?.name}</div>
                      <div className="email">{user?.email}</div>
                      <span className="badge badge-primary text-xs mt-1">{user?.role}</span>
                    </div>
                  </div>

                  <div className="dropdown-divider"></div>

                  <div className="dropdown-menu-list">
                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/profile');
                      }}
                    >
                      <User size={16} />
                      <span>My Profile</span>
                    </button>

                    <button 
                      className="dropdown-item"
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/change-password');
                      }}
                    >
                      <Lock size={16} />
                      <span>Change Password</span>
                    </button>

                    {user?.role === 'principal' && (
                      <button 
                        className="dropdown-item"
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/school-setup');
                        }}
                      >
                        <Settings size={16} />
                        <span>School Settings</span>
                      </button>
                    )}
                  </div>

                  <div className="dropdown-divider"></div>

                  <button 
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </>
  );
};

export default Header;

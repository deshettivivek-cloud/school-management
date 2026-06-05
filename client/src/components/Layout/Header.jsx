import { useAuth } from '../../context/AuthContext';
import { HiOutlineMenu } from 'react-icons/hi';

const Header = ({ title, collapsed, setMobileOpen }) => {
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className={`header ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="header-left">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setMobileOpen(true)}
          style={{ display: 'none' }}
          id="mobile-menu-btn"
        >
          <HiOutlineMenu size={22} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="header-right">
        <div className="header-user">
          <div className="header-avatar">{getInitials(user?.name)}</div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name || 'User'}</span>
            <span className="header-user-role">{user?.role || 'teacher'}</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;

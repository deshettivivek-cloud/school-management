import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, FileText, Settings, X, GraduationCap, DollarSign, Calculator } from 'lucide-react';
import api from '../../api/axios';
import { motion, AnimatePresence } from 'framer-motion';

const STATIC_LINKS = [
  { id: 'home', title: 'Dashboard', path: '/dashboard', icon: <Calculator size={18} /> },
  { id: 'students', title: 'Student Directory', path: '/students/directory', icon: <User size={18} /> },
  { id: 'fees', title: 'Fee Collection', path: '/fees/collection', icon: <DollarSign size={18} /> },
  { id: 'import', title: 'Import Students', path: '/students/import', icon: <GraduationCap size={18} /> },
  { id: 'reports', title: 'Reports Dashboard', path: '/reports', icon: <FileText size={18} /> },
  { id: 'settings', title: 'School Setup', path: '/school-setup', icon: <Settings size={18} /> },
];

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ static: STATIC_LINKS, students: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults({ static: STATIC_LINKS, students: [] });
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle global Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else document.dispatchEvent(new CustomEvent('open-command-palette'));
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle search logic
  useEffect(() => {
    if (!isOpen) return;

    const fetchResults = async () => {
      if (!query.trim()) {
        setResults({ static: STATIC_LINKS, students: [] });
        return;
      }

      // Filter static links
      const filteredStatic = STATIC_LINKS.filter(link => 
        link.title.toLowerCase().includes(query.toLowerCase())
      );

      setLoading(true);
      try {
        // Fetch students
        const res = await api.get(`/students?search=${encodeURIComponent(query)}`);
        const students = res.data.data.slice(0, 5).map(s => ({
          id: s.id,
          title: s.name,
          subtitle: `ADM: ${s.admission_no} | Grade: ${s.grade}`,
          path: `/students/${s.id}`,
          icon: <GraduationCap size={18} />
        }));

        setResults({ static: filteredStatic, students });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
        setSelectedIndex(0);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [query, isOpen]);

  // Handle Keyboard Navigation
  const flatResults = [...results.static, ...results.students];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelect(flatResults[selectedIndex].path);
      }
    }
  };

  const handleSelect = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="command-palette-overlay" onClick={onClose}>
            <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="command-palette-modal"
          onClick={e => e.stopPropagation()}
        >
          <div className="palette-header">
            <Search size={20} className="search-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search students, pages, or actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="palette-input"
            />
            <button className="btn btn-ghost btn-icon close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          <div className="palette-body">
            {loading ? (
              <div className="palette-loading">Searching...</div>
            ) : flatResults.length === 0 ? (
              <div className="palette-empty">No results found for "{query}"</div>
            ) : (
              <>
                {results.static.length > 0 && (
                  <div className="palette-section">
                    <div className="palette-section-title">Pages</div>
                    {results.static.map((item, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <div 
                          key={item.id} 
                          className={`palette-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelect(item.path)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <div className="palette-item-icon">{item.icon}</div>
                          <div className="palette-item-text">{item.title}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {results.students.length > 0 && (
                  <div className="palette-section">
                    <div className="palette-section-title">Students</div>
                    {results.students.map((item, idx) => {
                      const globalIdx = results.static.length + idx;
                      const isSelected = selectedIndex === globalIdx;
                      return (
                        <div 
                          key={item.id} 
                          className={`palette-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelect(item.path)}
                          onMouseEnter={() => setSelectedIndex(globalIdx)}
                        >
                          <div className="palette-item-icon">{item.icon}</div>
                          <div className="palette-item-content">
                            <div className="palette-item-text">{item.title}</div>
                            <div className="palette-item-sub">{item.subtitle}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .command-palette-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 10vh;
        }
        .command-palette-modal {
          width: 100%;
          max-width: 600px;
          background: var(--bg-primary);
          border-radius: var(--radius-lg);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
          border: 1px solid var(--border-color);
        }
        .palette-header {
          display: flex;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }
        .palette-header .search-icon {
          color: var(--text-muted);
          margin-right: 1rem;
        }
        .palette-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 1.1rem;
          color: var(--text-primary);
          outline: none;
        }
        .palette-input::placeholder {
          color: var(--text-placeholder);
        }
        .close-btn {
          margin-left: 1rem;
          color: var(--text-muted);
        }
        .palette-body {
          max-height: 400px;
          overflow-y: auto;
          padding: 1rem 0;
        }
        .palette-loading, .palette-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .palette-section {
          margin-bottom: 1rem;
        }
        .palette-section:last-child {
          margin-bottom: 0;
        }
        .palette-section-title {
          padding: 0.5rem 1.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }
        .palette-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: background 0.1s ease;
          gap: 1rem;
        }
        .palette-item.selected {
          background: var(--bg-tertiary);
        }
        .palette-item-icon {
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .palette-item.selected .palette-item-icon {
          color: var(--primary-600);
        }
        .palette-item-content {
          display: flex;
          flex-direction: column;
        }
        .palette-item-text {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-primary);
        }
        .palette-item.selected .palette-item-text {
          color: var(--primary-700);
        }
        .palette-item-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }
      `}</style>
    </>
  );
};

export default CommandPalette;

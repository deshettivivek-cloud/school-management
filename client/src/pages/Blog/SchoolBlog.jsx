import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import PrintSection from '../../components/PrintSection';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSave,
  HiOutlineCalendar,
  HiOutlineUser,
} from 'react-icons/hi';
import { format } from 'date-fns';

const SchoolBlog = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewPost, setViewPost] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', coverImageUrl: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/blog');
      setPosts(res.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ title: '', content: '', coverImageUrl: '' });
    setShowModal(true);
  };

  const openEdit = (post) => {
    setEditId(post.id);
    setForm({
      title: post.title,
      content: post.content,
      coverImageUrl: post.cover_image_url || '',
    });
    setShowModal(true);
  };

  const openView = (post) => {
    setViewPost(post);
    setShowViewModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) {
      toast.error('Title and content are required');
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await api.put(`/blog/${editId}`, form);
        toast.success('Post updated! ✅');
      } else {
        await api.post('/blog', form);
        toast.success('Post published! 🎉');
      }
      setShowModal(false);
      fetchPosts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await api.delete(`/blog/${id}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <PrintSection title="School Blog">
      <div className="animate-fade-in">
        <div className="page-header">
          <div className="page-header-info">
            <h1>School Blog</h1>
            <p>News, announcements, and updates from your school</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={openCreate}>
              <HiOutlinePlus /> New Post
            </button>
          </div>
        </div>

        {loading ? (
          <div className="spinner-container"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3 className="empty-state-title">No Blog Posts Yet</h3>
              <p className="empty-state-text">Be the first to share news and updates!</p>
              <button className="btn btn-primary" onClick={openCreate}>
                <HiOutlinePlus /> Create First Post
              </button>
            </div>
          </div>
        ) : (
          <div className="blog-grid">
            {posts.map((post) => (
              <div key={post.id} className="blog-card">
                {post.cover_image_url && (
                  <div className="blog-card-cover">
                    <img src={post.cover_image_url} alt={post.title} />
                  </div>
                )}
                <div className="blog-card-body">
                  <h3 className="blog-card-title">{post.title}</h3>
                  <p className="blog-card-excerpt">
                    {post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}
                  </p>
                  <div className="blog-card-meta">
                    <span className="blog-meta-item">
                      <HiOutlineUser size={14} />
                      {post.author_name || 'Staff'}
                    </span>
                    <span className="blog-meta-item">
                      <HiOutlineCalendar size={14} />
                      {format(new Date(post.created_at), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <div className="blog-card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => openView(post)}>
                      <HiOutlineEye /> Read
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(post)}>
                      <HiOutlinePencil /> Edit
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--danger-400)' }}
                      onClick={() => deletePost(post.id)}
                    >
                      <HiOutlineTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
              <div className="modal-header">
                <h3 className="modal-title">{editId ? 'Edit Blog Post' : 'New Blog Post'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <HiOutlineX />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      id="blog-title"
                      className="form-input"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="Enter post title..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cover Image URL (optional)</label>
                    <input
                      id="blog-cover"
                      className="form-input"
                      value={form.coverImageUrl}
                      onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Content *</label>
                    <textarea
                      id="blog-content"
                      className="form-textarea"
                      value={form.content}
                      onChange={(e) => setForm({ ...form, content: e.target.value })}
                      placeholder="Write your blog post content here..."
                      rows={10}
                      style={{ minHeight: 200 }}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button id="blog-save" type="submit" className="btn btn-primary" disabled={saving}>
                    <HiOutlineSave /> {saving ? 'Saving...' : editId ? 'Update' : 'Publish'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Post Modal */}
        {showViewModal && viewPost && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750 }}>
              <div className="modal-header">
                <h3 className="modal-title">{viewPost.title}</h3>
                <button className="modal-close" onClick={() => setShowViewModal(false)}>
                  <HiOutlineX />
                </button>
              </div>
              <div className="modal-body">
                {viewPost.cover_image_url && (
                  <div style={{
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    marginBottom: '1.5rem',
                    maxHeight: 300,
                  }}>
                    <img
                      src={viewPost.cover_image_url}
                      alt={viewPost.title}
                      style={{ width: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div className="blog-card-meta" style={{ marginBottom: '1.5rem' }}>
                  <span className="blog-meta-item">
                    <HiOutlineUser size={14} />
                    {viewPost.author_name || 'Staff'}
                  </span>
                  <span className="blog-meta-item">
                    <HiOutlineCalendar size={14} />
                    {format(new Date(viewPost.created_at), 'dd MMM yyyy, hh:mm a')}
                  </span>
                </div>
                <div className="blog-view-content">
                  {viewPost.content.split('\n').map((paragraph, i) => (
                    <p key={i} style={{ marginBottom: '0.75rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PrintSection>
  );
};

export default SchoolBlog;

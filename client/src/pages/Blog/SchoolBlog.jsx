import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineX,
  HiOutlineSave,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineSparkles,
  HiOutlineSearch,
} from 'react-icons/hi';
import { format } from 'date-fns';

const SchoolBlog = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [viewPost, setViewPost] = useState(null);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ title: '', content: '', coverImageUrl: '' });
  const [saving, setSaving] = useState(false);
  const [generateTopic, setGenerateTopic] = useState('');
  const [generating, setGenerating] = useState(false);

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

  // ── Auto-generate blog post ────────────────────────────────
  const handleGenerate = async () => {
    if (!generateTopic.trim()) {
      toast.error('Please enter a topic to search');
      return;
    }

    setGenerating(true);
    try {
      const res = await api.post('/blog/generate', { topic: generateTopic.trim() });
      const generated = res.data.data;

      // Pre-fill the create form with generated content
      setForm({
        title: generated.title,
        content: generated.content,
        coverImageUrl: generated.coverImageUrl || '',
      });

      setShowGenerateModal(false);
      setGenerateTopic('');
      setEditId(null);
      setShowModal(true);

      toast.success(`Blog generated from ${generated.source}! ✨ Review and publish.`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate blog post. Try a different topic.');
    } finally {
      setGenerating(false);
    }
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
      <div className="animate-fade-in">
        <div className="page-header">
          <div className="page-header-info">
            <h1>School Blog</h1>
            <p>News, announcements, and updates from your school</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-accent" onClick={() => setShowGenerateModal(true)}>
              <HiOutlineSparkles /> Auto Generate
            </button>
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
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-accent" onClick={() => setShowGenerateModal(true)}>
                  <HiOutlineSparkles /> Auto Generate from Topic
                </button>
                <button className="btn btn-primary" onClick={openCreate}>
                  <HiOutlinePlus /> Write Manually
                </button>
              </div>
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

        {/* ── Auto Generate Modal ─────────────────────────────── */}
        {showGenerateModal && (
          <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
              <div className="modal-header">
                <h3 className="modal-title">
                  <HiOutlineSparkles style={{ color: 'var(--accent-400)' }} /> Auto Generate Blog Post
                </h3>
                <button className="modal-close" onClick={() => setShowGenerateModal(false)}>
                  <HiOutlineX />
                </button>
              </div>
              <div className="modal-body">
                <div style={{
                  padding: '1rem',
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}>
                  💡 Enter any topic and we'll search the internet to automatically generate a complete blog post for your school. You can review and edit before publishing.
                </div>

                <div className="form-group">
                  <label className="form-label">Topic / Subject *</label>
                  <input
                    id="generate-topic"
                    className="form-input"
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                    placeholder="e.g., Importance of Reading, Solar System, Republic Day, Healthy Eating..."
                    autoFocus
                  />
                  <p className="form-help">
                    Try topics like: Science experiments, Indian independence, Mathematics in daily life, Water conservation
                  </p>
                </div>

                {generating && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '1rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-md)',
                    marginTop: '1rem',
                  }}>
                    <div className="spinner" style={{ width: 24, height: 24 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        Searching & generating...
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Finding content about "{generateTopic}"
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowGenerateModal(false)}
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  id="generate-blog"
                  className="btn btn-accent"
                  onClick={handleGenerate}
                  disabled={generating || !generateTopic.trim()}
                >
                  <HiOutlineSearch /> {generating ? 'Generating...' : 'Search & Generate'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Create/Edit Modal ───────────────────────────────── */}
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

        {/* ── View Post Modal ─────────────────────────────────── */}
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
  );
};

export default SchoolBlog;

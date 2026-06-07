const supabase = require('../config/supabase');

// @desc    Get all blog posts for the user's school
// @route   GET /api/blog
// @access  Auth (All Staff)
exports.getBlogPosts = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('school_id', req.user.schoolId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: data || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single blog post
// @route   GET /api/blog/:id
// @access  Auth (All Staff)
exports.getBlogPost = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new blog post
// @route   POST /api/blog
// @access  Auth (All Staff)
exports.createBlogPost = async (req, res) => {
  try {
    const { title, content, coverImageUrl, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        school_id: req.user.schoolId,
        title,
        content,
        author_id: req.user.id,
        author_name: req.user.name,
        cover_image_url: coverImageUrl || '',
        is_published: isPublished !== undefined ? isPublished : true,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a blog post
// @route   PUT /api/blog/:id
// @access  Auth (All Staff)
exports.updateBlogPost = async (req, res) => {
  try {
    const { title, content, coverImageUrl, isPublished } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (coverImageUrl !== undefined) updateData.cover_image_url = coverImageUrl;
    if (isPublished !== undefined) updateData.is_published = isPublished;

    const { data, error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/blog/:id
// @access  Auth (All Staff)
exports.deleteBlogPost = async (req, res) => {
  try {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', req.params.id)
      .eq('school_id', req.user.schoolId);

    if (error) throw error;

    res.json({ success: true, message: 'Blog post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

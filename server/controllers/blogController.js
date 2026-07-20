const { sql } = require('../config/database');

// @desc    Get all blog posts for the user's school
// @route   GET /api/blog
// @access  Auth (All Staff)
exports.getBlogPosts = async (req, res) => {
  try {
    const result = await req.db.request()
      .query('SELECT * FROM blog_posts ORDER BY created_at DESC');

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single blog post
// @route   GET /api/blog/:id
// @access  Auth (All Staff)
exports.getBlogPost = async (req, res) => {
  try {
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('SELECT * FROM blog_posts WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
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

    const result = await req.db.request()
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('authorId', sql.UniqueIdentifier, req.user.id)
      .input('authorName', sql.NVarChar, req.user.name)
      .input('coverImageUrl', sql.NVarChar, coverImageUrl || '')
      .input('isPublished', sql.Bit, isPublished !== undefined ? isPublished : 1)
      .query(`
        INSERT INTO blog_posts (title, content, author_id, author_name, cover_image_url, is_published)
        OUTPUT INSERTED.*
        VALUES (@title, @content, @authorId, @authorName, @coverImageUrl, @isPublished)
      `);

    res.status(201).json({ success: true, data: result.recordset[0] });
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

    const request = req.db.request();
    let setClauses = [];

    if (title !== undefined) {
      setClauses.push('title = @title');
      request.input('title', sql.NVarChar, title);
    }
    if (content !== undefined) {
      setClauses.push('content = @content');
      request.input('content', sql.NVarChar, content);
    }
    if (coverImageUrl !== undefined) {
      setClauses.push('cover_image_url = @coverImageUrl');
      request.input('coverImageUrl', sql.NVarChar, coverImageUrl);
    }
    if (isPublished !== undefined) {
      setClauses.push('is_published = @isPublished');
      request.input('isPublished', sql.Bit, isPublished ? 1 : 0);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update' });
    }

    setClauses.push('updated_at = SYSDATETIMEOFFSET()');

    request.input('id', sql.UniqueIdentifier, req.params.id);

    const result = await request.query(`
      UPDATE blog_posts 
      SET ${setClauses.join(', ')} 
      OUTPUT INSERTED.* 
      WHERE id = @id
    `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a blog post
// @route   DELETE /api/blog/:id
// @access  Auth (All Staff)
exports.deleteBlogPost = async (req, res) => {
  try {
    const result = await req.db.request()
      .input('id', sql.UniqueIdentifier, req.params.id)
      .query('DELETE FROM blog_posts WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }

    res.json({ success: true, message: 'Blog post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── AI / Web Helpers ─────────────────────────────────────────

const fetchWithTimeout = (url, timeoutMs = 8000) => {
  return Promise.race([
    fetch(url).then(r => r.json()),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeoutMs)),
  ]);
};

const searchWikipedia = async (topic) => {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&srlimit=3&format=json&origin=*`;
    const searchData = await fetchWithTimeout(searchUrl);

    if (!searchData.query?.search?.length) return null;
    const pageTitle = searchData.query.search[0].title;

    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=extracts|pageimages&exintro=false&explaintext=true&exsectionformat=plain&pithumbsize=600&format=json&origin=*`;
    const extractData = await fetchWithTimeout(extractUrl);

    const pages = extractData.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page || page.missing !== undefined) return null;

    return {
      title: page.title,
      content: page.extract || '',
      imageUrl: page.thumbnail?.source || '',
    };
  } catch (err) {
    console.error('Wikipedia search error:', err.message);
    return null;
  }
};

const searchDuckDuckGo = async (topic) => {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(topic)}&format=json&no_html=1&skip_disambig=1`;
    const data = await fetchWithTimeout(url);

    const sections = [];
    if (data.Abstract) sections.push(data.Abstract);
    if (data.RelatedTopics) {
      data.RelatedTopics.slice(0, 8).forEach(rt => {
        if (rt.Text) sections.push(rt.Text);
      });
    }

    if (sections.length === 0) return null;

    return {
      title: data.Heading || topic,
      content: sections.join('\\n\\n'),
      imageUrl: data.Image ? `https://duckduckgo.com${data.Image}` : '',
    };
  } catch (err) {
    console.error('DuckDuckGo search error:', err.message);
    return null;
  }
};

const formatBlogContent = (topic, rawContent, source) => {
  let content = rawContent.trim();
  let paragraphs = content.split('\\n').filter(p => p.trim().length > 20);

  let result = [];
  let totalLen = 0;
  for (const para of paragraphs) {
    if (totalLen > 3000) break;
    result.push(para.trim());
    totalLen += para.length;
  }

  const intro = `This article explores the topic of "${topic}" — a subject of great interest for students, educators, and the wider school community.`;
  const body = result.join('\\n\\n');
  const outro = `\\n\\nWe hope this article helps our school community understand more about "${topic}". If you have questions or would like to discuss this topic further, please reach out to our staff.\\n\\nSource: ${source}`;

  return `${intro}\\n\\n${body}${outro}`;
};

// @desc    Auto-generate a blog post by searching online
// @route   POST /api/blog/generate
// @access  Auth (All Staff)
exports.generateBlogPost = async (req, res) => {
  try {
    const { topic } = req.body;

    if (!topic || topic.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please provide a topic to search for' });
    }

    const cleanTopic = topic.trim();
    let result = await searchWikipedia(cleanTopic);
    let source = 'Wikipedia';

    if (!result || result.content.length < 100) {
      result = await searchDuckDuckGo(cleanTopic);
      source = 'DuckDuckGo';
    }

    if (!result || result.content.length < 50) {
      return res.status(404).json({
        success: false,
        message: `Could not find enough content about "${cleanTopic}". Try a more specific or well-known topic.`,
      });
    }

    const blogContent = formatBlogContent(cleanTopic, result.content, source);
    const blogTitle = result.title || cleanTopic;

    res.json({
      success: true,
      data: {
        title: blogTitle,
        content: blogContent,
        coverImageUrl: result.imageUrl || '',
        source,
      },
    });
  } catch (error) {
    console.error('Blog generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate blog post. Please try again.' });
  }
};

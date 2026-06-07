const express = require('express');
const router = express.Router();
const {
  getBlogPosts, getBlogPost, createBlogPost, updateBlogPost, deleteBlogPost,
} = require('../controllers/blogController');
const { protect } = require('../middleware/auth');

// All routes require authentication, but no role check — all staff can use
router.get('/', protect, getBlogPosts);
router.get('/:id', protect, getBlogPost);
router.post('/', protect, createBlogPost);
router.put('/:id', protect, updateBlogPost);
router.delete('/:id', protect, deleteBlogPost);

module.exports = router;

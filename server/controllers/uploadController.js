const fs = require('fs');
const path = require('path');

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    
    // Write the file to disk
    fs.writeFileSync(filePath, file.buffer);

    // Assuming the server serves static files from the 'public' directory
    const publicUrl = `/uploads/${fileName}`;

    res.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

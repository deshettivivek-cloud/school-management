const whatsappService = require('../services/whatsappService');

exports.sendTestMessage = async (req, res) => {
  try {
    const { phone, template, messageType, text } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    let result;
    if (messageType === 'text') {
      if (!text) return res.status(400).json({ success: false, message: 'Text content is required' });
      result = await whatsappService.sendTextMessage(phone, text);
    } else {
      const templateName = template || 'hello_world';
      result = await whatsappService.sendTemplateMessage(phone, templateName, 'en_US', []);
    }
    
    if (result.success) {
      res.json({ success: true, message: 'Message sent successfully', data: result.data });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendBulkMessage = async (req, res) => {
  try {
    const { target, template, components, messageType, message } = req.body;
    
    if (!target) {
      return res.status(400).json({ success: false, message: 'Target is required' });
    }
    
    if (messageType === 'text' && !message) {
      return res.status(400).json({ success: false, message: 'Message content is required for text messages' });
    }
    if (messageType !== 'text' && !template) {
      return res.status(400).json({ success: false, message: 'Template name is required for template messages' });
    }

    let query = 'SELECT name, parent_phone FROM students WHERE is_active = 1';
    let params = [];

    if (target.type === 'class') {
      if (target.grade) {
        query += ' AND grade = ?';
        params.push(target.grade);
      }
      if (target.section) {
        query += ' AND section = ?';
        params.push(target.section);
      }
    } else if (target.type === 'specific_students' && target.studentIds && target.studentIds.length > 0) {
      const placeholders = target.studentIds.map(() => '?').join(',');
      query += ` AND id IN (${placeholders})`;
      params.push(...target.studentIds);
    } else if (target.type !== 'all_students') {
      return res.status(400).json({ success: false, message: 'Invalid target type' });
    }

    const [students] = await req.db.query(query, params);

    if (students.length === 0) {
      return res.status(404).json({ success: false, message: 'No students found matching target criteria' });
    }

    let successCount = 0;
    let failCount = 0;

    for (const student of students) {
      if (student.parent_phone) {
        try {
          if (messageType === 'text') {
            const personalizedMsg = message.replace(/__STUDENT_NAME__/g, student.name);
            await whatsappService.sendTextMessage(student.parent_phone, personalizedMsg);
            successCount++;
          } else {
            // Replace dynamic placeholders if present
            let personalizedComponents = [];
            if (components) {
              personalizedComponents = JSON.parse(JSON.stringify(components)); // Deep copy
              for (let comp of personalizedComponents) {
                if (comp.type === 'body' && comp.parameters) {
                  for (let param of comp.parameters) {
                    if (param.type === 'text' && param.text === '__STUDENT_NAME__') {
                      param.text = student.name;
                    }
                  }
                }
              }
            } else {
              // If no custom components provided, just send empty body components or generic ones
              personalizedComponents = [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: student.name }
                  ]
                }
              ];
            }
            await whatsappService.sendTemplateMessage(student.parent_phone, template, 'en_US', personalizedComponents);
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to send bulk message to ${student.parent_phone}:`, err);
          failCount++;
        }
      } else {
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `Messages sent. Success: ${successCount}, Failed: ${failCount}`
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


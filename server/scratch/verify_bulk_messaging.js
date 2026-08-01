require('dotenv').config();
const mysql = require('mysql2/promise');
const { sendBulkMessage, getCommunicationHistory } = require('../controllers/communicationController');
const { getSchoolPool } = require('../config/tenantPool');

async function testVerification() {
  console.log('=== STARTING BULK MESSAGING VERIFICATION ===\n');

  // Connect to tenant DB
  const tenantDbName = 'class16c_School_1';
  console.log(`Connecting to tenant DB: ${tenantDbName}...`);
  const schoolPool = await getSchoolPool(tenantDbName);

  // 1. Verify communication_logs table exists
  console.log('\n--- 1. Checking communication_logs table schema ---');
  const [columns] = await schoolPool.execute('DESCRIBE communication_logs');
  console.log('Columns in communication_logs:');
  columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));

  // 2. Ensure at least one active student exists with parent_phone
  console.log('\n--- 2. Checking/Inserting test student record ---');
  const [students] = await schoolPool.execute('SELECT * FROM students WHERE deleted_at IS NULL AND is_active = 1 LIMIT 1');
  let testStudent;

  if (students.length === 0) {
    console.log('Inserting test student...');
    const [insertResult] = await schoolPool.execute(`
      INSERT INTO students (id, admission_no, name, dob, gender, grade, parent_name, parent_phone, academic_year, is_active)
      VALUES (UUID(), 'ADM-TEST-001', 'Test Student', '2015-01-01', 'male', '10', 'Test Parent', '919876543210', '2025-2026', 1)
    `);
    const [newStudents] = await schoolPool.execute('SELECT * FROM students WHERE admission_no = ?', ['ADM-TEST-001']);
    testStudent = newStudents[0];
  } else {
    testStudent = students[0];
    // Ensure parent_phone is set
    if (!testStudent.parent_phone) {
      await schoolPool.execute('UPDATE students SET parent_phone = ? WHERE id = ?', ['919876543210', testStudent.id]);
      testStudent.parent_phone = '919876543210';
    }
  }
  console.log(`Test Student: ID=${testStudent.id}, Name="${testStudent.name}", Grade="${testStudent.grade}", Parent Phone="${testStudent.parent_phone}"`);

  // Fetch a real profile for mock user ID if available
  const [profiles] = await schoolPool.execute('SELECT id FROM profiles LIMIT 1');
  const realUserId = profiles.length > 0 ? profiles[0].id : null;

  // 3. Test SMS channel rejection
  console.log('\n--- 3. Testing SMS channel rejection ---');
  const mockReqSMS = {
    db: schoolPool,
    user: { id: realUserId, role: 'principal' },
    body: {
      targetFilter: 'All Students',
      channel: 'sms',
      messageText: 'Test SMS Message'
    }
  };

  let smsResData = null;
  const mockResSMS = {
    status: (code) => {
      return {
        json: (data) => {
          smsResData = { statusCode: code, ...data };
          return smsResData;
        }
      };
    },
    json: (data) => {
      smsResData = { statusCode: 200, ...data };
      return smsResData;
    }
  };

  await sendBulkMessage(mockReqSMS, mockResSMS);
  console.log('SMS Test Result:', JSON.stringify(smsResData, null, 2));

  // 4. Test WhatsApp bulk message send
  console.log('\n--- 4. Testing WhatsApp bulk message send ---');
  const mockReqWA = {
    db: schoolPool,
    user: { id: 'test-user-id', role: 'principal' },
    body: {
      targetFilter: 'All Students',
      channel: 'whatsapp',
      messageText: 'Hello parents! This is a test bulk broadcast notification from School Management System.'
    }
  };

  let waResData = null;
  const mockResWA = {
    status: (code) => {
      return {
        json: (data) => {
          waResData = { statusCode: code, ...data };
          return waResData;
        }
      };
    },
    json: (data) => {
      waResData = { statusCode: 200, ...data };
      return waResData;
    }
  };

  await sendBulkMessage(mockReqWA, mockResWA);
  console.log('WhatsApp Test Result:', JSON.stringify(waResData, null, 2));

  // 5. Verify created communication_logs row
  console.log('\n--- 5. Checking communication_logs table for newly inserted row ---');
  const [logs] = await schoolPool.execute('SELECT * FROM communication_logs ORDER BY created_at DESC LIMIT 1');
  console.log('Inserted Log Row:', JSON.stringify(logs[0], null, 2));

  // 6. Test getCommunicationHistory controller
  console.log('\n--- 6. Testing getCommunicationHistory controller ---');
  const mockReqHist = {
    db: schoolPool,
    query: { page: 1, limit: 5 }
  };
  let histResData = null;
  const mockResHist = {
    status: (code) => {
      return {
        json: (data) => {
          histResData = { statusCode: code, ...data };
          return histResData;
        }
      };
    },
    json: (data) => {
      histResData = { statusCode: 200, ...data };
      return histResData;
    }
  };

  await getCommunicationHistory(mockReqHist, mockResHist);
  console.log('History Test Result:', JSON.stringify(histResData, null, 2));

  console.log('\n=== VERIFICATION FINISHED ===');
  process.exit(0);
}

testVerification().catch(err => {
  console.error('Verification Error:', err);
  process.exit(1);
});

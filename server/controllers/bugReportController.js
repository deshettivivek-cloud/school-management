const bugReportRepo = require('../repositories/bugReportRepository');
const { logAuditAction } = require('../utils/auditLogger');

const submitBugReport = async (req, res, next) => {
  try {
    const { title, description, severity, page_url } = req.body;
    const reported_by = req.user.id;
    const reporter_name = req.user.name || req.user.email || 'User';

    const newId = await bugReportRepo.insertBugReport(req.db, {
      reported_by,
      reporter_name,
      page_url,
      title,
      description,
      severity,
    });

    const createdReport = await bugReportRepo.findBugReportById(req.db, newId);

    await logAuditAction(req, {
      action: 'CREATE_BUG_REPORT',
      resource_type: 'bug_report',
      resource_id: String(newId),
      new_values: { title, severity, page_url }
    });

    return res.status(201).json({
      success: true,
      message: 'Bug report submitted successfully',
      data: createdReport
    });
  } catch (error) {
    next(error);
  }
};

const getBugReports = async (req, res, next) => {
  try {
    const reports = await bugReportRepo.findAllBugReports(req.db);
    return res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

const updateBugReportStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existing = await bugReportRepo.findBugReportById(req.db, id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Bug report not found'
      });
    }

    await bugReportRepo.updateBugReportStatus(req.db, id, status);
    const updated = await bugReportRepo.findBugReportById(req.db, id);

    await logAuditAction(req, {
      action: 'UPDATE_BUG_REPORT_STATUS',
      resource_type: 'bug_report',
      resource_id: String(id),
      old_values: { status: existing.status },
      new_values: { status }
    });

    return res.json({
      success: true,
      message: 'Bug report status updated successfully',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitBugReport,
  getBugReports,
  updateBugReportStatus
};

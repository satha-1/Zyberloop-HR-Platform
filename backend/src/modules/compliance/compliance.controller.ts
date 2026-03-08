import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  ComplianceFilingType,
  ComplianceFilingPeriod,
  ComplianceFiling,
  CompliancePermit,
  ComplianceAuditReport,
  ComplianceAlert,
  ComplianceAutomationRule,
  ComplianceAsset,
} from './compliance.model';
import { dueDateService } from './services/dueDate.service';
import { complianceAssetService } from './services/asset.service';
import { complianceReportService } from './services/report.service';
import { complianceAlertsService } from './services/alerts.service';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

// ============================================================================
// DASHBOARD
// ============================================================================

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // Critical alerts (top 5)
    const criticalAlerts = await ComplianceAlert.find({
      resolved: false,
      severity: 'CRITICAL',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('entityId');

    // Upcoming filings (next 5)
    const upcomingFilings = await ComplianceFiling.find({
      status: { $in: ['DRAFT', 'PENDING'] },
      statutoryDueDate: { $gte: today },
    })
      .populate('filingTypeId')
      .populate('periodId')
      .sort({ statutoryDueDate: 1 })
      .limit(5);

    // Expiring permits (next 5)
    const expiringPermits = await CompliancePermit.find({
      status: { $in: ['ACTIVE', 'RENEWAL_IN_PROGRESS'] },
      expiresAt: { $gte: today },
    })
      .populate('employeeId', 'name employeeId')
      .sort({ expiresAt: 1 })
      .limit(5);

    // Metrics
    const filingsLast12Months = await ComplianceFiling.countDocuments({
      createdAt: { $gte: oneYearAgo },
    });

    const filedFilings = await ComplianceFiling.find({
      status: 'FILED',
      createdAt: { $gte: oneYearAgo },
    });

    let onTimeCount = 0;
    for (const filing of filedFilings) {
      if (filing.filedAt && filing.filedAt <= filing.statutoryDueDate) {
        onTimeCount++;
      }
    }

    const onTimeRatePct = filedFilings.length > 0 ? (onTimeCount / filedFilings.length) * 100 : 0;

    const receiptsStoredLast12Months = await ComplianceAsset.countDocuments({
      createdAt: { $gte: oneYearAgo },
      s3Key: { $regex: /compliance\/.*\/receipts/ },
    });

    res.json({
      success: true,
      data: {
        criticalAlerts,
        upcomingFilings,
        expiringPermits,
        metrics: {
          totalFilingsLast12Months: filingsLast12Months,
          onTimeRatePct: Math.round(onTimeRatePct * 100) / 100,
          receiptsStoredLast12Months,
        },
      },
    });
  } catch (e) {
    next(e);
  }
};

// ============================================================================
// FILING TYPES
// ============================================================================

export const getFilingTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await ComplianceFilingType.find({ isActive: true }).sort({ code: 1 });
    res.json({ success: true, data: types });
  } catch (e) {
    next(e);
  }
};

export const createFilingType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filingType = await ComplianceFilingType.create(req.body);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Compliance',
      resourceType: 'filing_type',
      resourceId: filingType._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: filingType });
  } catch (e) {
    next(e);
  }
};

export const updateFilingType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filingType = await ComplianceFilingType.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!filingType) throw new AppError(404, 'Filing type not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Compliance',
      resourceType: 'filing_type',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: filingType });
  } catch (e) {
    next(e);
  }
};

export const deleteFilingType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filingType = await ComplianceFilingType.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!filingType) throw new AppError(404, 'Filing type not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DELETE',
      module: 'Compliance',
      resourceType: 'filing_type',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, message: 'Filing type deactivated' });
  } catch (e) {
    next(e);
  }
};

// ============================================================================
// FILING PERIODS
// ============================================================================

export const ensurePeriod = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { year, month } = req.body;
    if (!year || !month) {
      throw new AppError(400, 'Year and month are required');
    }

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const label = `${monthNames[month - 1]} ${year}`;

    const period = await ComplianceFilingPeriod.findOneAndUpdate(
      { year, month },
      { year, month, label },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: period });
  } catch (e) {
    next(e);
  }
};

// ============================================================================
// FILINGS
// ============================================================================

export const getFilings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { typeId, status, year, month, q } = req.query;
    const query: any = {};

    if (typeId) query.filingTypeId = typeId;
    if (status && status !== 'all') query.status = status;
    if (year || month) {
      const periods = await ComplianceFilingPeriod.find({
        ...(year && { year: parseInt(year as string) }),
        ...(month && { month: parseInt(month as string) }),
      });
      query.periodId = { $in: periods.map((p) => p._id) };
    }
    if (q) {
      // Search in populated fields would require aggregation, simplified here
      query.$or = [{ notes: { $regex: q, $options: 'i' } }];
    }

    const filings = await ComplianceFiling.find(query)
      .populate('filingTypeId')
      .populate('periodId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('reportAssets')
      .populate('receiptAssets')
      .sort({ statutoryDueDate: -1 });

    res.json({ success: true, data: filings });
  } catch (e) {
    next(e);
  }
};

export const getFiling = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filing = await ComplianceFiling.findById(req.params.id)
      .populate('filingTypeId')
      .populate('periodId')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('reportAssets')
      .populate('receiptAssets');

    if (!filing) throw new AppError(404, 'Filing not found');
    res.json({ success: true, data: filing });
  } catch (e) {
    next(e);
  }
};

export const createFiling = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filingTypeId, periodId, amount, notes } = req.body;

    const filingType = await ComplianceFilingType.findById(filingTypeId);
    if (!filingType) throw new AppError(404, 'Filing type not found');

    const period = await ComplianceFilingPeriod.findById(periodId);
    if (!period) throw new AppError(404, 'Period not found');

    const statutoryDueDate = await dueDateService.computeStatutoryDueDate(
      filingType,
      period.year,
      period.month
    );
    const internalDueDate = await dueDateService.computeInternalDueDate(
      filingType,
      period.year,
      period.month
    );

    const filing = await ComplianceFiling.create({
      filingTypeId,
      periodId,
      statutoryDueDate,
      internalDueDate,
      amount: parseFloat(amount),
      status: 'PENDING',
      notes: notes || null,
      createdBy: req.user!.id,
    });

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Compliance',
      resourceType: 'filing',
      resourceId: filing._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({ success: true, data: filing });
  } catch (e) {
    next(e);
  }
};

export const updateFiling = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filing = await ComplianceFiling.findById(req.params.id);
    if (!filing) throw new AppError(404, 'Filing not found');

    if (filing.status === 'FILED') {
      throw new AppError(400, 'Cannot edit filed filing');
    }

    const updated = await ComplianceFiling.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.user!.id,
      },
      { new: true, runValidators: true }
    );

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Compliance',
      resourceType: 'filing',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

export const generateFilingReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const assetId = await complianceReportService.generateReportForFiling(
      req.params.id,
      new mongoose.Types.ObjectId(req.user!.id)
    );
    res.json({ success: true, data: { assetId } });
  } catch (e) {
    next(e);
  }
};

export const uploadFilingReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      throw new AppError(400, 'No file uploaded');
    }

    const filing = await ComplianceFiling.findById(req.params.id);
    if (!filing) throw new AppError(404, 'Filing not found');

    const asset = await complianceAssetService.uploadAsset({
      buffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      prefix: 'filings',
      entityId: req.params.id,
      createdBy: new mongoose.Types.ObjectId(req.user!.id),
      applyImmutability: true, // Receipts should be immutable
      retentionDays: 2555, // 7 years
    });

    filing.receiptAssets.push(asset._id);
    await filing.save();

    res.json({ success: true, data: asset });
  } catch (e) {
    next(e);
  }
};

export const markFilingFiled = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { filedAt, paymentReference } = req.body;
    const filing = await ComplianceFiling.findByIdAndUpdate(
      req.params.id,
      {
        status: 'FILED',
        filedAt: filedAt ? new Date(filedAt) : new Date(),
        paymentReference: paymentReference || null,
        updatedBy: req.user!.id,
      },
      { new: true }
    );

    if (!filing) throw new AppError(404, 'Filing not found');

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Compliance',
      resourceType: 'filing',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({ success: true, data: filing });
  } catch (e) {
    next(e);
  }
};

export const downloadAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const asset = await ComplianceAsset.findById(req.params.assetId);
    if (!asset) throw new AppError(404, 'Asset not found');

    const url = await complianceAssetService.getDownloadUrl(asset);
    res.json({ success: true, data: { url } });
  } catch (e) {
    next(e);
  }
};

export const recalculateFiling = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filing = await ComplianceFiling.findById(req.params.id)
      .populate('filingTypeId')
      .populate('periodId');

    if (!filing) throw new AppError(404, 'Filing not found');

    const filingType = filing.filingTypeId as any;
    const period = filing.periodId as any;

    const statutoryDueDate = await dueDateService.computeStatutoryDueDate(
      filingType,
      period.year,
      period.month
    );
    const internalDueDate = await dueDateService.computeInternalDueDate(
      filingType,
      period.year,
      period.month
    );

    const updated = await ComplianceFiling.findByIdAndUpdate(
      req.params.id,
      {
        statutoryDueDate,
        internalDueDate,
        updatedBy: req.user!.id,
      },
      { new: true }
    );

    res.json({ success: true, data: updated });
  } catch (e) {
    next(e);
  }
};

// ============================================================================
// PERMITS
// ============================================================================

export const getPermits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { expiringDays, q } = req.query;
    const query: any = {};

    if (expiringDays) {
      const days = parseInt(expiringDays as string);
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + days);
      query.expiresAt = { $lte: threshold };
    }

    if (q) {
      query.$or = [
        { permitType: { $regex: q, $options: 'i' } },
        { identifier: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
      ];
    }

    const permits = await CompliancePermit.find(query)
      .populate('employeeId', 'name employeeId email')
      .populate('ownerUserId', 'name email')
      .populate('documentAssets')
      .sort({ expiresAt: 1 });

    res.json({ success: true, data: permits });
  } catch (e) {
    next(e);
  }
};

export const getPermit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permit = await CompliancePermit.findById(req.params.id)
      .populate('employeeId', 'name employeeId email')
      .populate('ownerUserId', 'name email')
      .populate('documentAssets');

    if (!permit) throw new AppError(404, 'Permit not found');
    res.json({ success: true, data: permit });
  } catch (e) {
    next(e);
  }
};

export const createPermit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permit = await CompliancePermit.create(req.body);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Compliance',
      resourceType: 'permit',
      resourceId: permit._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: permit });
  } catch (e) {
    next(e);
  }
};

export const updatePermit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permit = await CompliancePermit.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!permit) throw new AppError(404, 'Permit not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Compliance',
      resourceType: 'permit',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: permit });
  } catch (e) {
    next(e);
  }
};

export const deletePermit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await CompliancePermit.findByIdAndDelete(req.params.id);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DELETE',
      module: 'Compliance',
      resourceType: 'permit',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, message: 'Permit deleted' });
  } catch (e) {
    next(e);
  }
};

export const uploadPermitDoc = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      throw new AppError(400, 'No file uploaded');
    }

    const permit = await CompliancePermit.findById(req.params.id);
    if (!permit) throw new AppError(404, 'Permit not found');

    const asset = await complianceAssetService.uploadAsset({
      buffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      prefix: 'permits',
      entityId: req.params.id,
      createdBy: new mongoose.Types.ObjectId(req.user!.id),
      applyImmutability: false,
    });

    permit.documentAssets.push(asset._id);
    await permit.save();

    res.json({ success: true, data: asset });
  } catch (e) {
    next(e);
  }
};

// ============================================================================
// AUDIT REPORTS
// ============================================================================

export const getAudits = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const audits = await ComplianceAuditReport.find()
      .populate('evidenceAssets')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: audits });
  } catch (e) {
    next(e);
  }
};

export const getAudit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const audit = await ComplianceAuditReport.findById(req.params.id).populate('evidenceAssets');
    if (!audit) throw new AppError(404, 'Audit report not found');
    res.json({ success: true, data: audit });
  } catch (e) {
    next(e);
  }
};

export const createAudit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const audit = await ComplianceAuditReport.create(req.body);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Compliance',
      resourceType: 'audit_report',
      resourceId: audit._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: audit });
  } catch (e) {
    next(e);
  }
};

export const updateAudit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const audit = await ComplianceAuditReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!audit) throw new AppError(404, 'Audit report not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Compliance',
      resourceType: 'audit_report',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: audit });
  } catch (e) {
    next(e);
  }
};

export const deleteAudit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ComplianceAuditReport.findByIdAndDelete(req.params.id);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DELETE',
      module: 'Compliance',
      resourceType: 'audit_report',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, message: 'Audit report deleted' });
  } catch (e) {
    next(e);
  }
};

export const uploadAuditEvidence = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      throw new AppError(400, 'No file uploaded');
    }

    const audit = await ComplianceAuditReport.findById(req.params.id);
    if (!audit) throw new AppError(404, 'Audit report not found');

    const asset = await complianceAssetService.uploadAsset({
      buffer: file.buffer,
      fileName: file.originalname,
      mimeType: file.mimetype,
      prefix: 'audits',
      entityId: req.params.id,
      createdBy: new mongoose.Types.ObjectId(req.user!.id),
      applyImmutability: false,
    });

    audit.evidenceAssets.push(asset._id);
    await audit.save();

    res.json({ success: true, data: asset });
  } catch (e) {
    next(e);
  }
};

export const generateComplianceReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // This is a placeholder - in production, generate a comprehensive PDF
    // For now, return a summary that can be used to generate the report
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const filings = await ComplianceFiling.find({ createdAt: { $gte: oneYearAgo } })
      .populate('filingTypeId')
      .populate('periodId');
    const permits = await CompliancePermit.find({ status: 'ACTIVE' }).populate('employeeId');
    const audits = await ComplianceAuditReport.find();

    // Generate a simple summary report asset
    const summaryText = `Compliance Report - Generated ${today.toLocaleDateString()}\n\n` +
      `Filings: ${filings.length}\n` +
      `Active Permits: ${permits.length}\n` +
      `Audit Reports: ${audits.length}\n`;

    const buffer = Buffer.from(summaryText, 'utf-8');
    const asset = await complianceAssetService.uploadAsset({
      buffer,
      fileName: `compliance-report-${today.toISOString().split('T')[0]}.txt`,
      mimeType: 'text/plain',
      prefix: 'audits',
      entityId: 'summary',
      createdBy: new mongoose.Types.ObjectId(req.user!.id),
      applyImmutability: true,
      retentionDays: 2555,
    });

    res.json({ success: true, data: { assetId: asset._id.toString() } });
  } catch (e) {
    next(e);
  }
};

// ============================================================================
// ALERTS
// ============================================================================

export const getAlerts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { severity, resolved } = req.query;
    const query: any = {};

    if (severity) query.severity = severity;
    if (resolved !== undefined) query.resolved = resolved === 'true';

    const alerts = await ComplianceAlert.find(query)
      .populate('entityId')
      .sort({ severity: 1, createdAt: -1 });

    res.json({ success: true, data: alerts });
  } catch (e) {
    next(e);
  }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await complianceAlertsService.resolveAlert(req.params.id);
    res.json({ success: true, message: 'Alert resolved' });
  } catch (e) {
    next(e);
  }
};

export const snoozeAlert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { until } = req.body;
    const alert = await ComplianceAlert.findByIdAndUpdate(
      req.params.id,
      { dueAt: until ? new Date(until) : null },
      { new: true }
    );
    if (!alert) throw new AppError(404, 'Alert not found');
    res.json({ success: true, data: alert });
  } catch (e) {
    next(e);
  }
};

// ============================================================================
// AUTOMATION RULES
// ============================================================================

export const getAutomations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const automations = await ComplianceAutomationRule.find().sort({ createdAt: -1 });
    res.json({ success: true, data: automations });
  } catch (e) {
    next(e);
  }
};

export const createAutomation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const automation = await ComplianceAutomationRule.create(req.body);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Compliance',
      resourceType: 'automation_rule',
      resourceId: automation._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: automation });
  } catch (e) {
    next(e);
  }
};

export const updateAutomation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const automation = await ComplianceAutomationRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!automation) throw new AppError(404, 'Automation rule not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Compliance',
      resourceType: 'automation_rule',
      resourceId: req.params.id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: automation });
  } catch (e) {
    next(e);
  }
};

export const toggleAutomation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const automation = await ComplianceAutomationRule.findById(req.params.id);
    if (!automation) throw new AppError(404, 'Automation rule not found');

    automation.active = !automation.active;
    await automation.save();

    res.json({ success: true, data: automation });
  } catch (e) {
    next(e);
  }
};

export const runAutomationNow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const automation = await ComplianceAutomationRule.findById(req.params.id);
    if (!automation) throw new AppError(404, 'Automation rule not found');

    // Placeholder: log a simulated run
    automation.lastRunAt = new Date();
    automation.lastRunStatus = 'SUCCESS';
    automation.lastRunLog = `Simulated run at ${new Date().toISOString()}. No actual RPA execution.`;
    await automation.save();

    res.json({ success: true, data: automation });
  } catch (e) {
    next(e);
  }
};

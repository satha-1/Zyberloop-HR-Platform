import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Requisition } from './requisition.model';
import { Candidate } from './candidate.model';
import { CandidateApplication } from './candidateApplication.model';
import { Employee } from '../employees/employee.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';
import { createNotification } from '../notifications/notification.service';
import { generateBudgetCode } from './budgetCode.service';
import { storageService } from '../documents/services/storage.service';

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getCandidateResumeKey(candidateId: string, originalName: string): string {
  const now = Date.now();
  const safeName = sanitizeFileName(originalName);
  return `candidates/${candidateId}/cv/${now}-${safeName}`;
}

async function resolveResumeUrl(candidate: any): Promise<string | undefined> {
  if (candidate?.resumeStorageKey) {
    return storageService.getPresignedUrl(candidate.resumeStorageKey);
  }
  return candidate?.resumeUrl;
}

// Helper function to map application status to pipeline stage
function mapStatusToPipelineStage(status: string): string {
  const statusMap: Record<string, string> = {
    'APPLIED': 'review',
    'REVIEW': 'review',
    'SCREENING': 'screen',
    'ASSESSMENT': 'assessment',
    'INTERVIEW': 'hiringManagerInterview',
    'HIRING_MANAGER_INTERVIEW': 'hiringManagerInterview',
    'PRE_EMPLOYMENT_CHECK': 'preEmploymentCheck',
    'EMPLOYMENT_AGREEMENT': 'employmentAgreement',
    'OFFERED': 'offer',
    'OFFER': 'offer',
    'BACKGROUND_CHECK': 'backgroundCheck',
    'READY_FOR_HIRE': 'readyForHire',
    'HIRED': 'readyForHire',
  };
  return statusMap[status] || 'review';
}

// Helper function to calculate pipeline counts for a requisition
async function calculatePipelineCounts(requisitionId: mongoose.Types.ObjectId) {
  const applications = await CandidateApplication.find({ requisitionId }).lean();
  
  const counts = {
    review: 0,
    screen: 0,
    assessment: 0,
    hiringManagerInterview: 0,
    preEmploymentCheck: 0,
    employmentAgreement: 0,
    offer: 0,
    backgroundCheck: 0,
    readyForHire: 0,
  };

  applications.forEach((app: any) => {
    const stage = mapStatusToPipelineStage(app.status);
    if (counts.hasOwnProperty(stage)) {
      (counts as any)[stage]++;
    }
  });

  return counts;
}

export const getRequisitions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { 
      status, 
      department, 
      view, 
      location, 
      hiringManagerId,
      page = '1',
      pageSize = '50'
    } = req.query;
    
    const query: any = {};

    // Map frontend status values to backend enum values
    if (status && status !== 'all' && status !== 'undefined') {
      if (status === 'open') {
        query.status = { $nin: ['CLOSED', 'REJECTED'] };
      } else if (status === 'closed') {
        query.status = 'CLOSED';
      } else if (status === 'draft') {
        query.status = 'DRAFT';
      } else {
        query.status = status;
      }
    }

    if (department && department !== 'all' && department !== 'undefined') {
      if (mongoose.Types.ObjectId.isValid(department as string)) {
        query.departmentId = new mongoose.Types.ObjectId(department as string);
      }
    }

    if (location && location !== 'all') {
      query.location = new RegExp(location as string, 'i');
    }

    if (hiringManagerId && hiringManagerId !== 'all') {
      if (mongoose.Types.ObjectId.isValid(hiringManagerId as string)) {
        query.hiringManagerId = new mongoose.Types.ObjectId(hiringManagerId as string);
      }
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limit = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * limit;

    // Build sort based on view
    let sort: any = { createdAt: -1 };
    if (view === 'byHiringManager') {
      sort = { hiringManagerName: 1, createdAt: -1 };
    } else if (view === 'byLocation') {
      sort = { location: 1, createdAt: -1 };
    }

    const [requisitions, totalCount] = await Promise.all([
      Requisition.find(query)
        .populate({
          path: 'departmentId',
          select: 'name code',
          strictPopulate: false,
        })
        .populate({
          path: 'createdBy',
          select: 'name email',
          strictPopulate: false,
        })
        .populate({
          path: 'hiringManagerId',
          select: 'firstName lastName grade',
          strictPopulate: false,
        })
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Requisition.countDocuments(query),
    ]);

    // Get candidate counts and pipeline counts
    const requisitionsWithCounts = await Promise.all(
      requisitions.map(async (reqItem: any) => {
        const candidateCount = await CandidateApplication.countDocuments({
          requisitionId: reqItem._id,
        });
        const pipelineCounts = await calculatePipelineCounts(reqItem._id);

        // Populate hiring manager info if not already set
        let hiringManagerName = reqItem.hiringManagerName;
        let hiringManagerTitle = reqItem.hiringManagerTitle;
        
        if (!hiringManagerName && reqItem.hiringManagerId) {
          const manager = reqItem.hiringManagerId;
          if (manager && typeof manager === 'object') {
            hiringManagerName = `${manager.firstName || ''} ${manager.lastName || ''}`.trim();
            hiringManagerTitle = manager.grade || '';
          }
        }

        // Fallback to createdBy if no hiring manager
        if (!hiringManagerName && reqItem.createdBy) {
          const creator = reqItem.createdBy;
          if (creator && typeof creator === 'object') {
            hiringManagerName = creator.name || creator.email || 'N/A';
            hiringManagerTitle = '';
          }
        }

        return {
          ...reqItem,
          id: reqItem._id.toString(),
          candidates: candidateCount,
          pipelineCounts,
          hiringManagerName: hiringManagerName || 'N/A',
          hiringManagerTitle: hiringManagerTitle || '',
        };
      })
    );

    res.json({
      success: true,
      data: requisitionsWithCounts,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching requisitions:', error);
    next(error);
  }
};

export const getRequisitionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const requisition = await Requisition.findById(id)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name email')
      .populate('hiringManagerId', 'firstName lastName grade')
      .lean();

    if (!requisition) {
      throw new AppError(404, 'Requisition not found');
    }

    const candidateCount = await CandidateApplication.countDocuments({
      requisitionId: id,
    });

    const pipelineCounts = await calculatePipelineCounts(new mongoose.Types.ObjectId(id));

    // Populate hiring manager info if not already set
    let hiringManagerName = (requisition as any).hiringManagerName;
    let hiringManagerTitle = (requisition as any).hiringManagerTitle;
    
    if (!hiringManagerName && (requisition as any).hiringManagerId) {
      const manager = (requisition as any).hiringManagerId;
      if (manager && typeof manager === 'object') {
        hiringManagerName = `${manager.firstName || ''} ${manager.lastName || ''}`.trim();
        hiringManagerTitle = manager.grade || '';
      }
    }

    res.json({
      success: true,
      data: {
        ...requisition,
        id: (requisition as any)._id.toString(),
        candidates: candidateCount,
        pipelineCounts,
        hiringManagerName: hiringManagerName || 'N/A',
        hiringManagerTitle: hiringManagerTitle || '',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPublicRequisition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const requisition = await Requisition.findById(id)
      .populate('departmentId', 'name code')
      .lean();

    if (!requisition) {
      throw new AppError(404, 'Job posting not found');
    }

    // Only allow viewing PUBLISHED requisitions on the public portal
    // This ensures only approved and published jobs are visible to candidates
    if (requisition.status !== 'PUBLISHED') {
      throw new AppError(404, 'Job posting is not available. This position may not be published yet or has been closed.');
    }

    res.json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    console.error('Error fetching public requisition:', error);
    next(error);
  }
};

export const createRequisition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Auto-generate budget code if not provided
    let budgetCode = req.body.budgetCode;
    if (!budgetCode || budgetCode.trim() === '') {
      budgetCode = await generateBudgetCode();
    }

    const requisition = new Requisition({
      ...req.body,
      budgetCode,
      createdBy: req.user!.id,
    });
    await requisition.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Recruitment',
      resourceType: 'requisition',
      resourceId: requisition._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequisition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const requisition = await Requisition.findById(id);
    if (!requisition) {
      throw new AppError(404, 'Requisition not found');
    }

    // Only allow editing if status is DRAFT or MANAGER_APPROVED
    if (requisition.status !== 'DRAFT' && requisition.status !== 'MANAGER_APPROVED') {
      throw new AppError(400, 'Cannot edit requisition in current status. Only DRAFT and MANAGER_APPROVED requisitions can be edited.');
    }

    // Update fields
    Object.keys(updateData).forEach((key) => {
      if (key !== 'status' && key !== 'createdBy' && key !== '_id') {
        (requisition as any)[key] = updateData[key];
      }
    });

    await requisition.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Recruitment',
      resourceType: 'requisition',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRequisitionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const requisition = await Requisition.findById(id);
    if (!requisition) {
      throw new AppError(404, 'Requisition not found');
    }

    // Business logic: Set budget hold flag when manager approves
    if (status === 'MANAGER_APPROVED') {
      requisition.budgetHoldFlag = true;
    }

    requisition.status = status;
    await requisition.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Recruitment',
      resourceType: 'requisition',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/recruitment/approvals/pending
export const getPendingApprovals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get requisitions that need approval (DRAFT for managers, MANAGER_APPROVED for HR)
    const userRoles = req.user!.roles || [];
    const isManager = userRoles.some((r: string) => ['MANAGER', 'ADMIN'].includes(r));
    const isHR = userRoles.some((r: string) => ['HR_ADMIN', 'ADMIN'].includes(r));

    let statusFilter: string[] = [];
    if (isHR) {
      // HR can see both DRAFT (for reference) and MANAGER_APPROVED (to publish)
      statusFilter = ['DRAFT', 'MANAGER_APPROVED'];
    } else if (isManager) {
      // Managers can see DRAFT requisitions to approve
      statusFilter = ['DRAFT'];
    } else {
      // Others see nothing
      statusFilter = [];
    }

    const requisitions = await Requisition.find({
      status: { $in: statusFilter },
    })
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name email')
      .populate('hiringManagerId', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: requisitions.map((req: any) => ({
        _id: req._id,
        id: req._id.toString(),
        title: req.title,
        department: req.departmentId ? {
          id: req.departmentId._id.toString(),
          name: req.departmentId.name,
          code: req.departmentId.code,
        } : null,
        location: req.location,
        type: req.type,
        status: req.status,
        budgetCode: req.budgetCode,
        estimatedSalaryBand: req.estimatedSalaryBand,
        createdBy: req.createdBy ? {
          id: req.createdBy._id.toString(),
          name: req.createdBy.name || req.createdBy.email,
        } : null,
        hiringManager: req.hiringManagerId ? {
          id: req.hiringManagerId._id.toString(),
          name: `${req.hiringManagerId.firstName || ''} ${req.hiringManagerId.lastName || ''}`.trim(),
          code: req.hiringManagerId.employeeCode,
        } : null,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/recruitment/requisitions/:id/approve
export const approveRequisition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRoles = req.user!.roles || [];
    const isManager = userRoles.some((r: string) => ['MANAGER', 'ADMIN'].includes(r));

    if (!isManager) {
      throw new AppError(403, 'Only managers can approve requisitions');
    }

    const requisition = await Requisition.findById(id);
    if (!requisition) {
      throw new AppError(404, 'Requisition not found');
    }

    if (requisition.status !== 'DRAFT') {
      throw new AppError(400, `Cannot approve requisition in status: ${requisition.status}. Only DRAFT requisitions can be approved.`);
    }

    requisition.status = 'MANAGER_APPROVED';
    requisition.budgetHoldFlag = true;
    await requisition.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'APPROVE',
      module: 'Recruitment',
      resourceType: 'requisition',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/recruitment/requisitions/:id/publish
export const publishRequisition = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userRoles = req.user!.roles || [];
    const isHR = userRoles.some((r: string) => ['HR_ADMIN', 'ADMIN'].includes(r));

    if (!isHR) {
      throw new AppError(403, 'Only HR admins can publish requisitions');
    }

    const requisition = await Requisition.findById(id);
    if (!requisition) {
      throw new AppError(404, 'Requisition not found');
    }

    if (requisition.status !== 'MANAGER_APPROVED') {
      throw new AppError(400, `Cannot publish requisition in status: ${requisition.status}. Only MANAGER_APPROVED requisitions can be published.`);
    }

    requisition.status = 'PUBLISHED';
    await requisition.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'PUBLISH',
      module: 'Recruitment',
      resourceType: 'requisition',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: requisition,
    });
  } catch (error) {
    next(error);
  }
};

export const getCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requisitionId } = req.query;
    const query: any = {};

    if (requisitionId) {
      query.requisitionId = requisitionId;
    }

    const applications = await CandidateApplication.find(query)
      .populate('candidateId')
      .populate('requisitionId', 'title departmentId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: applications.map((app) => ({
        id: app._id.toString(),
        _id: app._id.toString(),
        name: (app.candidateId as any)?.fullName || 'N/A',
        email: (app.candidateId as any)?.email || 'N/A',
        phone: (app.candidateId as any)?.phone || 'N/A',
        requisition_id: (app.requisitionId as any)?._id?.toString() || app.requisitionId?.toString() || '',
        requisitionId: (app.requisitionId as any)?._id?.toString() || app.requisitionId?.toString() || '',
        position: (app.requisitionId as any)?.title || 'N/A',
        status: app.status,
        skill_match: app.skillMatch || 0,
        skillMatch: app.skillMatch || 0,
        experience_match: app.experienceMatch || 0,
        experienceMatch: app.experienceMatch || 0,
        candidateId: (app.candidateId as any)?._id?.toString() || '',
        hasResume: Boolean((app.candidateId as any)?.resumeStorageKey || (app.candidateId as any)?.resumeUrl),
        applied_date: app.createdAt?.toISOString() || new Date().toISOString(),
        appliedDate: app.createdAt?.toISOString() || new Date().toISOString(),
        createdAt: app.createdAt?.toISOString() || new Date().toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getCandidateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const application = await CandidateApplication.findById(id)
      .populate('candidateId')
      .populate('requisitionId');

    if (!application) {
      throw new AppError(404, 'Candidate application not found');
    }

    const candidate = application.candidateId as any;
    const requisition = application.requisitionId as any;
    const resumeUrl = await resolveResumeUrl(candidate);

    res.json({
      success: true,
      data: {
        id: application._id.toString(),
        _id: application._id.toString(),
        status: application.status,
        source: application.source,
        matchScore: application.matchScore,
        skillMatch: application.skillMatch,
        experienceMatch: application.experienceMatch,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        interviewHistory: application.interviewHistory || [],
        candidate: candidate
          ? {
              id: candidate._id?.toString(),
              fullName: candidate.fullName,
              email: candidate.email,
              phone: candidate.phone,
              currentCompany: candidate.currentCompany,
              experienceYears: candidate.experienceYears,
              notes: candidate.notes,
              resumeFileName: candidate.resumeFileName,
              resumeMimeType: candidate.resumeMimeType,
              resumeFileSize: candidate.resumeFileSize,
              hasResume: Boolean(candidate.resumeStorageKey || candidate.resumeUrl),
              resumeUrl,
            }
          : null,
        requisition: requisition
          ? {
              id: requisition._id?.toString(),
              title: requisition.title,
              location: requisition.location,
              type: requisition.type,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCandidateCvUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const application = await CandidateApplication.findById(id).populate('candidateId');

    if (!application) {
      throw new AppError(404, 'Candidate application not found');
    }

    const candidate = application.candidateId as any;
    if (!candidate) {
      throw new AppError(404, 'Candidate not found');
    }

    const url = await resolveResumeUrl(candidate);
    if (!url) {
      throw new AppError(404, 'CV/Resume not found');
    }

    res.json({
      success: true,
      data: {
        url,
        fileName: candidate.resumeFileName || candidate.resumeUrl || 'resume',
        mimeType: candidate.resumeMimeType || 'application/octet-stream',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCandidateApplication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requisitionId, fullName, email, phone, experienceYears, currentCompany, coverLetter } = req.body;

    // Create or find candidate
    let candidate = await Candidate.findOne({ email: email.toLowerCase() });
    if (!candidate) {
      candidate = new Candidate({
        fullName,
        email: email.toLowerCase(),
        phone,
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
        currentCompany: currentCompany || undefined,
        notes: coverLetter || undefined,
        skills: [], // Can be extracted from resume later
      });
      await candidate.save();
    }

    // Handle resume file upload if present
    if (req.file?.buffer) {
      const storageKey = getCandidateResumeKey(candidate._id.toString(), req.file.originalname);
      await storageService.putObject(storageKey, req.file.buffer, req.file.mimetype);
      candidate.resumeStorageKey = storageKey;
      candidate.resumeUrl = undefined;
      candidate.resumeFileName = req.file.originalname;
      candidate.resumeMimeType = req.file.mimetype;
      candidate.resumeFileSize = req.file.size;
    } else if (req.body.resumeUrl) {
      candidate.resumeUrl = req.body.resumeUrl;
    }

    if (fullName) candidate.fullName = fullName;
    if (phone) candidate.phone = phone;
    if (experienceYears) candidate.experienceYears = parseInt(experienceYears);
    if (currentCompany) candidate.currentCompany = currentCompany;
    if (coverLetter) candidate.notes = coverLetter;
    await candidate.save();

    // Check if application already exists for this requisition
    const existingApplication = await CandidateApplication.findOne({
      candidateId: candidate._id,
      requisitionId,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'You have already applied for this position',
        },
      });
    }

    // Create application
    const application = new CandidateApplication({
      candidateId: candidate._id,
      requisitionId,
      source: 'PORTAL',
      status: 'APPLIED',
      // TODO: Calculate match scores
      skillMatch: 0,
      experienceMatch: 0,
      matchScore: 0,
    });
    await application.save();

    // Get requisition to find hiring manager
    const requisition = await Requisition.findById(requisitionId)
      .populate('hiringManagerId', 'userId')
      .lean();

    // Create notification for hiring manager if exists
    if (requisition?.hiringManagerId) {
      const manager = requisition.hiringManagerId as any;
      const managerUserId = manager.userId;
      
      if (managerUserId) {
        try {
          await createNotification({
            userId: managerUserId,
            type: 'NEW_CANDIDATE',
            title: 'New Candidate Application',
            message: `${fullName} applied for ${requisition.title}`,
            entityType: 'CANDIDATE',
            entityId: application._id,
          });
        } catch (notifError) {
          console.error('Failed to create notification:', notifError);
          // Don't fail the application creation if notification fails
        }
      }
    }

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Error creating candidate application:', error);
    next(error);
  }
};

export const checkApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { requisitionId, email } = req.query;

    if (!requisitionId || !email) {
      return res.status(400).json({
        success: false,
        error: { message: 'requisitionId and email are required' },
      });
    }

    // Find candidate by email
    const candidate = await Candidate.findOne({ email: (email as string).toLowerCase() });
    if (!candidate) {
      return res.json({
        success: true,
        data: { hasApplied: false, application: null },
      });
    }

    // Find application for this requisition
    const application = await CandidateApplication.findOne({
      candidateId: candidate._id,
      requisitionId,
    })
      .populate('candidateId', 'fullName email phone')
      .populate('requisitionId', 'title');

    res.json({
      success: true,
      data: {
        hasApplied: !!application,
        application: application || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateCandidateApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, interviewNotes, rating } = req.body;

    const application = await CandidateApplication.findById(id)
      .populate('candidateId')
      .populate('requisitionId');

    if (!application) {
      throw new AppError(404, 'Application not found');
    }

    application.status = status;

    // Add interview history if provided
    if (interviewNotes || rating) {
      application.interviewHistory.push({
        date: new Date(),
        interviewer: req.user!.name,
        notes: interviewNotes || '',
        rating: rating || 0,
      });
    }

    await application.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Recruitment',
      resourceType: 'candidate_application',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

// Get list of hiring managers (employees who have requisitions)
export const getHiringManagers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requisitions = await Requisition.find({
      hiringManagerId: { $exists: true, $ne: null },
    })
      .populate('hiringManagerId', 'firstName lastName grade')
      .select('hiringManagerId hiringManagerName hiringManagerTitle')
      .lean();

    const managerMap = new Map();
    
    requisitions.forEach((req: any) => {
      const managerId = req.hiringManagerId?._id?.toString() || req.hiringManagerId?.toString();
      if (managerId && !managerMap.has(managerId)) {
        const manager = req.hiringManagerId;
        managerMap.set(managerId, {
          id: managerId,
          name: req.hiringManagerName || `${manager?.firstName || ''} ${manager?.lastName || ''}`.trim() || 'N/A',
          title: req.hiringManagerTitle || manager?.grade || '',
        });
      }
    });

    res.json({
      success: true,
      data: Array.from(managerMap.values()),
    });
  } catch (error) {
    next(error);
  }
};

// Get list of unique locations
export const getLocations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const locations = await Requisition.distinct('location');
    res.json({
      success: true,
      data: locations.filter(loc => loc && loc.trim() !== ''),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/recruitment/generate-budget-code
export const generateBudgetCodeEndpoint = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const code = await generateBudgetCode();
    res.json({
      success: true,
      data: { code },
    });
  } catch (error) {
    next(error);
  }
};

// Get candidates for a specific requisition
export const getRequisitionCandidates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { page = '1', pageSize = '50' } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limit = parseInt(pageSize as string, 10);
    const skip = (pageNum - 1) * limit;

    const applications = await CandidateApplication.find({ requisitionId: id })
      .populate('candidateId')
      .populate('requisitionId', 'title departmentId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await CandidateApplication.countDocuments({ requisitionId: id });

    res.json({
      success: true,
      data: applications.map((app) => ({
        id: (app as any)._id.toString(),
        _id: (app as any)._id.toString(),
        name: ((app as any).candidateId as any)?.fullName || 'N/A',
        email: ((app as any).candidateId as any)?.email || 'N/A',
        phone: ((app as any).candidateId as any)?.phone || 'N/A',
        requisition_id: ((app as any).requisitionId as any)?._id?.toString() || '',
        requisitionId: ((app as any).requisitionId as any)?._id?.toString() || '',
        position: ((app as any).requisitionId as any)?.title || 'N/A',
        status: (app as any).status,
        skill_match: (app as any).skillMatch || 0,
        skillMatch: (app as any).skillMatch || 0,
        experience_match: (app as any).experienceMatch || 0,
        experienceMatch: (app as any).experienceMatch || 0,
        candidateId: ((app as any).candidateId as any)?._id?.toString() || '',
        hasResume: Boolean(((app as any).candidateId as any)?.resumeStorageKey || ((app as any).candidateId as any)?.resumeUrl),
        applied_date: (app as any).createdAt?.toISOString() || new Date().toISOString(),
        appliedDate: (app as any).createdAt?.toISOString() || new Date().toISOString(),
        createdAt: (app as any).createdAt?.toISOString() || new Date().toISOString(),
      })),
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

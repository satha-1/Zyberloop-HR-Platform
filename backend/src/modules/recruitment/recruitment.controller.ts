import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Requisition } from './requisition.model';
import { Candidate } from './candidate.model';
import { CandidateApplication } from './candidateApplication.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getRequisitions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, department } = req.query;
    const query: any = {};

    // Map frontend status values to backend enum values
    // For "open", show all non-closed/non-rejected requisitions
    if (status && status !== 'all' && status !== 'undefined') {
      if (status === 'open') {
        // Show all active requisitions (not closed or rejected)
        query.status = { $nin: ['CLOSED', 'REJECTED'] };
      } else if (status === 'closed') {
        query.status = 'CLOSED';
      } else if (status === 'draft') {
        query.status = 'DRAFT';
      } else {
        // Use the status as-is if it matches backend enum values
        query.status = status;
      }
    }

    console.log('Requisitions query:', { status, department, query });

    if (department && department !== 'all' && department !== 'undefined') {
      // Validate ObjectId format
      if (mongoose.Types.ObjectId.isValid(department as string)) {
        query.departmentId = new mongoose.Types.ObjectId(department as string);
      }
    }

    const requisitions = await Requisition.find(query)
      .populate({
        path: 'departmentId',
        select: 'name code',
        strictPopulate: false, // Don't throw error if department doesn't exist
      })
      .populate({
        path: 'createdBy',
        select: 'name email',
        strictPopulate: false, // Don't throw error if user doesn't exist
      })
      .sort({ createdAt: -1 })
      .lean(); // Use lean() for better performance

    console.log(`Found ${requisitions.length} requisitions`);

    // Get candidate counts
    const requisitionsWithCounts = await Promise.all(
      requisitions.map(async (reqItem: any) => {
        const candidateCount = await CandidateApplication.countDocuments({
          requisitionId: reqItem._id,
        });
        return {
          ...reqItem,
          id: reqItem._id.toString(),
          candidates: candidateCount,
        };
      })
    );

    res.json({
      success: true,
      data: requisitionsWithCounts,
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
      .populate('createdBy', 'name email');

    if (!requisition) {
      throw new AppError(404, 'Requisition not found');
    }

    const candidateCount = await CandidateApplication.countDocuments({
      requisitionId: id,
    });

    res.json({
      success: true,
      data: {
        ...requisition.toObject(),
        candidates: candidateCount,
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

    // Allow viewing requisitions that are not CLOSED or REJECTED
    // This allows admins to preview DRAFT and approval-stage requisitions
    // Only block CLOSED and REJECTED from public view
    if (requisition.status === 'CLOSED' || requisition.status === 'REJECTED') {
      throw new AppError(404, 'Job posting is no longer available');
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
    const requisition = new Requisition({
      ...req.body,
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
        status: app.status,
        skill_match: app.skillMatch || 0,
        skillMatch: app.skillMatch || 0,
        experience_match: app.experienceMatch || 0,
        experienceMatch: app.experienceMatch || 0,
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

    res.json({
      success: true,
      data: application,
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

    // Handle resume file upload if present
    let resumeUrl: string | undefined;
    if (req.file) {
      resumeUrl = `/uploads/candidate-resumes/${req.file.filename}`;
    } else if (req.body.resumeUrl) {
      resumeUrl = req.body.resumeUrl;
    }

    // Create or find candidate
    let candidate = await Candidate.findOne({ email: email.toLowerCase() });
    if (!candidate) {
      candidate = new Candidate({
        fullName,
        email: email.toLowerCase(),
        phone,
        resumeUrl,
        experienceYears: experienceYears ? parseInt(experienceYears) : 0,
        currentCompany: currentCompany || undefined,
        notes: coverLetter || undefined,
        skills: [], // Can be extracted from resume later
      });
      await candidate.save();
    } else {
      // Update existing candidate with new resume if provided
      if (resumeUrl) {
        candidate.resumeUrl = resumeUrl;
      }
      if (fullName) candidate.fullName = fullName;
      if (phone) candidate.phone = phone;
      if (experienceYears) candidate.experienceYears = parseInt(experienceYears);
      if (currentCompany) candidate.currentCompany = currentCompany;
      if (coverLetter) candidate.notes = coverLetter;
      await candidate.save();
    }

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

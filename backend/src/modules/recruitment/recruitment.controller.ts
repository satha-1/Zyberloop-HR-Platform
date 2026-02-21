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
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
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
        name: (app.candidateId as any).fullName,
        email: (app.candidateId as any).email,
        phone: (app.candidateId as any).phone,
        requisition_id: app.requisitionId.toString(),
        status: app.status,
        skill_match: app.skillMatch,
        experience_match: app.experienceMatch,
        applied_date: app.createdAt.toISOString(),
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
    const { requisitionId, ...candidateData } = req.body;

    // Create or find candidate
    let candidate = await Candidate.findOne({ email: candidateData.email });
    if (!candidate) {
      candidate = new Candidate(candidateData);
      await candidate.save();
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

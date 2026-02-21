import { Request, Response, NextFunction } from 'express';
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

    if (status && status !== 'all') {
      query.status = status;
    }

    if (department) {
      query.departmentId = department;
    }

    const requisitions = await Requisition.find(query)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Get candidate counts
    const requisitionsWithCounts = await Promise.all(
      requisitions.map(async (req) => {
        const candidateCount = await CandidateApplication.countDocuments({
          requisitionId: req._id,
        });
        return {
          ...req.toObject(),
          candidates: candidateCount,
        };
      })
    );

    res.json({
      success: true,
      data: requisitionsWithCounts,
    });
  } catch (error) {
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
      .populate('departmentId', 'name code');

    if (!requisition || requisition.status !== 'PUBLISHED') {
      throw new AppError(404, 'Job posting not found');
    }

    res.json({
      success: true,
      data: requisition,
    });
  } catch (error) {
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

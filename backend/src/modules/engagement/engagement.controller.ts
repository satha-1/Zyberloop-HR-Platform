import { Request, Response, NextFunction } from 'express';
import { Survey, SurveyResponse } from './engagement.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';

export const getSurveys = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const query: any = {};
    if (status) query.status = status;
    const surveys = await Survey.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: surveys });
  } catch (error) {
    next(error);
  }
};

export const createSurvey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const survey = new Survey({
      ...req.body,
      createdBy: req.user!.id,
    });
    await survey.save();
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Engagement',
      resourceType: 'survey',
      resourceId: survey._id.toString(),
      ipAddress: req.ip || 'unknown',
    });
    res.status(201).json({ success: true, data: survey });
  } catch (error) {
    next(error);
  }
};

export const updateSurvey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const survey = await Survey.findByIdAndUpdate(id, req.body, { new: true });
    if (!survey) throw new AppError(404, 'Survey not found');
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Engagement',
      resourceType: 'survey',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, data: survey });
  } catch (error) {
    next(error);
  }
};

export const deleteSurvey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await Survey.findByIdAndDelete(id);
    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'DELETE',
      module: 'Engagement',
      resourceType: 'survey',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
    res.json({ success: true, message: 'Survey deleted' });
  } catch (error) {
    next(error);
  }
};

export const getSurveyResponses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { surveyId } = req.query;
    const query: any = {};
    if (surveyId) query.surveyId = surveyId;
    const responses = await SurveyResponse.find(query)
      .populate('surveyId', 'title')
      .populate('employeeId', 'firstName lastName employeeCode');
    res.json({ success: true, data: responses });
  } catch (error) {
    next(error);
  }
};

export const submitSurveyResponse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { surveyId, employeeId, responses } = req.body;
    const response = new SurveyResponse({
      surveyId,
      employeeId,
      responses,
    });
    await response.save();
    res.status(201).json({ success: true, data: response });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Response already submitted for this survey');
    }
    next(error);
  }
};

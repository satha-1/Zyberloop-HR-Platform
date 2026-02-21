import { Template, ITemplate, TemplateStatus, DocType } from '../template.model';
import { AppError } from '../../../middlewares/errorHandler';
import mongoose from 'mongoose';

class TemplateService {
  /**
   * Create a new template (always starts as DRAFT)
   */
  async createTemplate(data: {
    tenantId?: mongoose.Types.ObjectId;
    docType: DocType;
    name: string;
    description?: string;
    tags?: string[];
    engine?: 'LIQUID_HTML' | 'HANDLEBARS_HTML' | 'DOCX';
    locale?: string;
    fallbackLocale?: string;
    content: string;
    variablesSchema?: Record<string, any>;
    createdBy: mongoose.Types.ObjectId;
  }): Promise<ITemplate> {
    const template = new Template({
      ...data,
      status: 'DRAFT',
      version: 1,
      locale: data.locale || 'en',
      engine: data.engine || 'HANDLEBARS_HTML',
      tags: data.tags || [],
      variablesSchema: data.variablesSchema || {},
    });

    return await template.save();
  }

  /**
   * Update template (only if DRAFT or IN_REVIEW)
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<{
      name: string;
      description: string;
      tags: string[];
      content: string;
      variablesSchema: Record<string, any>;
    }>
  ): Promise<ITemplate> {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    if (template.status === 'PUBLISHED' || template.status === 'DEPRECATED') {
      throw new AppError(400, 'Cannot update published or deprecated template');
    }

    Object.assign(template, updates);
    if (updates.content) {
      template.version += 1;
    }

    return await template.save();
  }

  /**
   * Submit template for review (DRAFT → IN_REVIEW)
   */
  async submitForReview(templateId: string): Promise<ITemplate> {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    if (template.status !== 'DRAFT') {
      throw new AppError(400, 'Only DRAFT templates can be submitted for review');
    }

    template.status = 'IN_REVIEW';
    return await template.save();
  }

  /**
   * Approve template (adds approval entry)
   */
  async approveTemplate(
    templateId: string,
    actorId: mongoose.Types.ObjectId,
    actorName: string,
    notes?: string
  ): Promise<ITemplate> {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    template.approvals.push({
      actorId,
      actorName,
      decision: 'APPROVED',
      notes,
      at: new Date(),
    });

    return await template.save();
  }

  /**
   * Publish template (creates new version, freezes template)
   */
  async publishTemplate(
    templateId: string,
    effectiveFrom?: Date,
    effectiveTo?: Date
  ): Promise<ITemplate> {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    if (template.status !== 'IN_REVIEW') {
      throw new AppError(400, 'Only IN_REVIEW templates can be published');
    }

    // Check if all required approvals are present
    const hasApproval = template.approvals.some((a) => a.decision === 'APPROVED');
    if (!hasApproval) {
      throw new AppError(400, 'Template must be approved before publishing');
    }

    // Create new published version
    const publishedTemplate = new Template({
      ...template.toObject(),
      _id: new mongoose.Types.ObjectId(),
      status: 'PUBLISHED',
      previousVersionId: template._id,
      effectiveFrom: effectiveFrom || new Date(),
      effectiveTo,
      publishedAt: new Date(),
    });

    // Deprecate old version if it was published
    if (template.status === 'PUBLISHED') {
      template.status = 'DEPRECATED';
      await template.save();
    }

    return await publishedTemplate.save();
  }

  /**
   * Deprecate template
   */
  async deprecateTemplate(templateId: string): Promise<ITemplate> {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    template.status = 'DEPRECATED';
    return await template.save();
  }

  /**
   * Resolve template version for generation
   */
  async resolveTemplateVersion(
    docType: DocType,
    locale: string,
    effectiveOn: Date = new Date(),
    tenantId?: mongoose.Types.ObjectId
  ): Promise<ITemplate | null> {
    // Find PUBLISHED template where effectiveFrom <= effectiveOn < effectiveTo
    const query: any = {
      docType,
      locale,
      status: 'PUBLISHED',
      effectiveFrom: { $lte: effectiveOn },
    };

    if (tenantId) {
      query.tenantId = tenantId;
    }

    // Try exact locale match first
    let template = await Template.findOne({
      ...query,
      $or: [
        { effectiveTo: { $gte: effectiveOn } },
        { effectiveTo: null },
      ],
    }).sort({ version: -1 });

    // If not found, try fallback locale
    if (!template) {
      const fallbackTemplate = await Template.findOne({
        docType,
        fallbackLocale: locale,
        status: 'PUBLISHED',
        effectiveFrom: { $lte: effectiveOn },
        $or: [
          { effectiveTo: { $gte: effectiveOn } },
          { effectiveTo: null },
        ],
      }).sort({ version: -1 });

      if (fallbackTemplate) {
        template = fallbackTemplate;
      }
    }

    // If still not found, get latest PUBLISHED version for this docType + locale
    if (!template) {
      template = await Template.findOne({
        docType,
        locale,
        status: 'PUBLISHED',
      }).sort({ version: -1 });
    }

    return template;
  }

  /**
   * Get templates with filters
   */
  async getTemplates(filters: {
    tenantId?: mongoose.Types.ObjectId;
    docType?: DocType;
    status?: TemplateStatus;
    locale?: string;
    search?: string;
  }): Promise<ITemplate[]> {
    const query: any = {};

    if (filters.tenantId) {
      query.tenantId = filters.tenantId;
    }
    if (filters.docType) {
      query.docType = filters.docType;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.locale) {
      query.locale = filters.locale;
    }
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    return await Template.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get template by ID
   */
  async getTemplateById(templateId: string): Promise<ITemplate | null> {
    return await Template.findById(templateId);
  }
}

export const templateService = new TemplateService();

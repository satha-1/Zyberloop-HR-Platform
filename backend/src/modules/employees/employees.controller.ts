import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Employee } from './employee.model';
import { EmployeeDocument } from './employeeDocument.model';
import { DocumentTemplate } from './documentTemplate.model';
import { GeneratedDocument } from './generatedDocument.model';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';

export const getEmployees = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, department, status } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (department && department !== 'undefined' && department !== 'null' && department.trim() !== '') {
      // Validate ObjectId format
      if (mongoose.Types.ObjectId.isValid(department)) {
        query.departmentId = department;
      }
    }

    // Only filter by status if explicitly provided and not empty
    // Convert status to lowercase to match enum values
    if (status && status !== 'undefined' && status !== 'null' && String(status).trim() !== '') {
      const statusValue = String(status).toLowerCase();
      // Map common status values to enum values
      if (['active', 'inactive', 'on_leave', 'terminated'].includes(statusValue)) {
        query.status = statusValue;
      }
    }

    // Debug logging (remove in production)
    console.log('Employee query params:', { search, department, status });
    console.log('Employee query:', JSON.stringify(query, null, 2));
    
    // First, check total count without filters for debugging
    const totalCount = await Employee.countDocuments({});
    console.log(`Total employees in database: ${totalCount}`);
    
    const employees = await Employee.find(query)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName employeeCode')
      .sort({ createdAt: -1 });

    console.log(`Found ${employees.length} employees matching query`);
    
    // If no employees found but there are employees in DB, log a sample
    if (employees.length === 0 && totalCount > 0) {
      const sampleEmployee = await Employee.findOne().lean();
      console.log('Sample employee from DB:', JSON.stringify(sampleEmployee, null, 2));
    }

    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    next(error);
  }
};

export const getEmployeeById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid employee ID format');
    }
    
    const employee = await Employee.findById(id)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName employeeCode');

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    console.log(`Employee found: ${employee.firstName} ${employee.lastName} (${employee.employeeCode})`);

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error fetching employee by ID:', error);
    next(error);
  }
};

export const createEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Validate required fields
    const { firstName, lastName, email, phone, grade, hireDate, salary, employeeCode } = req.body;
    
    if (!firstName || !lastName || !email || !phone || !grade || !hireDate || !salary) {
      throw new AppError(400, 'Missing required fields');
    }

    // Generate employee code if not provided
    let code = employeeCode;
    if (!code) {
      const lastEmployee = await Employee.findOne().sort({ createdAt: -1 });
      const lastNumber = lastEmployee?.employeeCode 
        ? parseInt(lastEmployee.employeeCode.replace('EMP', '')) || 0 
        : 0;
      code = `EMP${String(lastNumber + 1).padStart(5, '0')}`;
    }

    // Clean up employee data - remove empty strings and invalid ObjectIds
    const employeeData: any = {
      firstName,
      lastName,
      email,
      phone,
      grade,
      hireDate,
      salary: parseFloat(salary),
      employeeCode: code,
      status: req.body.status || 'active', // Explicitly set status, default to 'active'
    };

    // Add optional fields only if they have valid values
    if (req.body.dob) employeeData.dob = req.body.dob;
    if (req.body.address) employeeData.address = req.body.address;
    
    // Validate and add departmentId only if it's a valid ObjectId
    if (req.body.departmentId && req.body.departmentId !== 'undefined' && req.body.departmentId !== 'null' && req.body.departmentId.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(req.body.departmentId)) {
        employeeData.departmentId = req.body.departmentId;
      }
    }
    
    // Validate and add managerId only if it's a valid ObjectId
    if (req.body.managerId && req.body.managerId !== 'undefined' && req.body.managerId !== 'null' && req.body.managerId !== 'none' && req.body.managerId.trim() !== '') {
      if (mongoose.Types.ObjectId.isValid(req.body.managerId)) {
        employeeData.managerId = req.body.managerId;
      }
    }

    const employee = new Employee(employeeData);
    await employee.save();

    // Handle file uploads if any
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const documentPromises = files.map((file) => {
        const docType = req.body[`docType_${file.fieldname}`] || 'OTHER';
        return new EmployeeDocument({
          employeeId: employee._id,
          documentType: docType,
          fileName: file.originalname,
          filePath: file.path,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: req.user!.id,
        }).save();
      });
      await Promise.all(documentPromises);
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Employees',
      resourceType: 'employee',
      resourceId: employee._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName employeeCode');

    res.status(201).json({
      success: true,
      data: populatedEmployee,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Employee code or email already exists');
    }
    next(error);
  }
};

export const updateEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid employee ID format');
    }

    // Handle profile picture upload
    const updateData: any = { ...req.body };
    if (req.file) {
      updateData.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    }
    
    // Validate and handle departmentId
    if (updateData.departmentId !== undefined) {
      if (updateData.departmentId === '' || updateData.departmentId === 'null' || updateData.departmentId === 'none') {
        updateData.departmentId = null;
      } else if (updateData.departmentId && !mongoose.Types.ObjectId.isValid(updateData.departmentId)) {
        delete updateData.departmentId;
      }
    }
    
    // Validate and handle managerId
    if (updateData.managerId !== undefined) {
      if (updateData.managerId === '' || updateData.managerId === 'null' || updateData.managerId === 'none') {
        updateData.managerId = null;
      } else if (updateData.managerId && !mongoose.Types.ObjectId.isValid(updateData.managerId)) {
        delete updateData.managerId;
      }
    }

    const employee = await Employee.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('departmentId', 'name code')
      .populate('managerId', 'firstName lastName employeeCode');

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Employees',
      resourceType: 'employee',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByIdAndDelete(id);

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'DELETE',
      module: 'Employees',
      resourceType: 'employee',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Document Management
export const getEmployeeDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const documents = await EmployeeDocument.find({ employeeId: id, isActive: true })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadEmployeeDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { documentType } = req.body;
    const file = req.file;

    if (!file) {
      throw new AppError(400, 'No file uploaded');
    }

    if (!documentType) {
      throw new AppError(400, 'Document type is required');
    }

    const employee = await Employee.findById(id);
    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    const document = new EmployeeDocument({
      employeeId: id,
      documentType,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: req.user!.id,
    });

    await document.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPLOAD_DOCUMENT',
      module: 'Employees',
      resourceType: 'employee_document',
      resourceId: document._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadEmployeeDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { docId } = req.params;
    const document = await EmployeeDocument.findById(docId);

    if (!document) {
      throw new AppError(404, 'Document not found');
    }

    if (!fs.existsSync(document.filePath)) {
      throw new AppError(404, 'File not found on server');
    }

    res.download(document.filePath, document.fileName);
  } catch (error) {
    next(error);
  }
};

export const deleteEmployeeDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { docId } = req.params;
    const document = await EmployeeDocument.findById(docId);

    if (!document) {
      throw new AppError(404, 'Document not found');
    }

    document.isActive = false;
    await document.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'DELETE_DOCUMENT',
      module: 'Employees',
      resourceType: 'employee_document',
      resourceId: docId,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Document Generation
export const generateDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId, templateType, data } = req.body;

    const employee = await Employee.findById(employeeId)
      .populate('departmentId', 'name')
      .populate('managerId', 'firstName lastName');

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    let template = await DocumentTemplate.findOne({ type: templateType, isActive: true });
    
    if (!template) {
      // Create default template if not exists
      template = await createDefaultTemplate(templateType, req.user!.id);
    }

    // Replace placeholders
    let content = template.content;
    const replacements: Record<string, any> = {
      employeeName: `${employee.firstName} ${employee.lastName}`,
      designation: employee.grade,
      salary: employee.salary.toLocaleString(),
      joiningDate: new Date(employee.hireDate).toLocaleDateString(),
      department: (employee.departmentId as any)?.name || 'N/A',
      managerName: employee.managerId 
        ? `${(employee.managerId as any).firstName} ${(employee.managerId as any).lastName}`
        : 'N/A',
      ...data,
    };

    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(replacements[key]));
    });

    // Generate PDF using PDFKit
    const fileName = `${templateType}_${employee.employeeCode}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'uploads', 'generated-documents', fileName);
    
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add content to PDF
    doc.fontSize(16).text(template.name || templateType.replace('_', ' '), { align: 'center' });
    doc.moveDown(2);
    
    // Split content into paragraphs and add to PDF
    const paragraphs = content.split('\n\n');
    paragraphs.forEach((para) => {
      if (para.trim()) {
        doc.fontSize(12).text(para.trim(), { align: 'left' });
        doc.moveDown();
      }
    });

    doc.end();

    // Wait for PDF to be written
    await new Promise<void>((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    const generatedDoc = new GeneratedDocument({
      employeeId: employee._id,
      templateId: template._id,
      documentType: templateType,
      fileName,
      filePath,
      fileSize: fs.statSync(filePath).size,
      generatedData: replacements,
      generatedBy: req.user!.id,
    });

    await generatedDoc.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'GENERATE_DOCUMENT',
      module: 'Employees',
      resourceType: 'generated_document',
      resourceId: generatedDoc._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: generatedDoc,
      downloadUrl: `/api/v1/employees/documents/generated/${generatedDoc._id}/download`,
    });
  } catch (error) {
    next(error);
  }
};

async function createDefaultTemplate(type: string, userId: string) {
  const templates: Record<string, string> = {
    OFFER_LETTER: `Dear {{employeeName}},

We are pleased to offer you the position of {{designation}} in our {{department}} department.

Your starting salary will be ${{salary}} per month, effective from {{joiningDate}}.

We look forward to welcoming you to our team.

Best regards,
HR Department`,
    APPOINTMENT_LETTER: `Dear {{employeeName}},

This letter confirms your appointment as {{designation}} in the {{department}} department, effective {{joiningDate}}.

Your monthly salary is ${{salary}}.

Your reporting manager will be {{managerName}}.

Best regards,
HR Department`,
    WARNING_LETTER: `Dear {{employeeName}},

This is a formal warning regarding your conduct/performance.

Please take necessary corrective actions.

Best regards,
HR Department`,
    TERMINATION_LETTER: `Dear {{employeeName}},

This letter serves as notice of termination of your employment, effective immediately.

Best regards,
HR Department`,
    SALARY_INCREMENT_LETTER: `Dear {{employeeName}},

We are pleased to inform you of a salary increment.

Your new salary will be ${{salary}} per month, effective from {{joiningDate}}.

Best regards,
HR Department`,
  };

  const template = new DocumentTemplate({
    name: `${type.replace('_', ' ')} Template`,
    type: type as any,
    content: templates[type] || 'Template content',
    placeholders: Object.keys(templates[type]?.match(/{{(\w+)}}/g) || []).map((k) => k.replace(/[{}]/g, '')),
    createdBy: userId,
  });

  await template.save();
  return template;
}

// Template Management
export const getTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const templates = await DocumentTemplate.find()
      .populate('createdBy', 'name email')
      .sort({ type: 1 });
    res.json({
      success: true,
      data: templates,
    });
  } catch (error) {
    next(error);
  }
};

export const getTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const template = await DocumentTemplate.findById(id);
    if (!template) {
      throw new AppError(404, 'Template not found');
    }
    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const createTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, type, content, placeholders } = req.body;
    
    // Extract placeholders from content if not provided
    const extractedPlaceholders = placeholders || 
      (content.match(/{{(\w+)}}/g) || []).map((p: string) => p.replace(/[{}]/g, ''));

    const template = new DocumentTemplate({
      name,
      type,
      content,
      placeholders: extractedPlaceholders,
      createdBy: req.user!.id,
    });

    await template.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'CREATE',
      module: 'Employees',
      resourceType: 'document_template',
      resourceId: template._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: template,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(400, 'Template with this type already exists');
    }
    next(error);
  }
};

export const updateTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { content, placeholders, name, isActive } = req.body;
    
    const updateData: any = {};
    if (content !== undefined) {
      updateData.content = content;
      // Extract placeholders from content if not provided
      updateData.placeholders = placeholders || 
        (content.match(/{{(\w+)}}/g) || []).map((p: string) => p.replace(/[{}]/g, ''));
    }
    if (name !== undefined) updateData.name = name;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (content) {
      updateData.version = (await DocumentTemplate.findById(id))?.version || 0;
      updateData.version += 1;
    }

    const template = await DocumentTemplate.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!template) {
      throw new AppError(404, 'Template not found');
    }

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Employees',
      resourceType: 'document_template',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      data: template,
    });
  } catch (error) {
    next(error);
  }
};

export const previewDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId, templateType, data } = req.body;

    const employee = await Employee.findById(employeeId)
      .populate('departmentId', 'name')
      .populate('managerId', 'firstName lastName');

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    let template = await DocumentTemplate.findOne({ type: templateType, isActive: true });
    
    if (!template) {
      template = await createDefaultTemplate(templateType, req.user!.id);
    }

    // Replace placeholders
    let content = template.content;
    const replacements: Record<string, any> = {
      employeeName: `${employee.firstName} ${employee.lastName}`,
      designation: employee.grade,
      salary: employee.salary.toLocaleString(),
      joiningDate: new Date(employee.hireDate).toLocaleDateString(),
      department: (employee.departmentId as any)?.name || 'N/A',
      managerName: employee.managerId 
        ? `${(employee.managerId as any).firstName} ${(employee.managerId as any).lastName}`
        : 'N/A',
      ...data,
    };

    Object.keys(replacements).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, String(replacements[key]));
    });

    res.json({
      success: true,
      data: {
        content,
        templateName: template.name,
        placeholders: template.placeholders,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getGeneratedDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { employeeId } = req.params;
    const documents = await GeneratedDocument.find({ employeeId })
      .populate('templateId', 'name type')
      .populate('generatedBy', 'name email')
      .sort({ generatedAt: -1 });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadGeneratedDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { docId } = req.params;
    const document = await GeneratedDocument.findById(docId);

    if (!document) {
      throw new AppError(404, 'Document not found');
    }

    if (!fs.existsSync(document.filePath)) {
      throw new AppError(404, 'File not found on server');
    }

    res.download(document.filePath, document.fileName);
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { PayrollRun } from './payrollRun.model';
import { PayrollEntry } from './payrollEntry.model';
import { PayrollTemplate } from './payrollTemplate.model';
import { Employee } from '../employees/employee.model';
import { calculatePayroll } from './payroll.service';
import { AppError } from '../../middlewares/errorHandler';
import { createAuditLog } from '../logs/log.service';
import mongoose from 'mongoose';
import { generatePayrollRunHTML, generatePayrollRunPDF, generateEmployeePayslipHTML } from './payrollPdf.service';

export const getPayrollRuns = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, status, templateId, periodStart, periodEnd, page = 1, limit = 50 } = req.query;

    const query: any = {};

    if (search && typeof search === 'string') {
      query.runName = { $regex: search, $options: 'i' };
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (templateId && mongoose.Types.ObjectId.isValid(templateId as string)) {
      query.templateId = templateId;
    }

    if (periodStart) {
      query.periodStart = { $gte: new Date(periodStart as string) };
    }

    if (periodEnd) {
      query.periodEnd = { $lte: new Date(periodEnd as string) };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const runs = await PayrollRun.find(query)
      .populate('createdBy', 'name email')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await PayrollRun.countDocuments(query);

    res.json({
      success: true,
      data: runs.map((run) => ({
        id: run._id.toString(),
        _id: run._id.toString(),
        templateId: run.templateId ? (run.templateId as any)._id?.toString() || run.templateId.toString() : undefined,
        templateName: run.templateId ? ((run.templateId as any).name || undefined) : undefined,
        runName: run.runName,
        periodStart: run.periodStart.toISOString(),
        periodEnd: run.periodEnd.toISOString(),
        paymentDate: run.paymentDate?.toISOString() || run.periodEnd.toISOString(),
        status: run.status,
        notes: run.notes,
        totalGross: run.totalGross,
        totalNet: run.totalNet,
        totalDeductions: run.totalDeductions || 0,
        employeeCount: run.employeeCount,
        employeeLines: run.employeeLines || [],
        createdAt: run.createdAt.toISOString(),
        updatedAt: run.updatedAt.toISOString(),
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollRunById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid payroll run ID');
    }

    const run = await PayrollRun.findById(id)
      .populate('createdBy', 'name email')
      .populate('templateId', 'name');

    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    res.json({
      success: true,
      data: {
        id: run._id.toString(),
        _id: run._id.toString(),
        templateId: run.templateId ? (run.templateId as any)._id?.toString() || run.templateId.toString() : undefined,
        templateName: run.templateId ? ((run.templateId as any).name || undefined) : undefined,
        runName: run.runName,
        periodStart: run.periodStart.toISOString(),
        periodEnd: run.periodEnd.toISOString(),
        paymentDate: run.paymentDate?.toISOString() || run.periodEnd.toISOString(),
        status: run.status,
        notes: run.notes,
        totalGross: run.totalGross,
        totalNet: run.totalNet,
        totalDeductions: run.totalDeductions || 0,
        employeeCount: run.employeeCount,
        employeeLines: run.employeeLines || [],
        createdAt: run.createdAt.toISOString(),
        updatedAt: run.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createPayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateId, runName, periodStart, periodEnd, paymentDate, notes, employeeIds, employeeLines } = req.body;

    if (!runName || !periodStart || !periodEnd || !paymentDate) {
      throw new AppError(400, 'runName, periodStart, periodEnd, and paymentDate are required');
    }

    // Validate templateId if provided
    if (templateId && !mongoose.Types.ObjectId.isValid(templateId)) {
      throw new AppError(400, 'Invalid template ID');
    }

    const run = new PayrollRun({
      templateId: templateId || undefined,
      runName,
      periodStart: new Date(periodStart),
      periodEnd: new Date(periodEnd),
      paymentDate: new Date(paymentDate),
      status: 'draft',
      notes: notes || undefined,
      createdBy: req.user!.id,
      employeeLines: employeeLines || [],
      totalGross: 0,
      totalNet: 0,
      totalDeductions: 0,
      employeeCount: employeeLines?.length || 0,
    });

    // Calculate totals from employeeLines if provided
    if (employeeLines && Array.isArray(employeeLines)) {
      run.totalGross = employeeLines.reduce((sum: number, line: any) => sum + (line.grossPay || 0), 0);
      run.totalDeductions = employeeLines.reduce((sum: number, line: any) => sum + (line.totalDeductions || 0), 0);
      run.totalNet = employeeLines.reduce((sum: number, line: any) => sum + (line.netPay || 0), 0);
      run.employeeCount = employeeLines.length;
    }

    await run.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'CREATE',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: run._id.toString(),
      ipAddress: req.ip || 'unknown',
    });

    const populatedRun = await PayrollRun.findById(run._id)
      .populate('templateId', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: {
        id: run._id.toString(),
        templateId: run.templateId?.toString(),
        templateName: populatedRun?.templateId ? ((populatedRun.templateId as any).name || undefined) : undefined,
        runName: run.runName,
        periodStart: run.periodStart.toISOString(),
        periodEnd: run.periodEnd.toISOString(),
        paymentDate: run.paymentDate.toISOString(),
        status: run.status,
        notes: run.notes,
        totalGross: run.totalGross,
        totalNet: run.totalNet,
        totalDeductions: run.totalDeductions,
        employeeCount: run.employeeCount,
        employeeLines: run.employeeLines || [],
        createdAt: run.createdAt.toISOString(),
        updatedAt: run.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const calculatePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    await calculatePayroll(id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name,
      actorRoles: req.user!.roles,
      action: 'UPDATE',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Payroll calculated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const approvePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'hr' or 'finance'

    const run = await PayrollRun.findById(id);
    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    if (type === 'hr') {
      run.status = 'HR_APPROVED';
    } else if (type === 'finance') {
      run.status = 'FINANCE_APPROVED';
    }

    await run.save();

    res.json({
      success: true,
      data: run,
    });
  } catch (error) {
    next(error);
  }
};

export const finalizePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const run = await PayrollRun.findById(id);
    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    run.status = 'FINALIZED';
    await run.save();

    // TODO: Generate payslips and bank file

    res.json({
      success: true,
      message: 'Payroll finalized successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollEntries = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const entries = await PayrollEntry.find({ payrollRunId: id })
      .populate('employeeId', 'firstName lastName employeeCode departmentId');

    res.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid payroll run ID');
    }

    const run = await PayrollRun.findById(id);

    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    // Don't allow updates if locked or completed
    if (run.status === 'locked' || run.status === 'completed' || run.status === 'FINALIZED') {
      throw new AppError(403, 'Cannot update a locked or completed payroll run');
    }

    // Update allowed fields
    if (updates.runName) run.runName = updates.runName;
    if (updates.notes !== undefined) run.notes = updates.notes;
    if (updates.employeeLines) {
      run.employeeLines = updates.employeeLines;
      // Recalculate totals
      run.totalGross = updates.employeeLines.reduce((sum: number, line: any) => sum + (line.grossPay || 0), 0);
      run.totalDeductions = updates.employeeLines.reduce((sum: number, line: any) => sum + (line.totalDeductions || 0), 0);
      run.totalNet = updates.employeeLines.reduce((sum: number, line: any) => sum + (line.netPay || 0), 0);
      run.employeeCount = updates.employeeLines.length;
    }
    // Only allow period/payment date changes if not locked
    if (updates.periodStart && run.status !== 'locked') {
      run.periodStart = new Date(updates.periodStart);
    }
    if (updates.periodEnd && run.status !== 'locked') {
      run.periodEnd = new Date(updates.periodEnd);
    }
    if (updates.paymentDate && run.status !== 'locked') {
      run.paymentDate = new Date(updates.paymentDate);
    }

    await run.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    const populatedRun = await PayrollRun.findById(run._id)
      .populate('templateId', 'name')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      data: {
        id: run._id.toString(),
        templateId: run.templateId?.toString(),
        templateName: populatedRun?.templateId ? ((populatedRun.templateId as any).name || undefined) : undefined,
        runName: run.runName,
        periodStart: run.periodStart.toISOString(),
        periodEnd: run.periodEnd.toISOString(),
        paymentDate: run.paymentDate.toISOString(),
        status: run.status,
        notes: run.notes,
        totalGross: run.totalGross,
        totalNet: run.totalNet,
        totalDeductions: run.totalDeductions,
        employeeCount: run.employeeCount,
        employeeLines: run.employeeLines || [],
        createdAt: run.createdAt.toISOString(),
        updatedAt: run.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid payroll run ID');
    }

    const run = await PayrollRun.findById(id);

    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    // Don't allow deletion if locked or finalized
    if (run.status === 'locked' || run.status === 'FINALIZED' || run.status === 'completed') {
      throw new AppError(403, 'Cannot delete a locked or finalized payroll run');
    }

    await PayrollRun.findByIdAndDelete(id);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'DELETE',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Payroll run deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const lockPayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid payroll run ID');
    }

    const run = await PayrollRun.findById(id);

    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    run.status = 'locked';
    await run.save();

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Payroll run locked successfully',
      data: {
        id: run._id.toString(),
        status: run.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const recalculatePayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid payroll run ID');
    }

    const run = await PayrollRun.findById(id);

    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    if (run.status === 'locked' || run.status === 'FINALIZED') {
      throw new AppError(403, 'Cannot recalculate a locked or finalized payroll run');
    }

    // Recalculate using the service
    await calculatePayroll(id);

    // Reload the run to get updated values
    const updatedRun = await PayrollRun.findById(id)
      .populate('templateId', 'name')
      .populate('createdBy', 'name email');

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'UPDATE',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });

    res.json({
      success: true,
      message: 'Payroll run recalculated successfully',
      data: {
        id: updatedRun!._id.toString(),
        totalGross: updatedRun!.totalGross,
        totalNet: updatedRun!.totalNet,
        totalDeductions: updatedRun!.totalDeductions,
        employeeCount: updatedRun!.employeeCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const previewPayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateId, periodStart, periodEnd, employeeIds } = req.body;

    if (!templateId || !periodStart || !periodEnd) {
      throw new AppError(400, 'templateId, periodStart, and periodEnd are required');
    }

    // Get template
    const template = await PayrollTemplate.findById(templateId);
    if (!template) {
      throw new AppError(404, 'Payroll template not found');
    }

    // Get employees (filter by employeeIds if provided)
    const employeeQuery: any = { status: 'active' };
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      employeeQuery._id = { $in: employeeIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
    }

    const employees = await Employee.find(employeeQuery);

    // Calculate preview for each employee
    const employeeLines = employees.map((employee) => {
      const baseSalary = employee.salary || 0;
      let grossPay = baseSalary;
      let totalDeductions = 0;

      const payItems = template.defaultPayItems
        .filter((item) => item.isDefault)
        .map((item) => {
          let amount = 0;
          if (item.calculationType === 'flat') {
            amount = item.amount || 0;
          } else if (item.calculationType === 'percentage') {
            const base = item.appliesTo === 'basicSalary' ? baseSalary : grossPay;
            amount = (base * (item.percentage || 0)) / 100;
          }

          if (item.type === 'earning') {
            grossPay += amount;
          } else if (item.type === 'deduction') {
            totalDeductions += amount;
          }

          return {
            payItemId: item.code,
            code: item.code,
            label: item.label,
            type: item.type,
            amount,
          };
        });

      const netPay = grossPay - totalDeductions;

      return {
        employeeId: employee._id.toString(),
        employeeName: `${employee.firstName} ${employee.lastName}`,
        baseSalary,
        payItems,
        grossPay,
        totalDeductions,
        netPay,
      };
    });

    const totals = {
      employeeCount: employeeLines.length,
      totalGross: employeeLines.reduce((sum, line) => sum + line.grossPay, 0),
      totalDeductions: employeeLines.reduce((sum, line) => sum + line.totalDeductions, 0),
      totalNet: employeeLines.reduce((sum, line) => sum + line.netPay, 0),
    };

    res.json({
      success: true,
      data: {
        employeeLines,
        totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const exportPayrollRun = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { format = 'pdf' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError(400, 'Invalid payroll run ID');
    }

    const run = await PayrollRun.findById(id)
      .populate('templateId', 'name')
      .populate('createdBy', 'name email');

    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    if (format === 'csv') {
      // CSV Export
      const entries = await PayrollEntry.find({ payrollRunId: id })
        .populate('employeeId', 'firstName lastName employeeCode');

      const csvRows = [
        ['Employee Code', 'Employee Name', 'Gross Pay', 'Deductions', 'Net Pay'].join(','),
        ...entries.map((entry: any) => {
          const emp = entry.employeeId;
          const empName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown';
          const empCode = emp?.employeeCode || 'N/A';
          return [
            empCode,
            `"${empName}"`,
            entry.gross || 0,
            (entry.statutoryDeductions?.epfEmployee || 0) + (entry.statutoryDeductions?.tax || 0) + (entry.otherDeductions || 0),
            entry.net || 0,
          ].join(',');
        }),
      ];

      const csvContent = csvRows.join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payroll-run-${id}-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
      return;
    }

    // PDF Export using HTML template
    let entries = await PayrollEntry.find({ payrollRunId: id })
      .populate('employeeId', 'firstName lastName employeeCode departmentId')
      .sort({ 'employeeId.employeeCode': 1 });

    // If no entries found, use employeeLines from the run
    if (entries.length === 0 && run.employeeLines && run.employeeLines.length > 0) {
      // Use employeeLines data - populate employee info
      for (const line of run.employeeLines) {
        const emp = await Employee.findById(line.employeeId).populate('departmentId', 'name');
        entries.push({
          employeeId: emp,
          gross: line.grossPay,
          net: line.netPay,
          totalDeductions: line.totalDeductions,
          components: line.payItems?.map((item: any) => ({
            name: item.label,
            type: item.type === 'earning' ? 'EARNING' : 'DEDUCTION',
            amount: item.amount,
          })) || [],
          statutoryDeductions: {},
          otherDeductions: 0,
        } as any);
      }
    }

    if (entries.length === 0) {
      throw new AppError(404, 'No employee data found for this payroll run');
    }

    // Transform entries data for template
    const employees = entries.map((entry: any) => {
      const emp = entry.employeeId;
      const employeeName = emp 
        ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() 
        : 'Unknown';
      const department = emp?.departmentId 
        ? (emp.departmentId as any).name 
        : 'N/A';

      // Extract earnings
      const earnings: Array<{ name: string; amount: number }> = [];
      if (entry.components && Array.isArray(entry.components)) {
        entry.components
          .filter((c: any) => c.type === 'EARNING')
          .forEach((component: any) => {
            earnings.push({
              name: component.name,
              amount: component.amount || 0,
            });
          });
      }

      // Extract deductions
      const deductions: Array<{ name: string; amount: number }> = [];
      
      // Add statutory deductions
      if (entry.statutoryDeductions) {
        if (entry.statutoryDeductions.epfEmployee) {
          deductions.push({
            name: 'EPF (Employee)',
            amount: entry.statutoryDeductions.epfEmployee,
          });
        }
        if (entry.statutoryDeductions.tax) {
          deductions.push({
            name: 'Income Tax',
            amount: entry.statutoryDeductions.tax,
          });
        }
      }

      // Add component-based deductions
      if (entry.components && Array.isArray(entry.components)) {
        entry.components
          .filter((c: any) => c.type === 'DEDUCTION')
          .forEach((component: any) => {
            deductions.push({
              name: component.name,
              amount: component.amount || 0,
            });
          });
      }

      // Add other deductions
      if (entry.otherDeductions && entry.otherDeductions > 0) {
        deductions.push({
          name: 'Other Deductions',
          amount: entry.otherDeductions,
        });
      }

      return {
        employeeCode: emp?.employeeCode || 'N/A',
        employeeName,
        department,
        periodStart: run.periodStart,
        periodEnd: run.periodEnd,
        earnings,
        deductions,
        grossPay: entry.gross || 0,
        totalDeductions: entry.totalDeductions || 
          (entry.statutoryDeductions?.epfEmployee || 0) + 
          (entry.statutoryDeductions?.tax || 0) + 
          (entry.otherDeductions || 0),
        netPay: entry.net || 0,
      };
    });

    // Prepare template data
    const templateData = {
      runName: run.runName || 'N/A',
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      paymentDate: run.paymentDate,
      status: run.status,
      employeeCount: run.employeeCount || 0,
      totalGross: run.totalGross || 0,
      totalDeductions: run.totalDeductions || (run.totalGross - run.totalNet) || 0,
      totalNet: run.totalNet || 0,
      employees,
    };

    // Generate HTML and convert to PDF
    const html = generatePayrollRunHTML(templateData);
    const pdfBuffer = await generatePayrollRunPDF(html);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="payroll-run-${run.runName || id}-${new Date().toISOString().split('T')[0]}.pdf"`);
    
    // Send PDF buffer
    res.send(pdfBuffer);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'EXPORT',
      module: 'Payroll',
      resourceType: 'payroll_run',
      resourceId: id,
      ipAddress: req.ip || 'unknown',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and download individual employee payslip
 * POST /api/v1/payroll/runs/:runId/employees/:employeeId/payslip
 */
export const generateEmployeePayslip = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { runId, employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(runId) || !mongoose.Types.ObjectId.isValid(employeeId)) {
      throw new AppError(400, 'Invalid payroll run ID or employee ID');
    }

    // Get payroll run
    const run = await PayrollRun.findById(runId);
    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    // Get employee
    const employee = await Employee.findById(employeeId).populate('departmentId', 'name');
    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    // Get payroll entry for this employee in this run
    let entry = await PayrollEntry.findOne({ payrollRunId: runId, employeeId })
      .populate('employeeId', 'firstName lastName employeeCode departmentId');

    // If no entry found, try to get from employeeLines
    if (!entry && run.employeeLines && run.employeeLines.length > 0) {
      const employeeLine = run.employeeLines.find(
        (line: any) => line.employeeId?.toString() === employeeId
      );

      if (employeeLine) {
        // Transform employeeLine to entry-like structure
        entry = {
          employeeId: employee,
          gross: employeeLine.grossPay,
          net: employeeLine.netPay,
          totalDeductions: employeeLine.totalDeductions,
          components: employeeLine.payItems?.map((item: any) => ({
            name: item.label,
            type: item.type === 'earning' ? 'EARNING' : 'DEDUCTION',
            amount: item.amount,
          })) || [],
          statutoryDeductions: {},
          otherDeductions: 0,
        } as any;
      }
    }

    if (!entry) {
      throw new AppError(404, 'Payroll data not found for this employee in this run');
    }

    // Extract earnings
    const earnings: Array<{ name: string; amount: number }> = [];
    if (entry.components && Array.isArray(entry.components)) {
      entry.components
        .filter((c: any) => c.type === 'EARNING')
        .forEach((component: any) => {
          earnings.push({
            name: component.name,
            amount: component.amount || 0,
          });
        });
    }

    // Extract deductions
    const deductions: Array<{ name: string; amount: number }> = [];
    
    if (entry.statutoryDeductions) {
      if (entry.statutoryDeductions.epfEmployee) {
        deductions.push({
          name: 'EPF (Employee)',
          amount: entry.statutoryDeductions.epfEmployee,
        });
      }
      if (entry.statutoryDeductions.tax) {
        deductions.push({
          name: 'Income Tax',
          amount: entry.statutoryDeductions.tax,
        });
      }
    }

    if (entry.components && Array.isArray(entry.components)) {
      entry.components
        .filter((c: any) => c.type === 'DEDUCTION')
        .forEach((component: any) => {
          deductions.push({
            name: component.name,
            amount: component.amount || 0,
          });
        });
    }

    if (entry.otherDeductions && entry.otherDeductions > 0) {
      deductions.push({
        name: 'Other Deductions',
        amount: entry.otherDeductions,
      });
    }

    // Prepare template data
    const templateData = {
      employeeCode: employee.employeeCode || 'N/A',
      employeeName: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      department: employee.departmentId ? (employee.departmentId as any).name : undefined,
      periodStart: run.periodStart,
      periodEnd: run.periodEnd,
      paymentDate: run.paymentDate,
      runName: run.runName || 'N/A',
      earnings,
      deductions,
      grossPay: entry.gross || 0,
      totalDeductions: entry.totalDeductions || 
        (entry.statutoryDeductions?.epfEmployee || 0) + 
        (entry.statutoryDeductions?.tax || 0) + 
        (entry.otherDeductions || 0),
      netPay: entry.net || 0,
    };

    // Generate HTML and convert to PDF
    const html = generateEmployeePayslipHTML(templateData);
    const pdfBuffer = await generatePayrollRunPDF(html);

    // Set response headers
    const fileName = `payslip-${employee.employeeCode || employeeId}-${run.runName || runId}-${new Date().toISOString().split('T')[0]}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // Send PDF buffer
    res.send(pdfBuffer);

    await createAuditLog({
      actorId: req.user!.id,
      actorName: req.user!.name || req.user!.email || 'Unknown',
      actorRoles: req.user!.roles || [],
      action: 'GENERATE_PAYSLIP',
      module: 'Payroll',
      resourceType: 'payslip',
      resourceId: `${runId}-${employeeId}`,
      ipAddress: req.ip || 'unknown',
    });
  } catch (error) {
    next(error);
  }
};

export const getPayrollStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get active employees count
    const activeEmployees = await Employee.countDocuments({ status: 'active' });

    // Get template count
    const templateCount = await PayrollTemplate.countDocuments();

    // Get runs by status
    const runsByStatus = {
      draft: await PayrollRun.countDocuments({ status: { $in: ['draft', 'DRAFT'] } }),
      in_progress: await PayrollRun.countDocuments({ status: { $in: ['in_progress', 'CALCULATED', 'REVIEW_PENDING'] } }),
      completed: await PayrollRun.countDocuments({ status: { $in: ['completed', 'FINALIZED'] } }),
      locked: await PayrollRun.countDocuments({ status: 'locked' }),
    };

    // Get latest completed run
    const latestRun = await PayrollRun.findOne({
      status: { $in: ['completed', 'FINALIZED'] },
    })
      .sort({ createdAt: -1 })
      .select('periodStart periodEnd totalGross totalNet');

    res.json({
      success: true,
      data: {
        activeEmployees,
        templateCount,
        runsByStatus,
        latestPeriod: latestRun
          ? {
              periodStart: latestRun.periodStart.toISOString(),
              periodEnd: latestRun.periodEnd.toISOString(),
              totalGross: latestRun.totalGross,
              totalNet: latestRun.totalNet,
            }
          : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};

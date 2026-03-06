import { Request, Response, NextFunction } from 'express';
import { ZKTecoDeviceLog } from './zkteco-device-log.model';
import { AppError } from '../../middlewares/errorHandler';

/**
 * GET /api/v1/zkteco/logs
 * Get ZKTeco device logs with pagination and filters
 */
export const getZKTecoLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = '1',
      limit = '20',
      deviceId,
      logType,
      processed,
      startDate,
      endDate,
    } = req.query;

    // Build query
    const query: any = {};

    if (deviceId && deviceId !== 'all') {
      query.deviceId = { $regex: deviceId as string, $options: 'i' };
    }

    if (logType && logType !== 'all') {
      query.logType = logType;
    }

    if (processed !== undefined && processed !== 'all') {
      // Query params are always strings, so check for string 'true'
      const processedValue = String(processed).toLowerCase() === 'true';
      query.processed = processedValue;
    }

    // Date range filter for createdAt
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        // Include the entire end date by setting to end of day
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch logs
    const logs = await ZKTecoDeviceLog.find(query)
      .populate('employeeId', 'firstName lastName employeeCode employeeNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(); // Use lean() for better performance

    // Get total count
    const total = await ZKTecoDeviceLog.countDocuments(query);

    // Format response
    const formattedLogs = logs.map((log) => ({
      _id: log._id.toString(),
      deviceId: log.deviceId,
      deviceSn: log.deviceSn,
      logType: log.logType,
      rawData: log.rawData,
      parsedData: log.parsedData,
      payloadType: log.payloadType || 'unknown',
      employeeId: log.employeeId
        ? {
            _id: (log.employeeId as any)._id?.toString(),
            firstName: (log.employeeId as any).firstName,
            lastName: (log.employeeId as any).lastName,
            employeeCode: (log.employeeId as any).employeeCode,
            employeeNumber: (log.employeeId as any).employeeNumber,
          }
        : null,
      processed: log.processed,
      processedAt: log.processedAt?.toISOString(),
      error: log.error,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString(),
    }));

    res.json({
      success: true,
      data: formattedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/zkteco/logs/stats
 * Get statistics about ZKTeco device logs
 */
export const getZKTecoLogsStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const totalLogs = await ZKTecoDeviceLog.countDocuments({});
    const processedLogs = await ZKTecoDeviceLog.countDocuments({ processed: true });
    const pendingLogs = await ZKTecoDeviceLog.countDocuments({ processed: false });
    
    // Get unique device count
    const uniqueDevices = await ZKTecoDeviceLog.distinct('deviceId');
    
    // Get log type distribution
    const logTypeStats = await ZKTecoDeviceLog.aggregate([
      {
        $group: {
          _id: '$logType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Get oldest and newest log dates
    const oldestLog = await ZKTecoDeviceLog.findOne().sort({ createdAt: 1 }).lean();
    const newestLog = await ZKTecoDeviceLog.findOne().sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: {
        total: totalLogs,
        processed: processedLogs,
        pending: pendingLogs,
        uniqueDevices: uniqueDevices.length,
        logTypeDistribution: logTypeStats.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        dateRange: {
          oldest: oldestLog?.createdAt ? new Date(oldestLog.createdAt).toISOString() : null,
          newest: newestLog?.createdAt ? new Date(newestLog.createdAt).toISOString() : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

import { AuditLog, IAuditLog } from './log.model';

export interface CreateAuditLogParams {
  actorId: string;
  actorName?: string; // Made optional with fallback
  actorRoles?: string[]; // Made optional with fallback
  action: string;
  module: string;
  resourceType: string;
  resourceId: string;
  diff?: Record<string, any>;
  reason?: string;
  ipAddress?: string; // Made optional with fallback
}

/**
 * Helper function to create audit logs with automatic fallbacks
 * This ensures audit logging never fails even if some user data is missing
 */
export const createAuditLog = async (params: CreateAuditLogParams): Promise<IAuditLog | null> => {
  try {
    // Ensure required fields have fallback values
    const logData = {
      actorId: params.actorId,
      actorName: params.actorName || params.actorId || 'System',
      actorRoles: params.actorRoles || [],
      action: params.action,
      module: params.module,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      diff: params.diff,
      reason: params.reason,
      ipAddress: params.ipAddress || 'unknown',
    };
    
    const log = new AuditLog(logData);
    return await log.save();
  } catch (error: any) {
    // If validation still fails, log the error but don't throw
    // This prevents audit logging from breaking the main request
    console.error('Failed to create audit log:', error.message, {
      actorId: params.actorId,
      actorName: params.actorName,
      action: params.action,
      module: params.module,
    });
    return null; // Return null instead of throwing
  }
};

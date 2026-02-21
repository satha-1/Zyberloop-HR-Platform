import { AuditLog, IAuditLog } from './log.model';

export interface CreateAuditLogParams {
  actorId: string;
  actorName: string;
  actorRoles: string[];
  action: string;
  module: string;
  resourceType: string;
  resourceId: string;
  diff?: Record<string, any>;
  reason?: string;
  ipAddress: string;
}

export const createAuditLog = async (params: CreateAuditLogParams): Promise<IAuditLog> => {
  const log = new AuditLog(params);
  return await log.save();
};

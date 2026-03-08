import { ComplianceAlert, ComplianceFiling, CompliancePermit, AlertType, AlertSeverity } from '../compliance.model';

/**
 * Service for generating and managing compliance alerts.
 */
class ComplianceAlertsService {
  /**
   * Create or update alert (upsert by type + entityType + entityId + resolved=false)
   */
  async upsertAlert(params: {
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    entityType: 'FILING' | 'PERMIT' | 'AUDIT';
    entityId: string;
    dueAt?: Date | null;
  }): Promise<void> {
    const { type, severity, message, entityType, entityId, dueAt } = params;

    await ComplianceAlert.findOneAndUpdate(
      {
        type,
        entityType,
        entityId,
        resolved: false,
      },
      {
        $set: {
          severity,
          message,
          dueAt: dueAt || null,
        },
      },
      {
        upsert: true,
        new: true,
      }
    );
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    await ComplianceAlert.findByIdAndUpdate(alertId, {
      $set: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });
  }

  /**
   * Daily job: Generate alerts for filings and permits
   */
  async generateDailyAlerts(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ============================================================
    // FILING ALERTS
    // ============================================================
    const filings = await ComplianceFiling.find({
      status: { $in: ['DRAFT', 'PENDING'] },
    })
      .populate('filingTypeId')
      .populate('periodId');

    for (const filing of filings) {
      const filingType = filing.filingTypeId as any;
      const period = filing.periodId as any;

      // Overdue: past statutory due date
      if (filing.statutoryDueDate < today) {
        await this.upsertAlert({
          type: 'FILING_OVERDUE',
          severity: 'CRITICAL',
          message: `${filingType.name} filing for ${period.label} is overdue (due: ${filing.statutoryDueDate.toLocaleDateString()})`,
          entityType: 'FILING',
          entityId: filing._id.toString(),
          dueAt: filing.statutoryDueDate,
        });
      }
      // Due soon: within 30 days
      else {
        const daysUntilDue = Math.ceil(
          (filing.statutoryDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDue <= 30) {
          await this.upsertAlert({
            type: 'FILING_DUE',
            severity: daysUntilDue <= 7 ? 'CRITICAL' : 'HIGH',
            message: `${filingType.name} filing for ${period.label} is due in ${daysUntilDue} days`,
            entityType: 'FILING',
            entityId: filing._id.toString(),
            dueAt: filing.statutoryDueDate,
          });
        }
      }

      // Missing receipt: filed but no receipt assets
      if (filing.status === 'FILED' && filing.receiptAssets.length === 0) {
        await this.upsertAlert({
          type: 'MISSING_RECEIPT',
          severity: 'MEDIUM',
          message: `${filingType.name} filing for ${period.label} is marked as filed but no receipt uploaded`,
          entityType: 'FILING',
          entityId: filing._id.toString(),
          dueAt: null,
        });
      }
    }

    // ============================================================
    // PERMIT/VISA EXPIRY ALERTS
    // ============================================================
    const permits = await CompliancePermit.find({
      status: { $in: ['ACTIVE', 'RENEWAL_IN_PROGRESS'] },
    }).populate('employeeId', 'name employeeId');

    for (const permit of permits) {
      const daysUntilExpiry = Math.ceil(
        (permit.expiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 60) {
        const employee = permit.employeeId as any;
        let severity: AlertSeverity = 'LOW';
        if (daysUntilExpiry <= 14) {
          severity = 'CRITICAL';
        } else if (daysUntilExpiry <= 30) {
          severity = 'HIGH';
        } else {
          severity = 'MEDIUM';
        }

        await this.upsertAlert({
          type: 'VISA_EXPIRY',
          severity,
          message: `${permit.permitType} for ${employee?.name || employee?.employeeId || 'Employee'} expires in ${daysUntilExpiry} days`,
          entityType: 'PERMIT',
          entityId: permit._id.toString(),
          dueAt: permit.expiresAt,
        });
      }
    }
  }
}

export const complianceAlertsService = new ComplianceAlertsService();

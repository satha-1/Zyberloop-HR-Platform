import { esignService } from './esign.service';

class EsignReminderService {
  private intervalRef: NodeJS.Timeout | null = null;

  start() {
    if (this.intervalRef) return;
    const intervalMs = 24 * 60 * 60 * 1000; // daily
    this.intervalRef = setInterval(() => {
      this.runOnce().catch((error) => {
        console.error('[EsignReminder] Failed reminder run:', error);
      });
    }, intervalMs);

    // Fire once on startup in background.
    this.runOnce().catch((error) => {
      console.error('[EsignReminder] Startup reminder run failed:', error);
    });
  }

  stop() {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  async runOnce() {
    const sentCount = await esignService.processDueReminders();
    if (sentCount > 0) {
      console.log(`[EsignReminder] Sent ${sentCount} reminder email(s).`);
    }
  }
}

export const esignReminderService = new EsignReminderService();

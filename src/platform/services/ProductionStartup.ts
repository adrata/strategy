import { EmailScheduler } from './EmailScheduler';
import { calendarSyncScheduler } from './CalendarSyncScheduler';

/**
 * Production Startup Service
 * Handles initialization of production services
 */
export class ProductionStartup {
  private static instance: ProductionStartup;
  private emailSchedulerStarted = false;
  private calendarSchedulerStarted = false;
  
  private constructor() {}
  
  static getInstance(): ProductionStartup {
    if (!ProductionStartup.instance) {
      ProductionStartup['instance'] = new ProductionStartup();
    }
    return ProductionStartup.instance;
  }
  
  /**
   * Initialize all production services
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing production services...');
    
    try {
      // Start email scheduler
      await this.startEmailScheduler();
      
      // Start calendar sync scheduler
      await this.startCalendarSyncScheduler();
      
      // Add other production services here
      
      console.log('✅ Production services initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing production services:', error);
      throw error;
    }
  }
  
  /**
   * Start the email scheduler
   */
  private async startEmailScheduler(): Promise<void> {
    if (this.emailSchedulerStarted) {
      console.log('📧 Email scheduler already running');
      return;
    }
    
    try {
      console.log('📧 Starting email scheduler...');
      
      const scheduler = EmailScheduler.getInstance();
      scheduler.startScheduler();
      
      this['emailSchedulerStarted'] = true;
      console.log('✅ Email scheduler started successfully');
    } catch (error) {
      console.error('❌ Error starting email scheduler:', error);
      throw error;
    }
  }

  /**
   * Start the calendar sync scheduler
   */
  private async startCalendarSyncScheduler(): Promise<void> {
    if (this.calendarSchedulerStarted) {
      console.log('📅 Calendar sync scheduler already running');
      return;
    }
    
    try {
      console.log('📅 Starting calendar sync scheduler...');
      
      calendarSyncScheduler.startScheduler();
      
      this['calendarSchedulerStarted'] = true;
      console.log('✅ Calendar sync scheduler started successfully');
    } catch (error) {
      console.error('❌ Error starting calendar sync scheduler:', error);
      throw error;
    }
  }
  
  /**
   * Get production status
   */
  getStatus(): { emailSchedulerRunning: boolean; calendarSchedulerRunning: boolean } {
    return {
      emailSchedulerRunning: this.emailSchedulerStarted,
      calendarSchedulerRunning: this.calendarSchedulerStarted
    };
  }
}

// Auto-initialize in production
if (process['env']['NODE_ENV'] === 'production') {
  const startup = ProductionStartup.getInstance();
  startup.initialize().catch(console.error);
}

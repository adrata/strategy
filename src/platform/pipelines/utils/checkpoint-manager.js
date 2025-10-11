#!/usr/bin/env node

/**
 * 🔄 CHECKPOINT MANAGER
 * 
 * Provides checkpoint/resume functionality for large-scale pipeline runs
 * Saves progress after each company to enable recovery from interruptions
 */

const fs = require('fs').promises;
const path = require('path');

class CheckpointManager {
    constructor(options = {}) {
        this.checkpointFile = options.checkpointFile || './checkpoints/pipeline-checkpoint.json';
        this.autoSave = options.autoSave !== false; // Default to true
        this.saveInterval = options.saveInterval || 1; // Save after each company
        this.maxCheckpoints = options.maxCheckpoints || 10; // Keep last 10 checkpoints
        
        this.checkpointData = {
            startTime: null,
            lastUpdate: null,
            totalCompanies: 0,
            processedCompanies: 0,
            failedCompanies: 0,
            companies: [],
            results: [],
            stats: {
                cfosFound: 0,
                crosFound: 0,
                emailsFound: 0,
                phonesFound: 0,
                creditsUsed: 0,
                totalCost: 0
            },
            errors: [],
            version: '2.0.0'
        };
    }

    /**
     * Initialize checkpoint system
     */
    async initialize(companies) {
        console.log('🔄 Initializing checkpoint system...');
        
        // Ensure checkpoint directory exists
        const checkpointDir = path.dirname(this.checkpointFile);
        try {
            await fs.mkdir(checkpointDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        // Initialize checkpoint data
        this.checkpointData = {
            startTime: new Date().toISOString(),
            lastUpdate: new Date().toISOString(),
            totalCompanies: companies.length,
            processedCompanies: 0,
            failedCompanies: 0,
            companies: companies.map((company, index) => ({
                index,
                url: company,
                status: 'pending',
                startTime: null,
                endTime: null,
                result: null,
                error: null
            })),
            results: [],
            stats: {
                cfosFound: 0,
                crosFound: 0,
                emailsFound: 0,
                phonesFound: 0,
                creditsUsed: 0,
                totalCost: 0
            },
            errors: [],
            version: '2.0.0'
        };

        await this.saveCheckpoint();
        console.log(`   ✅ Checkpoint initialized: ${companies.length} companies`);
    }

    /**
     * Load existing checkpoint
     */
    async loadCheckpoint() {
        try {
            const data = await fs.readFile(this.checkpointFile, 'utf8');
            this.checkpointData = JSON.parse(data);
            
            console.log(`🔄 Loaded checkpoint: ${this.checkpointData.processedCompanies}/${this.checkpointData.totalCompanies} companies processed`);
            
            // Validate checkpoint data
            if (!this.checkpointData.version || this.checkpointData.version !== '2.0.0') {
                console.log('   ⚠️ Checkpoint version mismatch, starting fresh');
                return false;
            }
            
            return true;
        } catch (error) {
            console.log('   ⚠️ No checkpoint found, starting fresh');
            return false;
        }
    }

    /**
     * Get companies to process (pending ones)
     */
    getPendingCompanies() {
        return this.checkpointData.companies.filter(company => company.status === 'pending');
    }

    /**
     * Get processed companies
     */
    getProcessedCompanies() {
        return this.checkpointData.companies.filter(company => company.status === 'completed');
    }

    /**
     * Get failed companies
     */
    getFailedCompanies() {
        return this.checkpointData.companies.filter(company => company.status === 'failed');
    }

    /**
     * Start processing a company
     */
    startCompany(companyIndex) {
        const company = this.checkpointData.companies[companyIndex];
        if (company) {
            company.status = 'processing';
            company.startTime = new Date().toISOString();
            company.endTime = null;
            company.result = null;
            company.error = null;
        }
    }

    /**
     * Complete processing a company
     */
    async completeCompany(companyIndex, result) {
        const company = this.checkpointData.companies[companyIndex];
        if (company) {
            company.status = 'completed';
            company.endTime = new Date().toISOString();
            company.result = result;
            
            // Update stats
            if (result.cfo) {
                this.checkpointData.stats.cfosFound++;
            }
            if (result.cro) {
                this.checkpointData.stats.crosFound++;
            }
            if (result.cfo?.email || result.cro?.email) {
                this.checkpointData.stats.emailsFound++;
            }
            if (result.cfo?.phone || result.cro?.phone) {
                this.checkpointData.stats.phonesFound++;
            }
            if (result.creditsUsed) {
                this.checkpointData.stats.creditsUsed += result.creditsUsed;
            }
            if (result.cost) {
                this.checkpointData.stats.totalCost += result.cost;
            }
            
            this.checkpointData.processedCompanies++;
            this.checkpointData.results.push(result);
        }
        
        if (this.autoSave && this.checkpointData.processedCompanies % this.saveInterval === 0) {
            await this.saveCheckpoint();
        }
    }

    /**
     * Mark company as failed
     */
    async failCompany(companyIndex, error) {
        const company = this.checkpointData.companies[companyIndex];
        if (company) {
            company.status = 'failed';
            company.endTime = new Date().toISOString();
            company.error = error.message || error;
            
            this.checkpointData.failedCompanies++;
            this.checkpointData.errors.push({
                companyIndex,
                company: company.url,
                error: error.message || error,
                timestamp: new Date().toISOString()
            });
        }
        
        if (this.autoSave) {
            await this.saveCheckpoint();
        }
    }

    /**
     * Save checkpoint to file
     */
    async saveCheckpoint() {
        try {
            this.checkpointData.lastUpdate = new Date().toISOString();
            
            // Create backup of previous checkpoint
            try {
                const existingData = await fs.readFile(this.checkpointFile, 'utf8');
                const backupFile = this.checkpointFile.replace('.json', `-backup-${Date.now()}.json`);
                await fs.writeFile(backupFile, existingData);
                
                // Clean up old backups
                await this.cleanupBackups();
            } catch (error) {
                // No existing checkpoint to backup
            }
            
            // Save current checkpoint
            await fs.writeFile(this.checkpointFile, JSON.stringify(this.checkpointData, null, 2));
            
            console.log(`   💾 Checkpoint saved: ${this.checkpointData.processedCompanies}/${this.checkpointData.totalCompanies} companies`);
        } catch (error) {
            console.log(`   ❌ Failed to save checkpoint: ${error.message}`);
        }
    }

    /**
     * Clean up old backup files
     */
    async cleanupBackups() {
        try {
            const checkpointDir = path.dirname(this.checkpointFile);
            const files = await fs.readdir(checkpointDir);
            const backupFiles = files.filter(file => file.includes('-backup-')).sort();
            
            // Keep only the most recent backups
            const filesToDelete = backupFiles.slice(0, -this.maxCheckpoints);
            
            for (const file of filesToDelete) {
                await fs.unlink(path.join(checkpointDir, file));
            }
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    /**
     * Get progress summary
     */
    getProgressSummary() {
        const total = this.checkpointData.totalCompanies;
        const processed = this.checkpointData.processedCompanies;
        const failed = this.checkpointData.failedCompanies;
        const pending = total - processed - failed;
        
        const progress = total > 0 ? (processed / total * 100).toFixed(1) : 0;
        
        return {
            total,
            processed,
            failed,
            pending,
            progress: `${progress}%`,
            stats: this.checkpointData.stats,
            startTime: this.checkpointData.startTime,
            lastUpdate: this.checkpointData.lastUpdate
        };
    }

    /**
     * Generate final report
     */
    generateFinalReport() {
        const summary = this.getProgressSummary();
        const duration = this.checkpointData.startTime ? 
            new Date() - new Date(this.checkpointData.startTime) : 0;
        
        return {
            ...summary,
            duration: `${Math.round(duration / 1000)}s`,
            averageTimePerCompany: summary.processed > 0 ? 
                `${Math.round(duration / summary.processed / 1000)}s` : 'N/A',
            successRate: summary.total > 0 ? 
                `${(summary.processed / summary.total * 100).toFixed(1)}%` : '0%',
            cfoDiscoveryRate: summary.processed > 0 ? 
                `${(summary.stats.cfosFound / summary.processed * 100).toFixed(1)}%` : '0%',
            croDiscoveryRate: summary.processed > 0 ? 
                `${(summary.stats.crosFound / summary.processed * 100).toFixed(1)}%` : '0%',
            emailDiscoveryRate: summary.processed > 0 ? 
                `${(summary.stats.emailsFound / summary.processed * 100).toFixed(1)}%` : '0%',
            phoneDiscoveryRate: summary.processed > 0 ? 
                `${(summary.stats.phonesFound / summary.processed * 100).toFixed(1)}%` : '0%',
            costPerCompany: summary.processed > 0 ? 
                `$${(summary.stats.totalCost / summary.processed).toFixed(2)}` : '$0.00',
            errors: this.checkpointData.errors
        };
    }

    /**
     * Resume from checkpoint
     */
    async resume() {
        const loaded = await this.loadCheckpoint();
        if (!loaded) {
            return false;
        }
        
        const pending = this.getPendingCompanies();
        console.log(`🔄 Resuming from checkpoint: ${pending.length} companies remaining`);
        
        return true;
    }

    /**
     * Clear checkpoint
     */
    async clearCheckpoint() {
        try {
            await fs.unlink(this.checkpointFile);
            console.log('   ✅ Checkpoint cleared');
        } catch (error) {
            console.log('   ⚠️ No checkpoint to clear');
        }
    }
}

module.exports = CheckpointManager;

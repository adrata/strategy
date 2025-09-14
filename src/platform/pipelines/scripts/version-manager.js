/**
 * VERSION MANAGER
 * 
 * Manages auto-incrementing version numbers for pipeline outputs
 * Starts from v1 and increments each time a pipeline runs
 */

const fs = require('fs');
const path = require('path');

class VersionManager {
    constructor() {
        this.versionFile = path.join(__dirname, '.version');
        this.outputsDir = path.join(__dirname, 'outputs');
    }

    /**
     * Get the next version number and increment it
     */
    getNextVersion() {
        let currentVersion = 1;
        
        // Read current version if file exists
        if (fs.existsSync(this.versionFile)) {
            try {
                const versionData = fs.readFileSync(this.versionFile, 'utf8');
                currentVersion = parseInt(versionData.trim()) || 1;
            } catch (error) {
                console.warn('Warning: Could not read version file, starting from v1');
                currentVersion = 1;
            }
        }

        // Increment version
        const nextVersion = currentVersion + 1;
        
        // Save new version
        try {
            fs.writeFileSync(this.versionFile, nextVersion.toString());
        } catch (error) {
            console.warn('Warning: Could not save version file');
        }

        return `v${currentVersion}`;
    }

    /**
     * Reset version back to 1
     */
    resetVersion() {
        try {
            fs.writeFileSync(this.versionFile, '1');
            console.log('✅ Version reset to v1');
        } catch (error) {
            console.error('❌ Could not reset version file');
        }
    }

    /**
     * Ensure outputs directory exists for given version
     */
    ensureOutputsDir(version) {
        const versionDir = path.join(this.outputsDir, version);
        if (!fs.existsSync(versionDir)) {
            fs.mkdirSync(versionDir, { recursive: true });
        }
        return versionDir;
    }

    /**
     * Get current version without incrementing
     */
    getCurrentVersion() {
        if (fs.existsSync(this.versionFile)) {
            try {
                const versionData = fs.readFileSync(this.versionFile, 'utf8');
                const currentVersion = parseInt(versionData.trim()) || 1;
                return `v${currentVersion}`;
            } catch (error) {
                return 'v1';
            }
        }
        return 'v1';
    }
}

module.exports = { VersionManager };

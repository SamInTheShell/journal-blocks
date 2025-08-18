#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a version string in YYYY.MM.DDHHSS format
 * @returns {string} The generated version string
 */
function generateVersion() {
    const now = new Date();
    
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    return `${year}.${month}.${day}${hour}${second}`;
}

/**
 * Updates the version in package.json
 * @param {string} newVersion - The new version to set
 */
function updatePackageJson(newVersion) {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    
    try {
        // Read package.json
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Update version
        packageJson.version = newVersion;
        
        // Write back to package.json
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        
        console.log(`✅ Updated package.json version to: ${newVersion}`);
        return true;
    } catch (error) {
        console.error('❌ Error updating package.json:', error.message);
        return false;
    }
}

/**
 * Main function
 */
function main() {
    const args = process.argv.slice(2);
    
    // Check if a custom version was provided
    if (args.length > 0 && args[0]) {
        const customVersion = args[0];
        console.log(`Using custom version: ${customVersion}`);
        
        if (updatePackageJson(customVersion)) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    } else {
        // Generate automatic version
        const newVersion = generateVersion();
        console.log(`Generated version: ${newVersion}`);
        
        if (updatePackageJson(newVersion)) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export {
    generateVersion,
    updatePackageJson
};

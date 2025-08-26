#!/usr/bin/env node
/**
 * INTEGRITY ENFORCEMENT SCANNER
 * 
 * This scanner ruthlessly detects and reports fake code patterns
 * with ZERO TOLERANCE for deception or placeholder implementations.
 * 
 * Created by: Meta Orchestrator Agent
 * Purpose: Eliminate fake code epidemic in AI-generated implementations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class IntegrityScanner {
    constructor() {
        this.violations = [];
        this.severityLevels = {
            CRITICAL: 'CRITICAL',
            HIGH: 'HIGH', 
            MEDIUM: 'MEDIUM',
            LOW: 'LOW'
        };
        
        // Fake code patterns - ruthlessly comprehensive
        this.fakePatterns = {
            // Fake test patterns
            fakeTests: [
                /it\(['"`].*['"`],\s*\(\)\s*=>\s*{\s*expect\(true\)\.toBe\(true\)/gi,
                /test\(['"`].*['"`],\s*\(\)\s*=>\s*{\s*expect\(1\)\.toBe\(1\)/gi,
                /expect\(true\)\.toBeTruthy\(\)/gi,
                /expect\(false\)\.toBeFalsy\(\)/gi,
                /it\(['"`].*['"`],\s*\(\)\s*=>\s*{\s*\/\/\s*TODO/gi,
                /test\(['"`].*['"`],\s*\(\)\s*=>\s*{\s*console\.log/gi,
                /describe\(['"`].*['"`],\s*\(\)\s*=>\s*{\s*\/\/\s*placeholder/gi,
                /expect\(.*\)\.toEqual\(.*\)\s*\/\/\s*fake/gi,
                /it\.skip\(['"`].*['"`]/gi,
                /test\.skip\(['"`].*['"`]/gi,
                /it\.todo\(['"`].*['"`]/gi,
                /test\.todo\(['"`].*['"`]/gi
            ],
            
            // Fake implementation patterns  
            fakeCode: [
                /function\s+\w+\s*\([^)]*\)\s*{\s*\/\/\s*TODO/gi,
                /=>\s*{\s*\/\/\s*TODO/gi,
                /class\s+\w+\s*{\s*\/\/\s*TODO/gi,
                /constructor\s*\([^)]*\)\s*{\s*\/\/\s*TODO/gi,
                /async\s+function\s+\w+\s*\([^)]*\)\s*{\s*\/\/\s*TODO/gi,
                /return\s+null;\s*\/\/\s*TODO/gi,
                /return\s+undefined;\s*\/\/\s*TODO/gi,
                /return\s+{};\s*\/\/\s*placeholder/gi,
                /return\s+\[\];\s*\/\/\s*placeholder/gi,
                /throw\s+new\s+Error\(['"`]Not implemented['"`]\)/gi,
                /throw\s+new\s+Error\(['"`]TODO['"`]\)/gi,
                /console\.log\(['"`]TODO['"`]/gi,
                /console\.log\(['"`]FIXME['"`]/gi,
                /\/\*\s*TODO/gi,
                /\/\/\s*FIXME/gi,
                /\/\/\s*HACK/gi,
                /\/\/\s*XXX/gi
            ],
            
            // Mock/stub abuse patterns
            mockAbuse: [
                /jest\.fn\(\)\s*\/\/\s*fake/gi,
                /sinon\.stub\(\)\s*\/\/\s*fake/gi,
                /vi\.fn\(\)\s*\/\/\s*fake/gi,
                /mockImplementation\(\s*\(\)\s*=>\s*{\s*}\s*\)/gi,
                /mockReturnValue\(undefined\)/gi,
                /mockReturnValue\(null\)/gi,
                /\.mock\s*=\s*{}/gi,
                /__mocks__.*\.js.*\/\/\s*placeholder/gi
            ],
            
            // Placeholder content patterns
            placeholders: [
                /lorem ipsum/gi,
                /placeholder\s*text/gi,
                /sample\s*data/gi,
                /dummy\s*implementation/gi,
                /fake\s*data/gi,
                /mock\s*response/gi,
                /test\s*value/gi,
                /example\s*code/gi,
                /<your.*here>/gi,
                /\[your.*here\]/gi,
                /replace.*with.*actual/gi
            ],
            
            // Suspicious comment patterns
            suspiciousComments: [
                /\/\/\s*this\s*should\s*work/gi,
                /\/\/\s*untested/gi,
                /\/\/\s*not\s*implemented/gi,
                /\/\/\s*stub/gi,
                /\/\/\s*placeholder/gi,
                /\/\/\s*fake/gi,
                /\/\/\s*temporary/gi,
                /\/\/\s*quick\s*fix/gi,
                /\/\/\s*dirty\s*hack/gi
            ]
        };
        
        this.excludePatterns = [
            'node_modules/',
            '.git/',
            'dist/',
            'build/',
            'coverage/',
            '.cache/',
            'tmp/',
            '.next/',
            '.nuxt/',
            'vendor/'
        ];
    }
    
    scanDirectory(dirPath) {
        console.log(`🔍 SCANNING DIRECTORY: ${dirPath}`);
        this.violations = [];
        this._scanRecursive(dirPath);
        return this.generateReport();
    }
    
    _scanRecursive(dirPath) {
        if (!fs.existsSync(dirPath)) {
            console.log(`❌ Directory does not exist: ${dirPath}`);
            return;
        }
        
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(process.cwd(), fullPath);
            
            // Skip excluded patterns
            if (this.excludePatterns.some(pattern => relativePath.includes(pattern))) {
                continue;
            }
            
            if (entry.isDirectory()) {
                this._scanRecursive(fullPath);
            } else if (entry.isFile() && this._isCodeFile(entry.name)) {
                this._scanFile(fullPath);
            }
        }
    }
    
    _isCodeFile(filename) {
        const codeExtensions = [
            '.js', '.ts', '.jsx', '.tsx', 
            '.py', '.rb', '.php', '.java',
            '.go', '.rs', '.cpp', '.c',
            '.cs', '.kt', '.swift', '.dart',
            '.vue', '.svelte', '.sol',
            '.test.js', '.test.ts', '.spec.js', '.spec.ts'
        ];
        
        return codeExtensions.some(ext => filename.endsWith(ext));
    }
    
    _scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            
            // Check each pattern category
            for (const [category, patterns] of Object.entries(this.fakePatterns)) {
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(content)) !== null) {
                        const lineNumber = content.substring(0, match.index).split('\n').length;
                        const line = lines[lineNumber - 1];
                        
                        // Skip legitimate cases
                        if (this._isLegitimateCase(filePath, line, category, match[0])) {
                            continue;
                        }
                        
                        this.violations.push({
                            file: path.relative(process.cwd(), filePath),
                            line: lineNumber,
                            code: line.trim(),
                            pattern: pattern.source,
                            category: category,
                            severity: this._getSeverity(category),
                            message: this._getViolationMessage(category)
                        });
                    }
                }
            }
            
            // Additional checks for test files
            if (filePath.includes('.test.') || filePath.includes('.spec.')) {
                this._scanTestFile(filePath, content);
            }
            
        } catch (error) {
            console.error(`❌ Error scanning file ${filePath}: ${error.message}`);
        }
    }
    
    _scanTestFile(filePath, content) {
        // Check for tests that always pass
        const alwaysPassPatterns = [
            /expect\([^)]*\)\.toBe\(\1\)/gi,  // expect(x).toBe(x)
            /expect\(true\)\.toBe\(true\)/gi,
            /expect\(false\)\.toBe\(false\)/gi,
            /assert\(true\)/gi,
            /assert\.ok\(true\)/gi
        ];
        
        // Check for empty test bodies
        const emptyTestPattern = /(?:it|test)\(['"`][^'"`]*['"`],\s*(?:async\s*)?\([^)]*\)\s*=>\s*{\s*}\s*\)/gi;
        
        // Check for tests with only console.log
        const consoleOnlyPattern = /(?:it|test)\(['"`][^'"`]*['"`],\s*(?:async\s*)?\([^)]*\)\s*=>\s*{\s*console\.log/gi;
        
        for (const pattern of [...alwaysPassPatterns, emptyTestPattern, consoleOnlyPattern]) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const lineNumber = content.substring(0, match.index).split('\n').length;
                const lines = content.split('\n');
                
                this.violations.push({
                    file: path.relative(process.cwd(), filePath),
                    line: lineNumber,
                    code: lines[lineNumber - 1].trim(),
                    pattern: pattern.source,
                    category: 'suspiciousTests',
                    severity: this.severityLevels.CRITICAL,
                    message: 'FAKE TEST DETECTED: Test does not validate real behavior'
                });
            }
        }
    }
    
    _isLegitimateCase(filePath, line, category, matchText) {
        // Allow legitimate cases that shouldn't be flagged as violations
        
        // UI components: "placeholder" as HTML attribute or property
        if (category === 'placeholders' && matchText.toLowerCase().includes('placeholder')) {
            if (line.includes('{ name: \'placeholder\'') || 
                line.includes('"placeholder"') ||
                line.includes('type: \'string\'') ||
                line.includes('description:')) {
                return true; // Legitimate UI component property
            }
        }
        
        // Test files: "Test Value" as test data
        if (category === 'placeholders' && matchText.toLowerCase().includes('test')) {
            if (filePath.includes('.test.') || 
                filePath.includes('.spec.') ||
                filePath.includes('test/') ||
                line.includes('await b.send(') ||
                line.includes('\'Test Value\'')) {
                return true; // Legitimate test data
            }
        }
        
        // Variable names: exampleCode, getExampleCode
        if (category === 'placeholders' && matchText.toLowerCase().includes('example')) {
            if (line.includes('exampleCode') || 
                line.includes('getExampleCode') ||
                line.includes('getTodoExample') ||
                line.includes('getFormExample')) {
                return true; // Legitimate variable/function names
            }
        }
        
        return false; // Not a legitimate case, proceed with violation
    }
    
    _getSeverity(category) {
        const severityMap = {
            fakeTests: this.severityLevels.CRITICAL,
            fakeCode: this.severityLevels.CRITICAL,
            mockAbuse: this.severityLevels.HIGH,
            placeholders: this.severityLevels.MEDIUM,
            suspiciousComments: this.severityLevels.LOW
        };
        
        return severityMap[category] || this.severityLevels.MEDIUM;
    }
    
    _getViolationMessage(category) {
        const messages = {
            fakeTests: '🚨 FAKE TEST ALERT: This test does not verify real behavior',
            fakeCode: '🚨 FAKE CODE ALERT: Implementation is placeholder/stub',
            mockAbuse: '⚠️ MOCK ABUSE: Mock used where real implementation needed',
            placeholders: '⚠️ PLACEHOLDER DETECTED: Contains dummy/placeholder content',
            suspiciousComments: '💭 SUSPICIOUS COMMENT: Indicates incomplete implementation'
        };
        
        return messages[category] || 'Code integrity violation detected';
    }
    
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalViolations: this.violations.length,
            violationsBySeverity: {},
            violationsByCategory: {},
            violations: this.violations,
            integrityScore: this._calculateIntegrityScore()
        };
        
        // Group by severity
        for (const violation of this.violations) {
            report.violationsBySeverity[violation.severity] = 
                (report.violationsBySeverity[violation.severity] || 0) + 1;
        }
        
        // Group by category
        for (const violation of this.violations) {
            report.violationsByCategory[violation.category] = 
                (report.violationsByCategory[violation.category] || 0) + 1;
        }
        
        return report;
    }
    
    _calculateIntegrityScore() {
        if (this.violations.length === 0) return 100;
        
        const weights = {
            CRITICAL: 10,
            HIGH: 5,
            MEDIUM: 2,
            LOW: 1
        };
        
        const totalWeight = this.violations.reduce((sum, v) => 
            sum + (weights[v.severity] || 1), 0);
        
        // Score decreases with violations, min score is 0
        const score = Math.max(0, 100 - Math.min(100, totalWeight));
        return Math.round(score);
    }
    
    printReport(report) {
        console.log('\n' + '='.repeat(80));
        console.log('🚨 INTEGRITY ENFORCEMENT REPORT 🚨');
        console.log('='.repeat(80));
        console.log(`📊 Total Violations: ${report.totalViolations}`);
        console.log(`🎯 Integrity Score: ${report.integrityScore}/100`);
        console.log(`📅 Scan Time: ${report.timestamp}`);
        
        if (report.integrityScore < 50) {
            console.log('\n🚨🚨🚨 CRITICAL INTEGRITY FAILURE 🚨🚨🚨');
            console.log('This codebase has FAILED integrity standards!');
        } else if (report.integrityScore < 80) {
            console.log('\n⚠️ INTEGRITY WARNING: Violations detected');
        } else if (report.integrityScore < 95) {
            console.log('\n💛 Good integrity with minor issues');
        } else {
            console.log('\n✅ Excellent code integrity!');
        }
        
        // Print severity breakdown
        console.log('\n📊 VIOLATIONS BY SEVERITY:');
        for (const [severity, count] of Object.entries(report.violationsBySeverity)) {
            const icon = severity === 'CRITICAL' ? '🚨' : severity === 'HIGH' ? '⚠️' : '💭';
            console.log(`  ${icon} ${severity}: ${count}`);
        }
        
        // Print category breakdown
        console.log('\n📋 VIOLATIONS BY CATEGORY:');
        for (const [category, count] of Object.entries(report.violationsByCategory)) {
            console.log(`  • ${category}: ${count}`);
        }
        
        // Print detailed violations
        if (report.violations.length > 0) {
            console.log('\n🔍 DETAILED VIOLATIONS:');
            for (const violation of report.violations.slice(0, 20)) { // Limit output
                console.log(`\n${violation.severity === 'CRITICAL' ? '🚨' : '⚠️'} ${violation.message}`);
                console.log(`   File: ${violation.file}:${violation.line}`);
                console.log(`   Code: ${violation.code}`);
                console.log(`   Category: ${violation.category}`);
            }
            
            if (report.violations.length > 20) {
                console.log(`\n... and ${report.violations.length - 20} more violations`);
            }
        }
        
        console.log('\n' + '='.repeat(80));
        
        return report.integrityScore >= 80;
    }
    
    generateDashboardData() {
        const report = this.generateReport();
        return {
            integrityScore: report.integrityScore,
            totalViolations: report.totalViolations,
            criticalViolations: report.violationsBySeverity.CRITICAL || 0,
            highViolations: report.violationsBySeverity.HIGH || 0,
            lastScan: report.timestamp,
            status: report.integrityScore >= 80 ? 'CLEAN' : 
                    report.integrityScore >= 50 ? 'WARNING' : 'CRITICAL'
        };
    }
}

// CLI Interface
if (require.main === module) {
    const scanner = new IntegrityScanner();
    const targetDir = process.argv[2] || process.cwd();
    
    console.log('🚀 INTEGRITY ENFORCEMENT SCANNER ACTIVATED');
    console.log(`Target: ${targetDir}`);
    
    const report = scanner.scanDirectory(targetDir);
    const passed = scanner.printReport(report);
    
    // Save report
    const reportPath = path.join(process.cwd(), 'tmp', 'integrity-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    process.exit(passed ? 0 : 1);
}

module.exports = IntegrityScanner;
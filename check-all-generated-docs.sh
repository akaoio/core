#!/bin/bash

echo "=== COMPREHENSIVE GENERATED DOCS CHECK ==="
echo "Checking all 21 generated agent files..."
echo ""

# Initialize counters
total_files=0
files_with_issues=0
unprocessed_templates=0
empty_sections=0
data_mismatches=0

# Check each generated file
for file in .claude/agents-generated/*.md; do
    total_files=$((total_files + 1))
    filename=$(basename "$file")
    has_issue=false
    
    echo "Checking: $filename"
    
    # Check for unprocessed template variables
    if grep -q '{{[^}]*}}' "$file"; then
        echo "  ❌ Unprocessed template variables found:"
        grep -o '{{[^}]*}}' "$file" | head -3 | while read -r var; do
            echo "     $var"
        done
        unprocessed_templates=$((unprocessed_templates + 1))
        has_issue=true
    fi
    
    # Check for empty sections (multiple blank lines)
    empty_lines=$(grep -c '^$' "$file")
    if [ "$empty_lines" -gt 10 ]; then
        consecutive=$(awk '/^$/{count++; next} {if(count>=5) print NR-count"-"NR-1; count=0}' "$file" | head -1)
        if [ ! -z "$consecutive" ]; then
            echo "  ⚠️  Empty section detected (lines $consecutive)"
            empty_sections=$((empty_sections + 1))
            has_issue=true
        fi
    fi
    
    # Check for fake patterns
    if grep -qE 'TODO|FIXME|XXX|HACK|not implemented|coming soon' "$file"; then
        echo "  ❌ Fake patterns detected:"
        grep -nE 'TODO|FIXME|XXX|HACK|not implemented|coming soon' "$file" | head -2
        has_issue=true
    fi
    
    # Extract team and role from filename
    team=$(echo "$filename" | sed 's/team-\([^-]*\)-.*/\1/')
    role=$(echo "$filename" | sed 's/team-[^-]*-\(.*\)\.md/\1/' | sed 's/-[0-9]*$//')
    
    # Check if content matches expected team/role
    if ! grep -q "Team\*\*: $team" "$file"; then
        echo "  ❌ Team mismatch: expected '$team'"
        data_mismatches=$((data_mismatches + 1))
        has_issue=true
    fi
    
    if ! grep -q "Role\*\*: $role" "$file"; then
        echo "  ❌ Role mismatch: expected '$role'"
        data_mismatches=$((data_mismatches + 1))
        has_issue=true
    fi
    
    if [ "$has_issue" = true ]; then
        files_with_issues=$((files_with_issues + 1))
        echo "  Status: ⚠️  ISSUES FOUND"
    else
        echo "  Status: ✅ CLEAN"
    fi
    echo ""
done

# Check CLAUDE.md files
echo "=== Checking CLAUDE.md Files ==="
for file in $(find . -name "CLAUDE.md" -not -path "*/node_modules/*" | head -10); do
    echo "Checking: $file"
    
    # Check file size
    size=$(wc -c < "$file")
    if [ "$size" -lt 100 ]; then
        echo "  ⚠️  Suspiciously small: ${size} bytes"
    fi
    
    # Check for template remnants
    if grep -q '{{[^}]*}}' "$file"; then
        echo "  ❌ Unprocessed templates found"
    fi
    
    echo ""
done

# Summary Report
echo "=== SUMMARY REPORT ==="
echo "Total agent files checked: $total_files"
echo "Files with issues: $files_with_issues"
echo "Files with unprocessed templates: $unprocessed_templates"
echo "Files with empty sections: $empty_sections"
echo "Data mismatches: $data_mismatches"
echo ""

# Calculate health score
health_score=$((100 - (files_with_issues * 5)))
if [ $health_score -lt 0 ]; then
    health_score=0
fi

echo "📊 Documentation Health Score: $health_score/100"

if [ $files_with_issues -eq 0 ]; then
    echo "✅ All generated documentation is CLEAN!"
elif [ $files_with_issues -lt 5 ]; then
    echo "⚠️  Minor issues found in some files"
else
    echo "❌ Significant issues detected - review needed"
fi

# Specific issue analysis
echo ""
echo "=== DETAILED ANALYSIS ==="

# Check meta-orchestrator specifically
echo "Checking team-meta-orchestrator.md specifically..."
if [ -f ".claude/agents-generated/team-meta-orchestrator.md" ]; then
    # Count empty lines in responsibilities section
    empty_in_resp=$(sed -n '46,66p' .claude/agents-generated/team-meta-orchestrator.md | grep -c '^$')
    echo "Empty lines in responsibilities section: $empty_in_resp"
    
    if [ $empty_in_resp -gt 15 ]; then
        echo "❌ CRITICAL: Orchestrator role has missing conditional content!"
        echo "   The template condition for 'orchestrator' role is not defined in template"
    fi
fi

# Check integrity team files
echo ""
echo "Checking integrity team files..."
integrity_count=$(ls -1 .claude/agents-generated/team-integrity-*.md 2>/dev/null | wc -l)
echo "Integrity team files: $integrity_count"

# Final verdict
echo ""
echo "=== FINAL VERDICT ==="
if [ $unprocessed_templates -gt 0 ]; then
    echo "❌ CRITICAL: Composer left unprocessed template variables!"
    echo "   This indicates incomplete template processing"
elif [ $empty_sections -gt 5 ]; then
    echo "⚠️  WARNING: Multiple empty sections found"
    echo "   Some role conditions may not be defined in template"
elif [ $files_with_issues -eq 0 ]; then
    echo "✅ SUCCESS: All documentation properly generated"
else
    echo "⚠️  PARTIAL SUCCESS: Most files generated correctly"
    echo "   Issues found in $files_with_issues/$total_files files"
fi
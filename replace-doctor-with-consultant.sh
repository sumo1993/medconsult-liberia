#!/bin/bash

# Script to replace "doctor" with "consultant" across the application
# This preserves database column names (doctor_id, doctor_name, etc.)

echo "🔄 Replacing 'doctor' with 'consultant' in user-facing text..."

# Function to replace in files, preserving database column names
replace_in_files() {
    find app -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' \
        -e 's/\bDoctor\b/Consultant/g' \
        -e 's/\bdoctor\b/consultant/g' \
        -e 's/\bDOCTOR\b/CONSULTANT/g' \
        -e 's/\bDoctors\b/Consultants/g' \
        -e 's/\bdoctors\b/consultants/g' \
        {} +
}

# Backup important files first
echo "📦 Creating backup..."
tar -czf doctor-to-consultant-backup-$(date +%Y%m%d-%H%M%S).tar.gz app/

# Perform replacement
echo "✏️  Performing replacements..."
replace_in_files

echo "✅ Replacement complete!"
echo "⚠️  Note: Database column names (doctor_id, doctor_name, etc.) were preserved"
echo "📝 Please review the changes and test thoroughly"
echo "💾 Backup saved as: doctor-to-consultant-backup-*.tar.gz"

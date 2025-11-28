#!/usr/bin/env python3
"""
Script to fix hardcoded colors in AdminDashboard management components.
Replaces all hardcoded dark mode colors with theme variables.
"""

import re

def fix_admin_dashboard_theme(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Store original for comparison
    original = content

    # Find the start of each management component (after ProjectsManagement which is already fixed)
    # We need to fix: BugReportsManagement, UsersManagement, ModeratorsManagement, PaymentsManagement

    # Pattern replacements - order matters!
    replacements = [
        # Background colors
        (r"backgroundColor:\s*'#0E0F15'", "backgroundColor: theme.background"),
        (r"backgroundColor:\s*'#1F1F1F'", "backgroundColor: theme.cardBackground"),
        (r"backgroundColor:\s*'#2A2A2A'", "backgroundColor: theme.buttonDark"),
        (r"background:\s*'#0E0F15'", "background: theme.background"),
        (r"background:\s*'#1F1F1F'", "background: theme.cardBackground"),
        (r"background:\s*'#2A2A2A'", "background: theme.buttonDark"),
        (r"background:\s*'#3A3A3A'", "background: theme.buttonDarkHover"),
        (r"background:\s*'transparent'(?=,)", "background: theme.buttonLight"),

        # Text colors - be careful not to replace inside strings
        (r"color:\s*'white'(?=,|\s)", "color: theme.textPrimary"),
        (r"color:\s*'rgba\(255,\s*255,\s*255,\s*0\.7\)'", "color: theme.textSecondary"),
        (r"color:\s*'rgba\(255,\s*255,\s*255,\s*0\.6\)'", "color: theme.textMuted"),
        (r"color:\s*'rgba\(255,\s*255,\s*255,\s*0\.5\)'", "color: theme.textMuted"),

        # Borders
        (r"border:\s*'1px solid #2A2A2A'", "border: `1px solid ${theme.border}`"),
        (r"border:\s*'1px solid #3A3A3A'", "border: `1px solid ${theme.border}`"),
        (r"borderBottom:\s*'1px solid #2A2A2A'", "borderBottom: `1px solid ${theme.border}`"),
        (r"borderTop:\s*'1px solid #2A2A2A'", "borderTop: `1px solid ${theme.border}`"),

        # Box shadows - conditional based on light mode
        (r"boxShadow:\s*'0 4px 20px rgba\(0,\s*0,\s*0,\s*0\.3\)'",
         "boxShadow: isLightMode ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.3)'"),

        # Add transitions where missing
        # This is trickier and would need more context
    ]

    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)

    # Write back
    if content != original:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Fixed theme colors in {file_path}")
        return True
    else:
        print(f"ℹ️  No changes needed in {file_path}")
        return False

if __name__ == '__main__':
    file_path = r'C:\Projects\TestQuest2\TestQuest\Frontend\src\AdminDashboard.jsx'
    fix_admin_dashboard_theme(file_path)
    print("\nDone! Now manually review and test the changes.")
    print("Don't forget to add 'transition: \"all 0.3s ease\"' to elements that change!")

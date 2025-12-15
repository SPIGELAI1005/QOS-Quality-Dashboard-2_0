# Recovery Guide - QOS ET Quality Report

This guide provides step-by-step instructions to recover and rebuild the QOS ET Quality Report application if data is lost due to crashes, corruption, or accidental deletion.

---

## Quick Recovery Checklist

- [ ] Check git repository for recent commits
- [ ] Review `CHANGELOG.md` for recent changes
- [ ] Check `PROJECT_STATE.md` for complete application state
- [ ] Verify all files exist in project structure
- [ ] Check for backup files or cloud sync
- [ ] Review git reflog for lost commits
- [ ] Check Windows File History (if enabled)

---

## Step 1: Assess the Situation

### Check Git Status
```bash
git status
git log --oneline -20
git reflog
```

### Check for Backup Files
- Look for `.bak`, `.backup`, `.old` files
- Check cloud sync folders (OneDrive, Dropbox, etc.)
- Check Windows File History
- Check for external backups

### Review Documentation
- Read `CHANGELOG.md` for recent changes
- Review `PROJECT_STATE.md` for complete state
- Check `README.md` for setup instructions

---

## Step 2: Restore from Git (If Available)

### If Git Repository Exists:
```bash
# Check current state
git status

# View recent commits
git log --oneline

# View all branches
git branch -a

# Check reflog for lost commits
git reflog

# Restore from specific commit
git checkout <commit-hash>

# Or restore specific file
git checkout <commit-hash> -- <file-path>
```

### If Remote Repository Exists:
```bash
# Check remotes
git remote -v

# Fetch from remote
git fetch origin

# Check remote branches
git branch -r

# Restore from remote
git checkout origin/<branch-name>
```

---

## Step 3: Rebuild Missing Components

### Use PROJECT_STATE.md as Reference

The `PROJECT_STATE.md` file contains:
- Complete list of all pages
- All components and their purposes
- All charts and tables
- All API endpoints
- Data models and types
- Configuration details

### Rebuild Process:

1. **Verify Project Structure**:
   ```
   Check that all directories exist:
   - app/(dashboard)/[all-pages]
   - components/[all-components]
   - lib/[all-libraries]
   ```

2. **Check Each Page**:
   - Refer to PROJECT_STATE.md for page requirements
   - Verify page.tsx exists
   - Verify client component exists (if needed)
   - Check for required features

3. **Verify Components**:
   - Check all components listed in PROJECT_STATE.md
   - Verify component props match documentation
   - Check for required dependencies

4. **Check API Endpoints**:
   - Verify all API routes exist
   - Check request/response formats
   - Verify error handling

---

## Step 4: Restore from Documentation

### If Files Are Missing:

1. **Create Missing Pages**:
   - Use PROJECT_STATE.md to identify missing pages
   - Refer to existing similar pages as templates
   - Implement features as documented

2. **Recreate Components**:
   - Use component descriptions from PROJECT_STATE.md
   - Check existing components for patterns
   - Implement required props and features

3. **Restore Charts**:
   - Use chart descriptions from PROJECT_STATE.md
   - Refer to Recharts documentation
   - Use existing chart components as templates

4. **Restore Tables**:
   - Use table descriptions from PROJECT_STATE.md
   - Check column definitions
   - Implement filtering and sorting

---

## Step 5: Verify Functionality

### Test Checklist:

- [ ] All pages load without errors
- [ ] Navigation works correctly
- [ ] File upload functionality works
- [ ] KPI calculations are correct
- [ ] Charts render properly
- [ ] Tables display data correctly
- [ ] Filters work as expected
- [ ] AI insights generate correctly
- [ ] Settings page functions
- [ ] Data persists in localStorage

### Run Tests:
```bash
npm test
```

### Check for Errors:
```bash
npm run build
npm run lint
```

---

## Step 6: Restore Data

### If Data Files Are Missing:

1. **Excel Files**:
   - Check `attachments/` folder
   - Verify sample files exist
   - Re-add if necessary

2. **Configuration**:
   - Check `.env.local` exists
   - Verify environment variables
   - Restore API keys if needed

3. **LocalStorage Data**:
   - Data is stored in browser localStorage
   - Keys: `qos-et-kpis`, `qos-et-global-ppm`
   - May need to re-upload files to regenerate

---

## Step 7: Update Documentation

After recovery:

1. **Update CHANGELOG.md**:
   - Document what was recovered
   - Note any changes made during recovery
   - Record recovery date and time

2. **Update PROJECT_STATE.md**:
   - Verify all information is accurate
   - Update any changed features
   - Document any modifications

3. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Recovery: Restored missing files and functionality"
   ```

---

## Prevention Strategies

### 1. Regular Git Commits
```bash
# Commit frequently
git add .
git commit -m "Description of changes"

# Push to remote regularly
git push origin main
```

### 2. Backup Strategy
- Use remote git repository (GitHub, GitLab, etc.)
- Enable cloud sync for project folder
- Create regular backups
- Use Windows File History

### 3. Documentation Updates
- Update CHANGELOG.md with every change
- Update PROJECT_STATE.md when adding features
- Take screenshots of new UI features
- Document configuration changes

### 4. Auto-Save Settings
- Enable auto-save in editor
- Use git hooks for auto-commits (optional)
- Set up periodic backups

---

## Emergency Contacts & Resources

### Documentation Files:
- `README.md` - Project overview and setup
- `CHANGELOG.md` - Change history
- `PROJECT_STATE.md` - Complete application state
- `RECOVERY_GUIDE.md` - This file

### External Resources:
- Next.js Documentation: https://nextjs.org/docs
- Recharts Documentation: https://recharts.org/
- Tailwind CSS Documentation: https://tailwindcss.com/docs
- Shadcn UI Documentation: https://ui.shadcn.com/

---

## Recovery Scenarios

### Scenario 1: Complete Loss (No Git History)
1. Use PROJECT_STATE.md to rebuild from scratch
2. Follow project structure exactly
3. Implement features as documented
4. Test thoroughly

### Scenario 2: Partial Loss (Some Files Missing)
1. Check git for missing files
2. Restore from git if available
3. Rebuild missing files using PROJECT_STATE.md
4. Verify integration with existing code

### Scenario 3: Configuration Loss
1. Check `.env.local` template in README.md
2. Restore environment variables
3. Verify API keys and endpoints
4. Test functionality

### Scenario 4: Data Loss (Excel Files)
1. Check `attachments/` folder
2. Re-add sample files if needed
3. Re-upload files to regenerate KPIs
4. Verify calculations

---

## Post-Recovery Actions

1. **Verify Everything Works**:
   - Test all pages
   - Test all features
   - Verify data processing
   - Check calculations

2. **Update Git**:
   ```bash
   git add .
   git commit -m "Post-recovery verification and fixes"
   git push
   ```

3. **Document Recovery**:
   - Update CHANGELOG.md
   - Note what was recovered
   - Document any issues found

4. **Improve Backup Strategy**:
   - Set up remote repository
   - Enable automatic backups
   - Improve documentation

---

## Important Notes

- **Always commit changes** before closing Cursor or shutting down
- **Push to remote** regularly to prevent data loss
- **Update documentation** with every significant change
- **Test thoroughly** after recovery
- **Keep backups** of important files

---

**Last Updated**: 2025-01-XX  
**Version**: 1.0.0


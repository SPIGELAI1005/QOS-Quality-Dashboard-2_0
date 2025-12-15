# Development Workflow & Best Practices

This document outlines the workflow and best practices to prevent data loss and ensure proper documentation.

---

## Daily Workflow

### Starting Work
1. **Pull Latest Changes** (if using remote):
   ```bash
   git pull origin main
   ```

2. **Check Current Status**:
   ```bash
   git status
   ```

### During Development

#### Making Changes
1. **Make your changes** to files
2. **Test your changes** locally
3. **Update CHANGELOG.md** immediately:
   - Add entry with date and time
   - Document what changed
   - List files modified
   - Note any new features, charts, or tables

#### Before Committing
1. **Review your changes**:
   ```bash
   git diff
   ```

2. **Check for errors**:
   ```bash
   npm run lint
   npm run build
   ```

3. **Update documentation**:
   - CHANGELOG.md (required for every change)
   - PROJECT_STATE.md (if structure changed)
   - README.md (if setup/usage changed)

### Committing Changes

#### Commit Frequently
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Add: [Feature name] - [Brief description]

- Changed file1.tsx: [what changed]
- Changed file2.ts: [what changed]
- Added new component: ComponentName
- Updated CHANGELOG.md"

# Push to remote (if available)
git push origin main
```

#### Commit Message Format
```
Type: Brief description

Detailed description of changes:
- What was changed
- Why it was changed
- Any breaking changes
- Migration notes if needed

Files modified:
- path/to/file1.tsx
- path/to/file2.ts

Components/Features:
- ComponentName: Description
- FeatureName: Description
```

**Types**: `Add`, `Change`, `Fix`, `Remove`, `Update`, `Refactor`, `Document`

### Ending Work Session

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "End of session: [Date] - [Summary of work]"
   ```

2. **Push to remote** (if available):
   ```bash
   git push origin main
   ```

3. **Verify commit**:
   ```bash
   git log --oneline -5
   ```

---

## Documentation Requirements

### CHANGELOG.md Updates

**ALWAYS update CHANGELOG.md when:**
- Adding new features
- Modifying existing features
- Fixing bugs
- Changing configuration
- Adding/removing pages or components
- Updating dependencies

**Template for CHANGELOG entry:**
```markdown
### Date: YYYY-MM-DD HH:MM
**Type**: [Added|Changed|Fixed|Removed]

**Description**: Brief description

**Files Modified**:
- `path/to/file.tsx` - What changed

**Components Affected**:
- ComponentName - What changed

**Features Added/Modified**:
- Feature name - Description

**Charts/Tables Added/Modified**:
- Chart/Table name - Description
```

### PROJECT_STATE.md Updates

**Update PROJECT_STATE.md when:**
- Adding new pages
- Adding new components
- Adding new API endpoints
- Changing data models
- Modifying project structure
- Adding new features

### Screenshots

**Take screenshots when:**
- Adding new UI features
- Changing layouts
- Adding new charts or visualizations
- Significant visual changes

Store screenshots in: `docs/screenshots/` (create if needed)

---

## Preventing Data Loss

### 1. Git Best Practices

#### Commit Frequency
- **Commit after each feature completion**
- **Commit before major refactoring**
- **Commit at end of each work session**
- **Never leave uncommitted work overnight**

#### Branch Strategy (if using)
```bash
# Create feature branch
git checkout -b feature/new-feature

# Work on feature
# ... make changes ...

# Commit frequently
git add .
git commit -m "WIP: Feature description"

# Merge when complete
git checkout main
git merge feature/new-feature
```

### 2. Remote Repository

**Set up remote repository:**
```bash
# Add remote
git remote add origin <repository-url>

# Push to remote
git push -u origin main

# Regular pushes
git push origin main
```

**Benefits:**
- Automatic backup
- Version history
- Collaboration
- Recovery option

### 3. Local Backups

**Options:**
- Cloud sync (OneDrive, Dropbox, Google Drive)
- External drive backups
- Windows File History
- Manual folder copies

### 4. Auto-Save Settings

**In Cursor/VS Code:**
- Enable auto-save
- Set short auto-save interval
- Enable format on save

### 5. Git Hooks (Optional)

Create `.git/hooks/pre-commit`:
```bash
#!/bin/sh
# Run linter before commit
npm run lint
```

---

## Emergency Procedures

### If Cursor Crashes

1. **Don't panic**
2. **Check git status**:
   ```bash
   git status
   ```

3. **Recover uncommitted changes** (if possible):
   ```bash
   git stash
   git stash pop
   ```

4. **Check for auto-saved files**
5. **Review recent git history**:
   ```bash
   git log --oneline -10
   git reflog
   ```

6. **Follow RECOVERY_GUIDE.md** if needed

### If Files Are Lost

1. **Check git**:
   ```bash
   git log --all --full-history -- <file-path>
   git checkout <commit-hash> -- <file-path>
   ```

2. **Check remote repository** (if available)

3. **Use PROJECT_STATE.md** to rebuild

4. **Check backups** (cloud sync, external drives)

### If Configuration Is Lost

1. **Check README.md** for environment variables
2. **Check .env.local.example** (if exists)
3. **Review CHANGELOG.md** for configuration changes
4. **Restore from backup** if available

---

## Code Review Checklist

Before committing, verify:

- [ ] Code compiles without errors
- [ ] Linter passes
- [ ] Tests pass (if applicable)
- [ ] CHANGELOG.md updated
- [ ] PROJECT_STATE.md updated (if needed)
- [ ] Documentation updated
- [ ] No console errors
- [ ] Features work as expected
- [ ] No breaking changes (or documented)

---

## Regular Maintenance

### Weekly
- Review and clean up unused code
- Update dependencies if needed
- Review and update documentation
- Check for security updates

### Monthly
- Review CHANGELOG.md for accuracy
- Update PROJECT_STATE.md if needed
- Backup project folder
- Review git history

### Quarterly
- Major documentation review
- Dependency updates
- Security audit
- Performance review

---

## Quick Reference Commands

```bash
# Check status
git status

# View changes
git diff

# Stage all changes
git add .

# Commit
git commit -m "Message"

# Push to remote
git push origin main

# View history
git log --oneline -20

# View reflog (for recovery)
git reflog

# Create branch
git checkout -b feature/name

# Switch branch
git checkout main

# Merge branch
git merge feature/name

# Stash changes
git stash

# Apply stash
git stash pop
```

---

## Important Reminders

1. **ALWAYS commit before closing Cursor**
2. **ALWAYS update CHANGELOG.md with changes**
3. **ALWAYS push to remote if available**
4. **ALWAYS test before committing**
5. **ALWAYS document new features**
6. **NEVER commit without updating documentation**
7. **NEVER leave work uncommitted overnight**

---

**Remember**: Documentation is your safety net. The more you document, the easier recovery will be.


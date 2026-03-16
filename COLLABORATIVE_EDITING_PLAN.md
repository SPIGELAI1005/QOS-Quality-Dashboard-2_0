# Collaborative Editing Implementation Plan

**Last Updated**: 2026-03-16

## 🔴 Critical Issue Identified

**Current Problem:**
- All data is stored in **browser storage only** (localStorage + IndexedDB)
- Each user has **isolated data** - no sharing between users
- Data **disappears** when:
  - Browser storage is cleared
  - User switches devices/browsers
  - User opens app in incognito mode
  - Browser cache is cleared

**Impact:**
- ❌ No collaborative editing
- ❌ No data persistence across sessions
- ❌ No multi-user support
- ❌ Cannot track progress/trends over time (data is lost)

---

## ✅ Solution: Database Integration with Supabase

**Why Supabase:**
- Already installed (`@supabase/supabase-js` in package.json)
- PostgreSQL database (production-ready)
- Built-in authentication (can enhance role system later)
- Real-time subscriptions (optional, for live updates)
- Free tier available
- Easy to deploy on Vercel

---

## 📋 Implementation Plan

### Phase 1: Database Setup (Critical - Week 1)

#### 1.1 Supabase Project Setup
- [ ] Create Supabase project at https://supabase.com
- [ ] Get project URL and anon key
- [ ] Add environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

#### 1.2 Database Schema Design
Create tables for:
- [ ] **`monthly_site_kpis`** - Store aggregated KPIs per site/month
- [ ] **`complaints`** - Store complaint/notification data
- [ ] **`deliveries`** - Store delivery data (inbound/outbound)
- [ ] **`upload_history`** - Audit log of uploads
- [ ] **`upload_summaries`** - Upload summary data
- [ ] **`change_history`** - Change history for audit trail
- [ ] **`global_ppm`** - Global PPM values
- [ ] **`manual_kpis`** - Manual KPI entries
- [ ] **`users`** (optional) - Enhanced user management

#### 1.3 Database Migration Scripts
- [ ] Create SQL migration files
- [ ] Set up Row Level Security (RLS) policies
- [ ] Create indexes for performance

---

### Phase 2: API Layer (Critical - Week 1-2)

#### 2.1 Supabase Client Setup
- [ ] Create `lib/supabase/client.ts` - Client-side Supabase client
- [ ] Create `lib/supabase/server.ts` - Server-side Supabase client
- [ ] Create `lib/supabase/types.ts` - TypeScript types from database

#### 2.2 Data Access Layer
Create new modules to replace browser storage:
- [ ] `lib/data/kpis-db.ts` - Replace localStorage KPI storage
- [ ] `lib/data/complaints-db.ts` - Replace IndexedDB complaints
- [ ] `lib/data/deliveries-db.ts` - Replace IndexedDB deliveries
- [ ] `lib/data/upload-history-db.ts` - Replace localStorage upload history
- [ ] `lib/data/change-history-db.ts` - Replace localStorage change history

#### 2.3 API Endpoints
Create/update API routes:
- [ ] `POST /api/data/kpis` - Save KPIs
- [ ] `GET /api/data/kpis` - Retrieve KPIs
- [ ] `POST /api/data/complaints` - Save complaints (bulk)
- [ ] `GET /api/data/complaints` - Retrieve complaints
- [ ] `POST /api/data/deliveries` - Save deliveries (bulk)
- [ ] `GET /api/data/deliveries` - Retrieve deliveries
- [ ] `POST /api/data/upload-history` - Save upload history
- [ ] `GET /api/data/upload-history` - Retrieve upload history
- [ ] `POST /api/data/change-history` - Save change history
- [ ] `GET /api/data/change-history` - Retrieve change history
- [ ] `POST /api/data/global-ppm` - Save global PPM
- [ ] `GET /api/data/global-ppm` - Retrieve global PPM

---

### Phase 3: Data Migration (Critical - Week 2)

#### 3.1 Migration Strategy
- [ ] Create migration utility to move data from browser storage to database
- [ ] Add migration button in admin/settings page
- [ ] Support incremental migration (don't lose existing data)
- [ ] Add data validation during migration

#### 3.2 Hybrid Approach (Temporary)
- [ ] Keep browser storage as **cache** (for offline support)
- [ ] Sync browser storage with database on load
- [ ] Write to both during transition period
- [ ] Gradually phase out browser storage

---

### Phase 4: Component Updates (Week 2-3)

#### 4.1 Update Data Hooks
- [ ] Update `lib/data/useKpiData.ts` to fetch from database
- [ ] Update all components using `useKpiData` hook
- [ ] Add loading states and error handling

#### 4.2 Update Upload Flow
- [ ] Update `app/(dashboard)/upload/page.tsx` to save to database
- [ ] Update KPI calculation to save to database
- [ ] Update change history to save to database

#### 4.3 Update Dashboard
- [ ] Update `app/(dashboard)/dashboard/dashboard-client.tsx` to load from database
- [ ] Add real-time refresh (polling or Supabase real-time)
- [ ] Update all chart components

---

### Phase 5: Role-Based Access Control (Week 3)

#### 5.1 Database-Level Permissions
- [ ] Set up RLS policies:
  - **Reader**: Read-only access to all data
  - **Editor**: Read + Write access (can create/edit)
  - **Admin**: Read + Write + Delete access (can correct/remove/reverse)

#### 5.2 API-Level Authorization
- [ ] Add role checks in API endpoints
- [ ] Prevent unauthorized deletions (Admin only)
- [ ] Add audit logging for admin actions

---

### Phase 6: Testing & Validation (Week 3-4)

#### 6.1 Multi-User Testing
- [ ] Test with multiple users simultaneously
- [ ] Verify data persistence across sessions
- [ ] Test role-based access restrictions
- [ ] Test data migration from browser storage

#### 6.2 Performance Testing
- [ ] Test with large datasets
- [ ] Optimize database queries
- [ ] Add pagination for large result sets
- [ ] Test real-time updates

---

## 🎯 Success Criteria

After implementation, the app should:
- ✅ **Persist data** across all users and sessions
- ✅ **Support collaborative editing** - multiple Editors can add data
- ✅ **Show shared dashboard** - all users see the same data
- ✅ **Admin controls** - Admin can correct/remove/reverse data
- ✅ **Reader access** - Readers can view all data
- ✅ **Data history** - Track changes over time
- ✅ **No data loss** - Data survives browser clears, device switches

---

## 📊 Database Schema (Draft)

```sql
-- Monthly Site KPIs
CREATE TABLE monthly_site_kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL,
  site_code TEXT NOT NULL,
  site_name TEXT,
  q1_count INTEGER DEFAULT 0,
  q2_count INTEGER DEFAULT 0,
  q3_count INTEGER DEFAULT 0,
  deviations_count INTEGER DEFAULT 0,
  ppap_in_progress INTEGER DEFAULT 0,
  ppap_completed INTEGER DEFAULT 0,
  customer_ppm NUMERIC,
  supplier_ppm NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month, site_code)
);

-- Complaints
CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_number TEXT,
  notification_type TEXT,
  site_code TEXT,
  site_name TEXT,
  created_on DATE,
  material_number TEXT,
  -- ... other complaint fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deliveries
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant TEXT,
  site_code TEXT,
  site_name TEXT,
  date DATE,
  kind TEXT, -- 'inbound' | 'outbound'
  quantity NUMERIC,
  -- ... other delivery fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Upload History
CREATE TABLE upload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id TEXT UNIQUE NOT NULL,
  uploaded_by TEXT, -- role or user identifier
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  file_type TEXT,
  file_name TEXT,
  record_count INTEGER,
  status TEXT
);

-- Change History
CREATE TABLE change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  editor TEXT,
  record_id TEXT,
  record_type TEXT,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  reason TEXT
);

-- Global PPM
CREATE TABLE global_ppm (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_ppm NUMERIC,
  supplier_ppm NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_monthly_site_kpis_month ON monthly_site_kpis(month);
CREATE INDEX idx_monthly_site_kpis_site ON monthly_site_kpis(site_code);
CREATE INDEX idx_complaints_site ON complaints(site_code);
CREATE INDEX idx_complaints_date ON complaints(created_on);
CREATE INDEX idx_deliveries_site ON deliveries(site_code);
CREATE INDEX idx_deliveries_date ON deliveries(date);
```

---

## 🚀 Quick Start (Immediate Actions)

1. **Set up Supabase:**
   - Go to https://supabase.com
   - Create new project
   - Copy project URL and anon key

2. **Add environment variables:**
   - Create `.env.local` file
   - Add Supabase credentials

3. **Create database schema:**
   - Run SQL migrations in Supabase SQL editor

4. **Start with KPIs:**
   - Migrate KPI storage first (smallest dataset)
   - Test with one data type before migrating all

---

## ⚠️ Important Notes

- **Backward Compatibility**: Keep browser storage as fallback during migration
- **Data Loss Prevention**: Don't delete browser storage until migration is verified
- **Performance**: Use database indexes and pagination for large datasets
- **Security**: Implement RLS policies to prevent unauthorized access
- **Monitoring**: Add logging for database operations

---

## 📝 Next Steps

1. Review and approve this plan
2. Set up Supabase project
3. Create database schema
4. Implement Phase 1 (Database Setup)
5. Test with sample data
6. Proceed with remaining phases

---

**Estimated Timeline**: 3-4 weeks for full implementation
**Priority**: 🔴 CRITICAL - Required for production use

/**
 * Unit tests for KPI calculation service
 */

import { describe, it, expect } from 'vitest';
import {
  groupComplaintsByMonthAndSite,
  groupDeliveriesByMonthAndSite,
  calculateMonthlySiteKpis,
  calculateGlobalPPM,
} from '../kpi';
import type { Complaint, Delivery } from '../types';
import { NotificationCategory } from '../types';

describe('KPI Calculation Service', () => {
  describe('groupComplaintsByMonthAndSite', () => {
    it('should group complaints by site and month', () => {
      const complaints: Complaint[] = [
        {
          id: '1',
          notificationNumber: 'N001',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-15'),
          defectiveParts: 10,
          source: 'SAP_S4',
        },
        {
          id: '2',
          notificationNumber: 'N002',
          notificationType: 'Q2',
          category: NotificationCategory.SupplierComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-20'),
          defectiveParts: 5,
          source: 'SAP_S4',
        },
        {
          id: '3',
          notificationNumber: 'N003',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '175',
          siteCode: '175',
          createdOn: new Date('2025-01-25'),
          defectiveParts: 8,
          source: 'SAP_S4',
        },
        {
          id: '4',
          notificationNumber: 'N004',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-02-10'),
          defectiveParts: 12,
          source: 'SAP_S4',
        },
      ];

      const grouped = groupComplaintsByMonthAndSite(complaints);

      expect(grouped.size).toBe(3);
      expect(grouped.get('145::2025-01')?.length).toBe(2);
      expect(grouped.get('175::2025-01')?.length).toBe(1);
      expect(grouped.get('145::2025-02')?.length).toBe(1);
    });

    it('should handle empty complaints array', () => {
      const grouped = groupComplaintsByMonthAndSite([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('groupDeliveriesByMonthAndSite', () => {
    it('should group deliveries by site and month', () => {
      const deliveries: Delivery[] = [
        {
          id: '1',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-01-10'),
          quantity: 100000,
          kind: 'Customer',
        },
        {
          id: '2',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-01-15'),
          quantity: 50000,
          kind: 'Supplier',
        },
        {
          id: '3',
          plant: '175',
          siteCode: '175',
          date: new Date('2025-01-20'),
          quantity: 75000,
          kind: 'Customer',
        },
        {
          id: '4',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-02-05'),
          quantity: 120000,
          kind: 'Customer',
        },
      ];

      const grouped = groupDeliveriesByMonthAndSite(deliveries);

      expect(grouped.size).toBe(3);
      expect(grouped.get('145::2025-01')?.length).toBe(2);
      expect(grouped.get('175::2025-01')?.length).toBe(1);
      expect(grouped.get('145::2025-02')?.length).toBe(1);
    });

    it('should handle empty deliveries array', () => {
      const grouped = groupDeliveriesByMonthAndSite([]);
      expect(grouped.size).toBe(0);
    });
  });

  describe('calculateMonthlySiteKpis', () => {
    it('should calculate KPIs correctly for a single site and month', () => {
      const complaints: Complaint[] = [
        {
          id: '1',
          notificationNumber: 'N001',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-15'),
          defectiveParts: 10,
          source: 'SAP_S4',
        },
        {
          id: '2',
          notificationNumber: 'N002',
          notificationType: 'Q2',
          category: NotificationCategory.SupplierComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-20'),
          defectiveParts: 5,
          source: 'SAP_S4',
        },
        {
          id: '3',
          notificationNumber: 'N003',
          notificationType: 'Q3',
          category: NotificationCategory.InternalComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-25'),
          defectiveParts: 3,
          source: 'SAP_S4',
        },
        {
          id: '4',
          notificationNumber: 'N004',
          notificationType: 'D1',
          category: NotificationCategory.Deviation,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-30'),
          defectiveParts: 2,
          source: 'SAP_S4',
        },
        {
          id: '5',
          notificationNumber: 'N005',
          notificationType: 'P1',
          category: NotificationCategory.PPAP,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-10'),
          defectiveParts: 0,
          source: 'SAP_S4',
        },
        {
          id: '6',
          notificationNumber: 'N006',
          notificationType: 'P2',
          category: NotificationCategory.PPAP,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-12'),
          defectiveParts: 0,
          source: 'SAP_S4',
        },
      ];

      const deliveries: Delivery[] = [
        {
          id: '1',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-01-10'),
          quantity: 100000,
          kind: 'Customer',
        },
        {
          id: '2',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-01-15'),
          quantity: 50000,
          kind: 'Supplier',
        },
      ];

      const kpis = calculateMonthlySiteKpis(complaints, deliveries);

      expect(kpis.length).toBe(1);
      const kpi = kpis[0];

      expect(kpi.month).toBe('2025-01');
      expect(kpi.siteCode).toBe('145');
      expect(kpi.customerComplaintsQ1).toBe(1);
      expect(kpi.supplierComplaintsQ2).toBe(1);
      expect(kpi.internalComplaintsQ3).toBe(1);
      expect(kpi.deviationsD).toBe(1);
      expect(kpi.ppapP.inProgress).toBe(1);
      expect(kpi.ppapP.completed).toBe(1);

      // Customer PPM: (10 / 100000) * 1_000_000 = 100
      expect(kpi.customerPpm).toBe(100);

      // Supplier PPM: (5 / 50000) * 1_000_000 = 100
      expect(kpi.supplierPpm).toBe(100);

      // Internal defective parts: sum of defectiveParts for Q3 notifications
      expect(kpi.internalDefectiveParts).toBe(2);
    });

    it('should return null PPM when denominator is zero', () => {
      const complaints: Complaint[] = [
        {
          id: '1',
          notificationNumber: 'N001',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-15'),
          defectiveParts: 10,
          source: 'SAP_S4',
        },
      ];

      const deliveries: Delivery[] = []; // No deliveries

      const kpis = calculateMonthlySiteKpis(complaints, deliveries);

      expect(kpis.length).toBe(1);
      expect(kpis[0].customerPpm).toBeNull();
      expect(kpis[0].supplierPpm).toBeNull();
    });

    it('should handle multiple sites and months', () => {
      const complaints: Complaint[] = [
        {
          id: '1',
          notificationNumber: 'N001',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-15'),
          defectiveParts: 10,
          source: 'SAP_S4',
        },
        {
          id: '2',
          notificationNumber: 'N002',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '175',
          siteCode: '175',
          createdOn: new Date('2025-01-20'),
          defectiveParts: 8,
          source: 'SAP_S4',
        },
        {
          id: '3',
          notificationNumber: 'N003',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-02-10'),
          defectiveParts: 12,
          source: 'SAP_S4',
        },
      ];

      const deliveries: Delivery[] = [
        {
          id: '1',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-01-10'),
          quantity: 100000,
          kind: 'Customer',
        },
        {
          id: '2',
          plant: '175',
          siteCode: '175',
          date: new Date('2025-01-15'),
          quantity: 75000,
          kind: 'Customer',
        },
        {
          id: '3',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-02-05'),
          quantity: 120000,
          kind: 'Customer',
        },
      ];

      const kpis = calculateMonthlySiteKpis(complaints, deliveries);

      expect(kpis.length).toBe(3);
      expect(kpis.map((k) => `${k.siteCode}::${k.month}`).sort()).toEqual([
        '145::2025-01',
        '145::2025-02',
        '175::2025-01',
      ]);
    });

    it('should handle PPAP types correctly', () => {
      const complaints: Complaint[] = [
        {
          id: '1',
          notificationNumber: 'N001',
          notificationType: 'P1',
          category: NotificationCategory.PPAP,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-10'),
          defectiveParts: 0,
          source: 'SAP_S4',
        },
        {
          id: '2',
          notificationNumber: 'N002',
          notificationType: 'P2',
          category: NotificationCategory.PPAP,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-12'),
          defectiveParts: 0,
          source: 'SAP_S4',
        },
        {
          id: '3',
          notificationNumber: 'N003',
          notificationType: 'P3',
          category: NotificationCategory.PPAP,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-15'),
          defectiveParts: 0,
          source: 'SAP_S4',
        },
      ];

      const deliveries: Delivery[] = [];

      const kpis = calculateMonthlySiteKpis(complaints, deliveries);

      expect(kpis.length).toBe(1);
      expect(kpis[0].ppapP.inProgress).toBe(1); // P1
      expect(kpis[0].ppapP.completed).toBe(2); // P2 + P3
    });

    it('should handle deviations correctly', () => {
      const complaints: Complaint[] = [
        {
          id: '1',
          notificationNumber: 'N001',
          notificationType: 'D1',
          category: NotificationCategory.Deviation,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-10'),
          defectiveParts: 5,
          source: 'SAP_S4',
        },
        {
          id: '2',
          notificationNumber: 'N002',
          notificationType: 'D2',
          category: NotificationCategory.Deviation,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-12'),
          defectiveParts: 3,
          source: 'SAP_S4',
        },
        {
          id: '3',
          notificationNumber: 'N003',
          notificationType: 'D3',
          category: NotificationCategory.Deviation,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-15'),
          defectiveParts: 2,
          source: 'SAP_S4',
        },
      ];

      const deliveries: Delivery[] = [];

      const kpis = calculateMonthlySiteKpis(complaints, deliveries);

      expect(kpis.length).toBe(1);
      expect(kpis[0].deviationsD).toBe(3);
    });
  });

  describe('calculateGlobalPPM', () => {
    it('should calculate global PPM correctly', () => {
      const complaints: Complaint[] = [
        {
          id: '1',
          notificationNumber: 'N001',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-15'),
          defectiveParts: 10,
          source: 'SAP_S4',
        },
        {
          id: '2',
          notificationNumber: 'N002',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '175',
          siteCode: '175',
          createdOn: new Date('2025-01-20'),
          defectiveParts: 8,
          source: 'SAP_S4',
        },
        {
          id: '3',
          notificationNumber: 'N003',
          notificationType: 'Q2',
          category: NotificationCategory.SupplierComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-25'),
          defectiveParts: 5,
          source: 'SAP_S4',
        },
      ];

      const deliveries: Delivery[] = [
        {
          id: '1',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-01-10'),
          quantity: 100000,
          kind: 'Customer',
        },
        {
          id: '2',
          plant: '175',
          siteCode: '175',
          date: new Date('2025-01-15'),
          quantity: 75000,
          kind: 'Customer',
        },
        {
          id: '3',
          plant: '145',
          siteCode: '145',
          date: new Date('2025-01-20'),
          quantity: 50000,
          kind: 'Supplier',
        },
      ];

      const globalPPM = calculateGlobalPPM(complaints, deliveries);

      // Customer PPM: (10 + 8) / (100000 + 75000) * 1_000_000 = 18 / 175000 * 1_000_000 ≈ 102.86
      expect(globalPPM.customerPpm).toBeCloseTo(102.857, 2);

      // Supplier PPM: 5 / 50000 * 1_000_000 = 100
      expect(globalPPM.supplierPpm).toBe(100);
    });

    it('should return null when denominator is zero', () => {
      const complaints: Complaint[] = [
        {
          id: '1',
          notificationNumber: 'N001',
          notificationType: 'Q1',
          category: NotificationCategory.CustomerComplaint,
          plant: '145',
          siteCode: '145',
          createdOn: new Date('2025-01-15'),
          defectiveParts: 10,
          source: 'SAP_S4',
        },
      ];

      const deliveries: Delivery[] = []; // No deliveries

      const globalPPM = calculateGlobalPPM(complaints, deliveries);

      expect(globalPPM.customerPpm).toBeNull();
      expect(globalPPM.supplierPpm).toBeNull();
    });

    it('should handle empty arrays', () => {
      const globalPPM = calculateGlobalPPM([], []);

      expect(globalPPM.customerPpm).toBeNull();
      expect(globalPPM.supplierPpm).toBeNull();
    });
  });
});


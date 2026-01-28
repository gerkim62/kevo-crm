"use server";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface DashboardStats {
  totalLeads: number;
  totalLeadsChange: number;
  activePolicies: number;
  activePoliciesChange: number;
  monthlyCommission: number;
  monthlyCommissionChange: number;
  conversionRate: number;
  conversionRateChange: number;
}

export interface SalesData {
  month: string;
  sales: number;
}

export interface PolicyDistribution {
  type: string;
  count: number;
  percentage: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get current month data
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

    // Total leads
    const totalLeads = await prisma.lead.count();
    const lastMonthLeads = await prisma.lead.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonthStart,
        },
      },
    });
    const totalLeadsChange = lastMonthLeads > 0 ? ((totalLeads - lastMonthLeads) / lastMonthLeads) * 100 : 0;

    // Active policies
    const activePolicies = await prisma.policy.count({
      where: {
        status: 'active',
      },
    });
    const lastMonthActivePolicies = await prisma.policy.count({
      where: {
        status: 'active',
        createdAt: {
          gte: lastMonth,
          lt: currentMonthStart,
        },
      },
    });
    const activePoliciesChange = lastMonthActivePolicies > 0 ? ((activePolicies - lastMonthActivePolicies) / lastMonthActivePolicies) * 100 : 0;

    // Monthly commission
    const monthlyCommission = await prisma.commission.aggregate({
      where: {
        commissionDate: {
          gte: currentMonthStart,
        },
        status: 'Paid',
      },
      _sum: {
        amount: true,
      },
    });

    const lastMonthCommission = await prisma.commission.aggregate({
      where: {
        commissionDate: {
          gte: lastMonth,
          lt: currentMonthStart,
        },
        status: 'Paid',
      },
      _sum: {
        amount: true,
      },
    });

    const currentCommission = monthlyCommission._sum.amount || 0;
    const previousCommission = lastMonthCommission._sum.amount || 0;
    const monthlyCommissionChange = previousCommission > 0 ? ((currentCommission - previousCommission) / previousCommission) * 100 : 0;

    // Conversion rate
    const convertedLeads = await prisma.lead.count({
      where: {
        status: 'converted',
      },
    });
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const lastMonthConvertedLeads = await prisma.lead.count({
      where: {
        status: 'converted',
        createdAt: {
          gte: lastMonth,
          lt: currentMonthStart,
        },
      },
    });
    const lastMonthConversionRate = lastMonthLeads > 0 ? (lastMonthConvertedLeads / lastMonthLeads) * 100 : 0;
    const conversionRateChange = lastMonthConversionRate > 0 ? ((conversionRate - lastMonthConversionRate) / lastMonthConversionRate) * 100 : 0;

    return {
      totalLeads,
      totalLeadsChange,
      activePolicies,
      activePoliciesChange,
      monthlyCommission: currentCommission,
      monthlyCommissionChange,
      conversionRate,
      conversionRateChange,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard statistics');
  }
}

export async function getSalesData(): Promise<SalesData[]> {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const salesData = await prisma.policy.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
        status: 'active',
      },
      _sum: {
        premium: true,
      },
    });

    // Group by month
    const monthlyData: { [key: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    salesData.forEach((data) => {
      const month = months[data.createdAt.getMonth()];
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += data._sum.premium || 0;
    });

    // Fill in missing months with 0
    const result: SalesData[] = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const month = months[date.getMonth()];
      result.push({
        month,
        sales: monthlyData[month] || 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching sales data:', error);
    throw new Error('Failed to fetch sales data');
  }
}

export async function getPolicyDistribution(): Promise<PolicyDistribution[]> {
  try {
    const policyTypeData = await prisma.policy.groupBy({
      by: ['type'],
      where: {
        status: 'active',
      },
      _count: {
        type: true,
      },
    });

    const totalPolicies = policyTypeData.reduce((sum, item) => sum + item._count.type, 0);

    const policyTypeLabels: { [key: string]: string } = {
      life_insurance: 'Life Insurance',
      health_insurance: 'Health Insurance',
      motor_insurance: 'Motor Insurance',
      property_insurance: 'Property Insurance',
      travel_insurance: 'Travel Insurance',
      personal_accident_insurance: 'Personal Accident Insurance',
      group_personal_accident_insurance: 'Group Personal Accident',
      WIBA_insurance: 'WIBA Insurance',
      all_risks_insurance: 'All Risks Insurance',
      public_liability_insurance: 'Public Liability Insurance',
    };

    const distribution: PolicyDistribution[] = policyTypeData.map((item) => ({
      type: policyTypeLabels[item.type] || item.type,
      count: item._count.type,
      percentage: totalPolicies > 0 ? (item._count.type / totalPolicies) * 100 : 0,
    }));

    return distribution.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching policy distribution:', error);
    throw new Error('Failed to fetch policy distribution');
  }
}
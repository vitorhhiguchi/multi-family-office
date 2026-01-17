// Mock data for development - will be replaced by API calls

import type {
    Client,
    Simulation,
    Movement,
    Insurance,
    YearProjection
} from '@/types';

export const mockClients: Client[] = [
    {
        id: 1,
        name: 'Matheus Silveira',
        birthDate: '1980-01-15',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        name: 'Ana Paula Costa',
        birthDate: '1985-06-20',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
];

export const mockSimulations: Simulation[] = [
    {
        id: 1,
        name: 'Plano Original',
        startDate: '2025-01-01',
        realRate: 0.04,
        version: 1,
        isCurrentSituation: true,
        clientId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        name: 'Situação atual 05/2025',
        startDate: '2025-05-01',
        realRate: 0.04,
        version: 1,
        isCurrentSituation: false,
        clientId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
];

export const mockMovements: Movement[] = [
    {
        id: 1,
        name: 'CLT',
        type: 'INCOME',
        category: 'WORK',
        value: 15000,
        frequency: 'MONTHLY',
        startDate: '2025-01-01',
        endDate: '2030-12-31',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        name: 'CLT + Autônomo',
        type: 'INCOME',
        category: 'WORK',
        value: 20000,
        frequency: 'MONTHLY',
        startDate: '2030-01-01',
        endDate: '2035-12-31',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 3,
        name: 'Autônomo',
        type: 'INCOME',
        category: 'WORK',
        value: 35000,
        frequency: 'MONTHLY',
        startDate: '2035-01-01',
        endDate: '2045-12-31',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 4,
        name: 'Aposentadoria',
        type: 'INCOME',
        category: 'PASSIVE',
        value: 10000,
        frequency: 'MONTHLY',
        startDate: '2045-01-01',
        endDate: undefined,
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 5,
        name: 'Custo de Vida',
        type: 'EXPENSE',
        category: undefined,
        value: 8000,
        frequency: 'MONTHLY',
        startDate: '2025-01-01',
        endDate: '2030-12-31',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 6,
        name: 'Custo de Vida',
        type: 'EXPENSE',
        category: undefined,
        value: 12000,
        frequency: 'MONTHLY',
        startDate: '2030-01-01',
        endDate: '2040-12-31',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 7,
        name: 'Custo de Vida',
        type: 'EXPENSE',
        category: undefined,
        value: 20000,
        frequency: 'MONTHLY',
        startDate: '2040-01-01',
        endDate: '2050-12-31',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 8,
        name: 'Custo de Vida',
        type: 'EXPENSE',
        category: undefined,
        value: 10000,
        frequency: 'MONTHLY',
        startDate: '2050-01-01',
        endDate: '2055-12-31',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 9,
        name: 'Custo de Vida',
        type: 'EXPENSE',
        category: undefined,
        value: 15000,
        frequency: 'MONTHLY',
        startDate: '2055-01-01',
        endDate: undefined,
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 10,
        name: 'Herança',
        type: 'INCOME',
        category: 'OTHER',
        value: 220000,
        frequency: 'ONE_TIME',
        startDate: '2023-07-09',
        endDate: '2023-07-22',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 11,
        name: 'Custo do filho',
        type: 'EXPENSE',
        category: undefined,
        value: 1500,
        frequency: 'MONTHLY',
        startDate: '2023-07-09',
        endDate: '2043-07-22',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 12,
        name: 'Comissão',
        type: 'INCOME',
        category: 'WORK',
        value: 500000,
        frequency: 'ANNUALLY',
        startDate: '2023-07-09',
        endDate: '2023-07-22',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 13,
        name: 'Compra de Imóvel',
        type: 'EXPENSE',
        category: undefined,
        value: 1500000,
        frequency: 'ONE_TIME',
        startDate: '2023-07-09',
        endDate: '2023-07-22',
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
];

export const mockInsurances: Insurance[] = [
    {
        id: 1,
        name: 'Seguro de Vida Familiar',
        type: 'LIFE',
        startDate: '2025-01-01',
        durationMonths: 180, // 15 anos
        premium: 120,
        insuredValue: 500000,
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
    {
        id: 2,
        name: 'Seguro de Invalidez',
        type: 'DISABILITY',
        startDate: '2025-01-01',
        durationMonths: 60, // 5 anos
        premium: 300,
        insuredValue: 100000,
        simulationId: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
    },
];

export const mockProjections: YearProjection[] = [
    { year: 2025, age: 45, status: 'ALIVE', patrimonyStart: 1000000, totalIncome: 180000, totalExpenses: 96000, netResult: 84000, growth: 43360, patrimonyEnd: 1127360, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2026, age: 46, status: 'ALIVE', patrimonyStart: 1127360, totalIncome: 180000, totalExpenses: 96000, netResult: 84000, growth: 48454, patrimonyEnd: 1259814, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2027, age: 47, status: 'ALIVE', patrimonyStart: 1259814, totalIncome: 180000, totalExpenses: 96000, netResult: 84000, growth: 53753, patrimonyEnd: 1397567, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2028, age: 48, status: 'ALIVE', patrimonyStart: 1397567, totalIncome: 180000, totalExpenses: 96000, netResult: 84000, growth: 59263, patrimonyEnd: 1540830, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2029, age: 49, status: 'ALIVE', patrimonyStart: 1540830, totalIncome: 180000, totalExpenses: 96000, netResult: 84000, growth: 64993, patrimonyEnd: 1689823, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2030, age: 50, status: 'ALIVE', patrimonyStart: 1689823, totalIncome: 240000, totalExpenses: 144000, netResult: 96000, growth: 71433, patrimonyEnd: 1857256, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2031, age: 51, status: 'ALIVE', patrimonyStart: 1857256, totalIncome: 240000, totalExpenses: 144000, netResult: 96000, growth: 78130, patrimonyEnd: 2031386, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2032, age: 52, status: 'ALIVE', patrimonyStart: 2031386, totalIncome: 240000, totalExpenses: 144000, netResult: 96000, growth: 85095, patrimonyEnd: 2212481, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2033, age: 53, status: 'ALIVE', patrimonyStart: 2212481, totalIncome: 240000, totalExpenses: 144000, netResult: 96000, growth: 92339, patrimonyEnd: 2400820, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2034, age: 54, status: 'ALIVE', patrimonyStart: 2400820, totalIncome: 240000, totalExpenses: 144000, netResult: 96000, growth: 99873, patrimonyEnd: 2596693, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2035, age: 55, status: 'ALIVE', patrimonyStart: 2596693, totalIncome: 420000, totalExpenses: 144000, netResult: 276000, growth: 114908, patrimonyEnd: 2987601, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2036, age: 56, status: 'ALIVE', patrimonyStart: 2987601, totalIncome: 420000, totalExpenses: 144000, netResult: 276000, growth: 130544, patrimonyEnd: 3394145, financingPayments: 0, insurancePremiums: 5040, insuranceValue: 600000 },
    { year: 2037, age: 57, status: 'ALIVE', patrimonyStart: 3394145, totalIncome: 420000, totalExpenses: 144000, netResult: 276000, growth: 146806, patrimonyEnd: 3816951, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2038, age: 58, status: 'ALIVE', patrimonyStart: 3816951, totalIncome: 420000, totalExpenses: 144000, netResult: 276000, growth: 163718, patrimonyEnd: 4256669, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2039, age: 59, status: 'ALIVE', patrimonyStart: 4256669, totalIncome: 420000, totalExpenses: 144000, netResult: 276000, growth: 181307, patrimonyEnd: 4713976, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2040, age: 60, status: 'ALIVE', patrimonyStart: 4713976, totalIncome: 420000, totalExpenses: 240000, netResult: 180000, growth: 195759, patrimonyEnd: 5089735, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2041, age: 61, status: 'ALIVE', patrimonyStart: 5089735, totalIncome: 420000, totalExpenses: 240000, netResult: 180000, growth: 209389, patrimonyEnd: 5479124, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2042, age: 62, status: 'ALIVE', patrimonyStart: 5479124, totalIncome: 420000, totalExpenses: 240000, netResult: 180000, growth: 223165, patrimonyEnd: 5882289, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2043, age: 63, status: 'ALIVE', patrimonyStart: 5882289, totalIncome: 420000, totalExpenses: 240000, netResult: 180000, growth: 249692, patrimonyEnd: 6311981, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2044, age: 64, status: 'ALIVE', patrimonyStart: 6311981, totalIncome: 420000, totalExpenses: 240000, netResult: 180000, growth: 259679, patrimonyEnd: 6751660, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2045, age: 65, status: 'ALIVE', patrimonyStart: 6751660, totalIncome: 120000, totalExpenses: 240000, netResult: -120000, growth: 245266, patrimonyEnd: 6876926, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2046, age: 66, status: 'ALIVE', patrimonyStart: 6876926, totalIncome: 120000, totalExpenses: 240000, netResult: -120000, growth: 250277, patrimonyEnd: 7007203, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2047, age: 67, status: 'ALIVE', patrimonyStart: 7007203, totalIncome: 120000, totalExpenses: 240000, netResult: -120000, growth: 255488, patrimonyEnd: 7142691, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2048, age: 68, status: 'ALIVE', patrimonyStart: 7142691, totalIncome: 120000, totalExpenses: 240000, netResult: -120000, growth: 260908, patrimonyEnd: 7283599, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2049, age: 69, status: 'ALIVE', patrimonyStart: 7283599, totalIncome: 120000, totalExpenses: 240000, netResult: -120000, growth: 266544, patrimonyEnd: 7430143, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2050, age: 70, status: 'ALIVE', patrimonyStart: 7430143, totalIncome: 120000, totalExpenses: 120000, netResult: 0, growth: 297206, patrimonyEnd: 7727349, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2051, age: 71, status: 'ALIVE', patrimonyStart: 7727349, totalIncome: 120000, totalExpenses: 120000, netResult: 0, growth: 309094, patrimonyEnd: 8036443, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2052, age: 72, status: 'ALIVE', patrimonyStart: 8036443, totalIncome: 120000, totalExpenses: 120000, netResult: 0, growth: 321458, patrimonyEnd: 8357901, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2053, age: 73, status: 'ALIVE', patrimonyStart: 8357901, totalIncome: 120000, totalExpenses: 120000, netResult: 0, growth: 334316, patrimonyEnd: 8692217, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2054, age: 74, status: 'ALIVE', patrimonyStart: 8692217, totalIncome: 120000, totalExpenses: 120000, netResult: 0, growth: 347689, patrimonyEnd: 9039906, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2055, age: 75, status: 'ALIVE', patrimonyStart: 9039906, totalIncome: 120000, totalExpenses: 180000, netResult: -60000, growth: 359196, patrimonyEnd: 9339102, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2056, age: 76, status: 'ALIVE', patrimonyStart: 9339102, totalIncome: 120000, totalExpenses: 180000, netResult: -60000, growth: 371164, patrimonyEnd: 9650266, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2057, age: 77, status: 'ALIVE', patrimonyStart: 9650266, totalIncome: 120000, totalExpenses: 180000, netResult: -60000, growth: 383611, patrimonyEnd: 9973877, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2058, age: 78, status: 'ALIVE', patrimonyStart: 9973877, totalIncome: 120000, totalExpenses: 180000, netResult: -60000, growth: 396555, patrimonyEnd: 10310432, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2059, age: 79, status: 'ALIVE', patrimonyStart: 10310432, totalIncome: 120000, totalExpenses: 180000, netResult: -60000, growth: 410017, patrimonyEnd: 10660449, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
    { year: 2060, age: 80, status: 'ALIVE', patrimonyStart: 10660449, totalIncome: 120000, totalExpenses: 180000, netResult: -60000, growth: 424018, patrimonyEnd: 11024467, financingPayments: 0, insurancePremiums: 0, insuranceValue: 0 },
];

// Projection comparison data (for multiple simulations)
export const mockProjectionsComparison = {
    simulations: [
        {
            simulationId: 1,
            simulationName: 'Plano Original',
            projections: mockProjections,
        },
        {
            simulationId: 2,
            simulationName: 'Situação atual 05/2025',
            projections: mockProjections.map(p => ({
                ...p,
                patrimonyEnd: p.patrimonyEnd * 0.85, // 15% menos
            })),
        },
    ],
};

// Timeline events
export interface TimelineEvent {
    id: number;
    year: number;
    label: string;
    value: number;
    type: 'income' | 'expense';
}

export const mockIncomeTimeline: TimelineEvent[] = [
    { id: 1, year: 2025, label: 'CLT: R$ 15.000', value: 15000, type: 'income' },
    { id: 2, year: 2030, label: 'CLT: R$ 15.000\nAutônomo: R$ 5.000', value: 20000, type: 'income' },
    { id: 3, year: 2035, label: 'Autônomo: R$ 35.000', value: 35000, type: 'income' },
    { id: 4, year: 2045, label: 'Aposentadoria', value: 10000, type: 'income' },
];

export const mockExpenseTimeline: TimelineEvent[] = [
    { id: 1, year: 2025, label: 'R$ 8.000', value: 8000, type: 'expense' },
    { id: 2, year: 2030, label: 'R$ 12.000', value: 12000, type: 'expense' },
    { id: 3, year: 2040, label: 'R$ 20.000', value: 20000, type: 'expense' },
    { id: 4, year: 2045, label: 'R$ 10.000', value: 10000, type: 'expense' },
    { id: 5, year: 2055, label: 'R$ 15.000', value: 15000, type: 'expense' },
];

// Patrimony summary for cards
export interface PatrimonySummary {
    year: number;
    label: string;
    age: number;
    value: number;
    percentChange?: number;
    isHighlight?: boolean;
}

export const mockPatrimonySummaries: PatrimonySummary[] = [
    { year: 2025, label: 'Hoje', age: 45, value: 2679930, isHighlight: true },
    { year: 2035, label: '', age: 55, value: 3173960, percentChange: 18.37 },
    { year: 2045, label: '', age: 65, value: 2173000, percentChange: -10.3 },
];

// API Types - matching backend schema

export interface Client {
    id: number;
    name: string;
    birthDate: string;
    createdAt: string;
    updatedAt: string;
}

export interface Simulation {
    id: number;
    name: string;
    startDate: string;
    realRate: number;
    version: number;
    isCurrentSituation: boolean;
    clientId: number;
    client?: Client;
    assets?: Asset[];
    movements?: Movement[];
    insurances?: Insurance[];
    createdAt: string;
    updatedAt: string;
}

export type AssetType = 'FINANCIAL' | 'REAL_ESTATE' | 'BUSINESS' | 'OTHER';

export interface Asset {
    id: number;
    name: string;
    type: AssetType;
    simulationId: number;
    records: AssetRecord[];
    financing?: Financing | null;
    createdAt: string;
    updatedAt: string;
}

export interface AssetRecord {
    id: number;
    value: number;
    date: string;
    assetId: number;
    createdAt: string;
}

export interface Financing {
    id: number;
    startDate: string;
    installments: number;
    interestRate: number;
    downPayment: number;
    assetId: number;
}

export type MovementType = 'INCOME' | 'EXPENSE';
export type IncomeCategory = 'WORK' | 'PASSIVE' | 'OTHER';
export type Frequency = 'ONCE' | 'MONTHLY' | 'YEARLY';

export interface Movement {
    id: number;
    name: string;
    type: MovementType;
    category?: IncomeCategory | null;
    value: number;
    frequency: Frequency;
    startDate: string;
    endDate?: string | null;
    simulationId: number;
    createdAt: string;
    updatedAt: string;
}

export type InsuranceType = 'LIFE' | 'DISABILITY' | 'HEALTH' | 'PROPERTY' | 'OTHER';

export interface Insurance {
    id: number;
    name: string;
    type: InsuranceType;
    startDate: string;
    durationMonths: number;
    premium: number;
    insuredValue: number;
    simulationId: number;
    createdAt: string;
    updatedAt: string;
}

// Projection Types
export type LifeStatus = 'ALIVE' | 'DEAD' | 'INVALID';

export interface YearProjection {
    year: number;
    age: number;
    status: LifeStatus;
    patrimonyStart: number;
    totalIncome: number;
    totalExpenses: number;
    netResult: number;
    growth: number;
    patrimonyEnd: number;
    financingPayments: number;
    insurancePremiums: number;
    insuranceValue: number;
}

export interface ProjectionResult {
    simulationId: number;
    simulationName: string;
    projections: YearProjection[];
}

export interface ProjectionComparison {
    simulations: ProjectionResult[];
}

// Form Types
export interface CreateClientInput {
    name: string;
    birthDate: string;
}

export interface CreateSimulationInput {
    name: string;
    startDate: string;
    realRate?: number;
    clientId: number;
}

export interface CreateAssetInput {
    name: string;
    type: AssetType;
    simulationId: number;
    initialValue: number;
    initialDate: string;
    financing?: {
        startDate: string;
        installments: number;
        interestRate: number;
        downPayment: number;
    };
}

export interface CreateMovementInput {
    name: string;
    type: MovementType;
    category?: IncomeCategory;
    value: number;
    frequency: Frequency;
    startDate: string;
    endDate?: string;
    simulationId: number;
}

export interface CreateInsuranceInput {
    name: string;
    type: InsuranceType;
    startDate: string;
    durationMonths: number;
    premium: number;
    insuredValue: number;
    simulationId: number;
}

export interface ProjectionInput {
    simulationId: number;
    endYear: number;
    lifeStatus?: LifeStatus;
}

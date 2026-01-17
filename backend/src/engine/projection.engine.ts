import type {
    Asset,
    AssetRecord,
    Movement,
    Insurance,
    Simulation,
    Financing,
    MovementType,
    Frequency,
    IncomeCategory,
    AssetType
} from '@prisma/client';
import type { LifeStatus } from '../schemas/projection.schema.js';

export interface ProjectionYear {
    year: number;
    financialAssets: number;
    realEstateAssets: number;
    totalPatrimony: number;
    totalPatrimonyWithoutInsurance: number;
    totalIncome: number;
    totalExpenses: number;
    netResult: number;
    insuranceValue: number;
}

export interface ProjectionResult {
    simulationId: number;
    simulationName: string;
    status: LifeStatus;
    startYear: number;
    endYear: number;
    realRate: number;
    projections: ProjectionYear[];
}

interface AssetWithRecords extends Asset {
    records: AssetRecord[];
    financing: Financing | null;
}

interface SimulationData extends Simulation {
    assets: AssetWithRecords[];
    movements: Movement[];
    insurances: Insurance[];
}

export class ProjectionEngine {
    private simulation: SimulationData;
    private status: LifeStatus;
    private endYear: number;

    constructor(simulation: SimulationData, status: LifeStatus, endYear: number = 2060) {
        this.simulation = simulation;
        this.status = status;
        this.endYear = endYear;
    }

    /**
     * Get the most recent asset record before a given date
     */
    private getAssetValueAtDate(asset: AssetWithRecords, date: Date): number {
        const relevantRecords = asset.records
            .filter(r => new Date(r.date) <= date)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return relevantRecords.length > 0 ? relevantRecords[0].value : 0;
    }

    /**
     * Calculate total asset value by type at a given date
     */
    private calculateAssetsByType(date: Date): { financial: number; realEstate: number } {
        let financial = 0;
        let realEstate = 0;

        for (const asset of this.simulation.assets) {
            const value = this.getAssetValueAtDate(asset, date);

            if (asset.type === 'FINANCIAL') {
                financial += value;
            } else {
                realEstate += value;
            }
        }

        return { financial, realEstate };
    }

    /**
     * Calculate movement value for a specific year based on frequency
     */
    private calculateMovementForYear(movement: Movement, year: number): number {
        const startYear = new Date(movement.startDate).getFullYear();
        const endYear = movement.endDate
            ? new Date(movement.endDate).getFullYear()
            : this.endYear;

        // Check if movement is active in this year
        if (year < startYear || year > endYear) {
            return 0;
        }

        // Apply income category rules for INVALID status
        if (this.status === 'INVALID' && movement.type === 'INCOME') {
            // Only WORK income stops for INVALID status
            if (movement.category === 'WORK') {
                return 0;
            }
        }

        // Apply DEAD status rules
        if (this.status === 'DEAD' && movement.type === 'INCOME') {
            // No income for DEAD status
            return 0;
        }

        let value = movement.value;

        // Apply frequency multiplier
        switch (movement.frequency) {
            case 'MONTHLY':
                value *= 12;
                break;
            case 'YEARLY':
                // Value is already yearly
                break;
            case 'ONCE':
                // Only applies in the start year
                if (year !== startYear) {
                    return 0;
                }
                break;
        }

        // Apply DEAD status rule: expenses are divided by 2
        if (this.status === 'DEAD' && movement.type === 'EXPENSE') {
            value /= 2;
        }

        return value;
    }

    /**
     * Calculate total income for a year
     */
    private calculateYearlyIncome(year: number): number {
        return this.simulation.movements
            .filter(m => m.type === 'INCOME')
            .reduce((total, m) => total + this.calculateMovementForYear(m, year), 0);
    }

    /**
     * Calculate total expenses for a year
     */
    private calculateYearlyExpenses(year: number): number {
        return this.simulation.movements
            .filter(m => m.type === 'EXPENSE')
            .reduce((total, m) => total + this.calculateMovementForYear(m, year), 0);
    }

    /**
     * Calculate insurance premiums for a year
     */
    private calculateYearlyInsurancePremiums(year: number): number {
        let totalPremiums = 0;

        for (const insurance of this.simulation.insurances) {
            const startDate = new Date(insurance.startDate);
            const endDate = new Date(insurance.startDate);
            endDate.setMonth(endDate.getMonth() + insurance.durationMonths);

            const insuranceStartYear = startDate.getFullYear();
            const insuranceEndYear = endDate.getFullYear();

            if (year >= insuranceStartYear && year <= insuranceEndYear) {
                // Calculate how many months of premium in this year
                let months = 12;

                if (year === insuranceStartYear) {
                    months = 12 - startDate.getMonth();
                }
                if (year === insuranceEndYear) {
                    months = Math.min(months, endDate.getMonth() + 1);
                }

                totalPremiums += insurance.premium * months;
            }
        }

        return totalPremiums;
    }

    /**
     * Calculate total active insurance value for a year
     */
    private calculateActiveInsuranceValue(year: number): number {
        let totalInsurance = 0;

        for (const insurance of this.simulation.insurances) {
            const startDate = new Date(insurance.startDate);
            const endDate = new Date(insurance.startDate);
            endDate.setMonth(endDate.getMonth() + insurance.durationMonths);

            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);

            // Check if insurance overlaps with this year
            if (startDate <= yearEnd && endDate >= yearStart) {
                totalInsurance += insurance.insuredValue;
            }
        }

        return totalInsurance;
    }

    /**
     * Calculate financing payments for a year
     */
    private calculateFinancingPayments(year: number): number {
        let totalPayments = 0;

        for (const asset of this.simulation.assets) {
            if (asset.financing) {
                const startDate = new Date(asset.financing.startDate);
                const startYear = startDate.getFullYear();
                const endYear = startYear + Math.ceil(asset.financing.installments / 12);

                if (year >= startYear && year <= endYear) {
                    // Calculate monthly payment using PMT formula
                    const principal = this.getAssetValueAtDate(asset, startDate) - asset.financing.downPayment;
                    const monthlyRate = asset.financing.interestRate / 12;
                    const monthlyPayment = principal *
                        (monthlyRate * Math.pow(1 + monthlyRate, asset.financing.installments)) /
                        (Math.pow(1 + monthlyRate, asset.financing.installments) - 1);

                    // How many payments in this year
                    let paymentsInYear = 12;
                    if (year === startYear) {
                        paymentsInYear = 12 - startDate.getMonth();
                    }
                    if (year === endYear) {
                        const remainingInstallments = asset.financing.installments % 12;
                        if (remainingInstallments > 0) {
                            paymentsInYear = Math.min(paymentsInYear, remainingInstallments);
                        }
                    }

                    totalPayments += monthlyPayment * paymentsInYear;
                }
            }
        }

        return totalPayments;
    }

    /**
     * Run the projection engine and generate year-by-year projections
     */
    run(): ProjectionResult {
        const startYear = new Date(this.simulation.startDate).getFullYear();
        const startDate = new Date(this.simulation.startDate);
        const projections: ProjectionYear[] = [];

        // Get initial asset values at simulation start date
        let { financial: financialAssets, realEstate: realEstateAssets } =
            this.calculateAssetsByType(startDate);

        for (let year = startYear; year <= this.endYear; year++) {
            const yearDate = new Date(year, 11, 31); // End of year

            // Calculate income and expenses for this year
            const totalIncome = this.calculateYearlyIncome(year);
            const totalExpenses = this.calculateYearlyExpenses(year);
            const insurancePremiums = this.calculateYearlyInsurancePremiums(year);
            const financingPayments = this.calculateFinancingPayments(year);

            // Net result before applying to patrimony
            const netResult = totalIncome - totalExpenses - insurancePremiums - financingPayments;

            // Apply compound interest rate to patrimony
            // Formula: (Patrimony + NetResult) * (1 + rate)
            const totalPatrimonyBeforeGrowth = financialAssets + realEstateAssets + netResult;
            const growthFactor = 1 + this.simulation.realRate;

            // Apply growth primarily to financial assets
            financialAssets = (financialAssets + netResult) * growthFactor;

            // Real estate appreciates at the same rate
            realEstateAssets = realEstateAssets * growthFactor;

            // Ensure no negative values (can't have negative patrimony)
            financialAssets = Math.max(0, financialAssets);

            const totalPatrimony = financialAssets + realEstateAssets;

            // Calculate insurance value active in this year
            const insuranceValue = this.calculateActiveInsuranceValue(year);

            // Total patrimony without insurance
            const totalPatrimonyWithoutInsurance = totalPatrimony;

            projections.push({
                year,
                financialAssets: Math.round(financialAssets * 100) / 100,
                realEstateAssets: Math.round(realEstateAssets * 100) / 100,
                totalPatrimony: Math.round((totalPatrimony + insuranceValue) * 100) / 100,
                totalPatrimonyWithoutInsurance: Math.round(totalPatrimonyWithoutInsurance * 100) / 100,
                totalIncome: Math.round(totalIncome * 100) / 100,
                totalExpenses: Math.round((totalExpenses + insurancePremiums + financingPayments) * 100) / 100,
                netResult: Math.round(netResult * 100) / 100,
                insuranceValue: Math.round(insuranceValue * 100) / 100,
            });
        }

        return {
            simulationId: this.simulation.id,
            simulationName: this.simulation.name,
            status: this.status,
            startYear,
            endYear: this.endYear,
            realRate: this.simulation.realRate,
            projections,
        };
    }
}

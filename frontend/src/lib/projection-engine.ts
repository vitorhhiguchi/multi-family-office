
import {
    Simulation,
    Asset,
    AssetRecord,
    Movement,
    Insurance,
    Financing,
    MovementType,
    Frequency,
    IncomeCategory,
    AssetType,
    LifeStatus,
    YearProjection
} from '@/types';

export interface ProjectionStats {
    finalPatrimony: number;
    retirementAge: number | null;
}

export class ProjectionEngine {
    private simulation: Simulation;
    private status: LifeStatus;
    private endYear: number;

    constructor(simulation: Simulation, status: LifeStatus = 'ALIVE', endYear: number = 2060) {
        this.simulation = simulation;
        this.status = status;
        this.endYear = endYear;
    }

    private getAssetValueAtDate(asset: Asset, date: Date): number {
        if (!asset.records || asset.records.length === 0) return 0;

        const relevantRecords = asset.records
            .filter(r => new Date(r.date) <= date)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return relevantRecords.length > 0 ? relevantRecords[0].value : 0;
    }

    private calculateAssetsByType(date: Date): { financial: number; realEstate: number } {
        let financial = 0;
        let realEstate = 0;

        for (const asset of (this.simulation.assets || [])) {
            const value = this.getAssetValueAtDate(asset, date);

            if (asset.type === 'FINANCIAL') {
                financial += value;
            } else {
                realEstate += value;
            }
        }

        return { financial, realEstate };
    }

    private calculateMovementForYear(movement: Movement, year: number): number {
        const startYear = new Date(movement.startDate).getFullYear();
        const endYear = movement.endDate
            ? new Date(movement.endDate).getFullYear()
            : this.endYear;

        if (year < startYear || year > endYear) {
            return 0;
        }

        if (this.status === 'INVALID' && movement.type === 'INCOME' && movement.category === 'WORK') {
            return 0;
        }

        if (this.status === 'DEAD' && movement.type === 'INCOME') {
            return 0;
        }

        let value = movement.value;

        switch (movement.frequency) {
            case 'MONTHLY':
                value *= 12;
                break;
            case 'ONCE':
                if (year !== startYear) return 0;
                break;
        }

        if (this.status === 'DEAD' && movement.type === 'EXPENSE') {
            value /= 2;
        }

        return value;
    }

    private calculateYearlyIncome(year: number): number {
        return (this.simulation.movements || [])
            .filter(m => m.type === 'INCOME')
            .reduce((total, m) => total + this.calculateMovementForYear(m, year), 0);
    }

    private calculateYearlyExpenses(year: number): number {
        return (this.simulation.movements || [])
            .filter(m => m.type === 'EXPENSE')
            .reduce((total, m) => total + this.calculateMovementForYear(m, year), 0);
    }

    private calculateYearlyInsurancePremiums(year: number): number {
        let totalPremiums = 0;

        for (const insurance of (this.simulation.insurances || [])) {
            const startDate = new Date(insurance.startDate);
            const endDate = new Date(insurance.startDate);
            endDate.setMonth(endDate.getMonth() + insurance.durationMonths);

            const insuranceStartYear = startDate.getFullYear();
            const insuranceEndYear = endDate.getFullYear();

            if (year >= insuranceStartYear && year <= insuranceEndYear) {
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

    private calculateActiveInsuranceValue(year: number): number {
        let totalInsurance = 0;

        for (const insurance of (this.simulation.insurances || [])) {
            const startDate = new Date(insurance.startDate);
            const endDate = new Date(insurance.startDate);
            endDate.setMonth(endDate.getMonth() + insurance.durationMonths);

            const yearStart = new Date(year, 0, 1);
            const yearEnd = new Date(year, 11, 31);

            if (startDate <= yearEnd && endDate >= yearStart) {
                totalInsurance += insurance.insuredValue;
            }
        }

        return totalInsurance;
    }

    private calculateFinancingPayments(year: number): number {
        let totalPayments = 0;

        for (const asset of (this.simulation.assets || [])) {
            if (asset.financing) {
                const startDate = new Date(asset.financing.startDate);
                const startYear = startDate.getFullYear();
                const endYear = startYear + Math.ceil(asset.financing.installments / 12);

                if (year >= startYear && year <= endYear) {
                    // Calculate monthly payment using PMT formula
                    const principal = this.getAssetValueAtDate(asset, startDate) - asset.financing.downPayment;
                    const monthlyRate = asset.financing.interestRate / 12;
                    // Fix: Handle zero interest rate to avoid division by zero
                    let monthlyPayment = 0;
                    if (monthlyRate === 0) {
                        monthlyPayment = principal / asset.financing.installments;
                    } else {
                        monthlyPayment = principal *
                            (monthlyRate * Math.pow(1 + monthlyRate, asset.financing.installments)) /
                            (Math.pow(1 + monthlyRate, asset.financing.installments) - 1);
                    }

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

    public calculateStats(): ProjectionStats {
        const startYear = new Date(this.simulation.startDate).getFullYear();
        const startDate = new Date(this.simulation.startDate);

        let { financial: financialAssets, realEstate: realEstateAssets } =
            this.calculateAssetsByType(startDate);

        // Run projection until endYear
        for (let year = startYear; year <= this.endYear; year++) {
            const totalIncome = this.calculateYearlyIncome(year);
            const totalExpenses = this.calculateYearlyExpenses(year);
            const insurancePremiums = this.calculateYearlyInsurancePremiums(year);
            const financingPayments = this.calculateFinancingPayments(year);
            const netResult = totalIncome - totalExpenses - insurancePremiums - financingPayments;

            const growthFactor = 1 + this.simulation.realRate;
            financialAssets = (financialAssets + netResult) * growthFactor;
            realEstateAssets = realEstateAssets * growthFactor;
            financialAssets = Math.max(0, financialAssets);
        }

        const totalPatrimony = financialAssets + realEstateAssets;

        // Calculate Retirement Age
        // Definition: Age where the last WORK income ends
        let maxWorkEndDate: Date | null = null;
        let hasWorkIncome = false;

        const workMovements = (this.simulation.movements || []).filter(m =>
            m.type === 'INCOME' && m.category === 'WORK'
        );

        if (workMovements.length > 0) {
            hasWorkIncome = true;
            for (const m of workMovements) {
                if (!m.endDate) {
                    // If any work income has no end date, retirement is essentially "never" or at endYear
                    maxWorkEndDate = new Date(this.endYear, 11, 31);
                    break;
                }
                const endDate = new Date(m.endDate);
                if (!maxWorkEndDate || endDate > maxWorkEndDate) {
                    maxWorkEndDate = endDate;
                }
            }
        }

        let retirementAge: number | null = null;
        if (maxWorkEndDate && this.simulation.client) {
            const birthDate = new Date(this.simulation.client.birthDate);
            const retirementYear = maxWorkEndDate.getFullYear();
            const birthYear = birthDate.getFullYear();
            retirementAge = retirementYear - birthYear;
        }

        return {
            finalPatrimony: totalPatrimony,
            retirementAge: retirementAge
        };
    }
}

export const getSimulationStats = (simulation: Simulation): ProjectionStats => {
    const engine = new ProjectionEngine(simulation);
    return engine.calculateStats();
}

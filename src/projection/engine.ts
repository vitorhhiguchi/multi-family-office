/**
 * Motor de Projeção Patrimonial - Base
 *
 * Função pura que calcula a projeção ano a ano aplicando
 * taxa real composta sobre o patrimônio.
 *
 * Escopo atual (MVP):
 * - Aplica juros compostos anuais
 * - Juros compostos emergem da aplicação anual da taxa sobre o patrimônio acumulado ao longo do loop
 * - Separa patrimônio financeiro e imobilizado
 * - Ignora movimentações, seguros e mudanças de status
 */

import {
    LifeStatus,
    PatrimonyBreakdown,
    ProjectionResult,
    Simulation,
    YearlyProjectionResult,
} from '../../domain/projection.types';

/**
 * Cria um PatrimonyBreakdown a partir de valores financeiro e imobiliário.
 */
function createPatrimonyBreakdown(financial: number, realEstate: number): PatrimonyBreakdown {
    return {
        financial,
        realEstate,
        total: financial + realEstate,
    };
}

/**
 * Aplica a taxa real composta sobre um valor.
 * @param value Valor base
 * @param rate Taxa como decimal (ex: 0.05 para 5%)
 * @returns Rendimento gerado (não o valor total)
 */
function calculateAnnualReturn(value: number, rate: number): number {
    return value * rate;
}

/**
 * Gera a projeção patrimonial ano a ano.
 *
 * Nesta versão base:
 * - A taxa real é aplicada sobre o patrimônio total no início de cada ano
 * - O rendimento é distribuído proporcionalmente entre financeiro e imobilizado
 * - Movimentações, seguros e status de vida são ignorados
 *
 * @param simulation Configuração da simulação
 * @returns Resultado da projeção com lista de resultados anuais
 */
export function runProjection(simulation: Simulation): ProjectionResult {
    const { startYear, endYear, annualRealRate, initialPatrimony } = simulation;

    const yearlyResults: YearlyProjectionResult[] = [];

    let currentFinancial = initialPatrimony.financial;
    let currentRealEstate = initialPatrimony.realEstate;

    for (let year = startYear; year <= endYear; year++) {
        const patrimonyStart = createPatrimonyBreakdown(currentFinancial, currentRealEstate);

        // Calcula rendimento sobre o patrimônio total
        const totalStart = patrimonyStart.total;
        const investmentReturn = calculateAnnualReturn(totalStart, annualRealRate);

        // Distribui o rendimento proporcionalmente
        // Se patrimônio total é 0, não há distribuição
        let financialReturn = 0;
        let realEstateReturn = 0;

        if (totalStart > 0) {
            const financialRatio = currentFinancial / totalStart;
            const realEstateRatio = currentRealEstate / totalStart;
            financialReturn = investmentReturn * financialRatio;
            realEstateReturn = investmentReturn * realEstateRatio;
        }

        // Atualiza patrimônio para o final do ano
        currentFinancial += financialReturn;
        currentRealEstate += realEstateReturn;

        const patrimonyEnd = createPatrimonyBreakdown(currentFinancial, currentRealEstate);

        yearlyResults.push({
            year,
            lifeStatus: LifeStatus.ALIVE, // Ignorado nesta versão / status dinâmico será tratado em etapa futura
            patrimonyStart,
            patrimonyEnd,
            totalInflows: 0, // Ignorado nesta versão
            totalOutflows: 0, // Ignorado nesta versão
            investmentReturn,
            insuranceImpact: 0, // Ignorado nesta versão
        });
    }

    return {
        simulationId: simulation.id,
        yearlyResults,
    };
}

/**
 * DOMÍNIO: PROJEÇÃO PATRIMONIAL
 *
 * Modelo de domínio focado exclusivamente no motor de projeção.
 * O escopo foi mantido intencionalmente reduzido para priorizar:
 * - clareza das regras de negócio
 * - facilidade de teste
 * - alinhamento com o core do case técnico
 *
 * Estruturas não essenciais ao cálculo da projeção
 * (persistência, histórico detalhado, validações)
 * foram deixadas fora deste modelo.
 */

// ============================================================================
// ENUMS
// ============================================================================

/** Status de vida do titular - impacta regras de receitas/despesas */
export enum LifeStatus {
    /** Todas as movimentações aplicadas normalmente */
    ALIVE = 'ALIVE',
    /** Despesas divididas por 2, sem entradas futuras */
    DECEASED = 'DECEASED',
    /** Entradas de trabalho encerradas, despesas mantidas */
    DISABLED = 'DISABLED',
}

/** Direção da movimentação */
export enum MovementDirection {
    INFLOW = 'INFLOW',
    OUTFLOW = 'OUTFLOW',
}

/** Frequência da movimentação */
export enum MovementFrequency {
    ONE_TIME = 'ONE_TIME',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY',
}

/** Categoria da movimentação - usada para aplicar regras de status de vida */
export enum MovementCategory {
    /** Renda do trabalho - afetada por DISABLED e DECEASED */
    WORK_INCOME = 'WORK_INCOME',
    /** Outras entradas - afetadas apenas por DECEASED */
    OTHER_INCOME = 'OTHER_INCOME',
    /** Despesas - divididas por 2 em DECEASED */
    EXPENSE = 'EXPENSE',
}

// ============================================================================
// ENTIDADES DE ENTRADA
// ============================================================================

/** Patrimônio inicial separado por tipo */
export interface InitialPatrimony {
    /** Soma de ativos financeiros (investimentos, poupança, etc.) */
    financial: number;
    /** Soma de ativos imobilizados (imóveis, veículos, etc.) */
    realEstate: number;
}

/** Movimentação financeira (entrada ou saída) */
export interface Movement {
    id: string;
    name: string;
    direction: MovementDirection;
    category: MovementCategory;
    frequency: MovementFrequency;
    /** Valor da movimentação (em unidade monetária consistente em todo o motor) */
    amount: number;
    /** Ano de início da movimentação */
    startYear: number;
    /** Ano de término (opcional - se ausente, continua até o fim) */
    endYear?: number;
}

/** Seguro que pode impactar o patrimônio */
export interface Insurance {
    id: string;
    name: string;
    /** Valor da cobertura (indenização) */
    coverageAmount: number;
    /** Valor mensal do prêmio (custo) */
    monthlyPremium: number;
    /** Condição de acionamento */
    triggerCondition: LifeStatus;
}

/** Evento de mudança de status de vida */
export interface LifeStatusEvent {
    year: number;
    status: LifeStatus;
}

/** Configuração da simulação */
export interface Simulation {
    id: string;
    name: string;
    /** Ano de início da projeção */
    startYear: number;
    /** Ano final da projeção (padrão: 2060) */
    endYear: number;
    /** Taxa real composta anual (ex: 0.05 = 5%) */
    annualRealRate: number;
    /** Patrimônio inicial */
    initialPatrimony: InitialPatrimony;
    /** Movimentações vinculadas à simulação */
    movements: Movement[];
    /** Seguros vinculados à simulação */
    insurances: Insurance[];
    /** Status de vida inicial */
    initialLifeStatus: LifeStatus;
    /** Eventos de mudança de status ao longo do tempo */
    lifeStatusEvents: LifeStatusEvent[];
    /** Se true, considera seguros no cálculo */
    includeInsurance: boolean;
}

// ============================================================================
// RESULTADO DA PROJEÇÃO
// ============================================================================

/** Patrimônio em um determinado momento */
export interface PatrimonyBreakdown {
    financial: number;
    realEstate: number;
    total: number;
}

/** Resultado da projeção para um ano específico */
export interface YearlyProjectionResult {
    year: number;
    lifeStatus: LifeStatus;
    /** Patrimônio no início do ano */
    patrimonyStart: PatrimonyBreakdown;
    /** Patrimônio no final do ano */
    patrimonyEnd: PatrimonyBreakdown;
    /** Total de entradas no ano */
    totalInflows: number;
    /** Total de saídas no ano */
    totalOutflows: number;
    /** Rendimento pela taxa real composta */
    investmentReturn: number;
    /** Impacto de seguros (prêmios pagos ou indenização recebida) */
    insuranceImpact: number;
}

/** Resultado completo da simulação */
export interface ProjectionResult {
    simulationId: string;
    yearlyResults: YearlyProjectionResult[];
}

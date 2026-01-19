'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateAssetInput, Asset } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { CalendarIcon, Building2, Wallet } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AssetModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: CreateAssetInput) => Promise<void>;
    simulationId: number;
    initialData?: Asset | null;
}

export function AssetModal({ open, onOpenChange, onSubmit, simulationId, initialData }: AssetModalProps) {
    const [isLoading, setIsLoading] = useState(false);


    const [type, setType] = useState<'FINANCIAL' | 'REAL_ESTATE'>('FINANCIAL');
    const [name, setName] = useState('');
    const [initialValue, setInitialValue] = useState('');
    const [initialDate, setInitialDate] = useState(format(new Date(), 'yyyy-MM-dd'));


    const [isFinanced, setIsFinanced] = useState(false);
    const [downPayment, setDownPayment] = useState('');
    const [installments, setInstallments] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [financingStartDate, setFinancingStartDate] = useState('');

    useEffect(() => {
        if (open) {
            if (initialData) {
                setType(initialData.type === 'REAL_ESTATE' ? 'REAL_ESTATE' : 'FINANCIAL');
                setName(initialData.name);
                // Edição simplificada: apenas nome e detalhes de financiamento (se imóvel).
                // Valor inicial é histórico e não editável neste contexto.
                setName(initialData.name);

                const initialRecord = initialData.records?.[0];
                setInitialValue(initialRecord ? initialRecord.value.toString() : '');
                setInitialDate(initialRecord ? initialRecord.date.substring(0, 10) : format(new Date(), 'yyyy-MM-dd'));

                if (initialData.financing) {
                    setIsFinanced(true);
                    setDownPayment(initialData.financing.downPayment.toString());
                    setInstallments(initialData.financing.installments.toString());
                    setInterestRate(initialData.financing.interestRate.toString());
                    setFinancingStartDate(initialData.financing.startDate.substring(0, 10));
                } else {
                    setIsFinanced(false);
                }
            } else {
                // Reseta formulário para criação
                setName('');
                setInitialValue('');
                setInitialDate(format(new Date(), 'yyyy-MM-dd'));
                setIsFinanced(false);
                setDownPayment('');
                setInstallments('');
                setInterestRate('');
                setFinancingStartDate('');
                setType('FINANCIAL'); // Padrão
            }
        }
    }, [open, initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const initialVal = parseFloat(initialValue) || 0;
            const downPay = parseFloat(downPayment) || 0;

            if (type === 'REAL_ESTATE' && isFinanced && downPay >= initialVal) {
                toast.error("O valor da entrada deve ser menor que o valor total do ativo.");
                setIsLoading(false);
                return;
            }

            const payload: CreateAssetInput = {
                simulationId,
                name,
                type,
                initialValue: initialVal,
                initialDate,
                financing: (type === 'REAL_ESTATE' && isFinanced) ? {
                    startDate: financingStartDate || initialDate,
                    installments: parseInt(installments) || 0,
                    interestRate: parseFloat(interestRate) || 0,
                    downPayment: downPay,
                } : undefined
            };

            await onSubmit(payload);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-[#333333] text-foreground">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Editar Alocação' : 'Nova Alocação'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {!initialData && (
                        <div className="grid grid-cols-2 gap-2 bg-black/20 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setType('FINANCIAL')}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                                    type === 'FINANCIAL'
                                        ? "bg-[#6777FA] text-white"
                                        : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <Wallet className="h-4 w-4" />
                                Financeira
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('REAL_ESTATE')}
                                className={cn(
                                    "flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
                                    type === 'REAL_ESTATE'
                                        ? "bg-[#03B6AD] text-white"
                                        : "text-muted-foreground hover:bg-white/5"
                                )}
                            >
                                <Building2 className="h-4 w-4" />
                                Imobilizada
                            </button>
                        </div>
                    )}


                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={type === 'FINANCIAL' ? "Ex: CDB Banco C6" : "Ex: Apartamento Vila Olímpia"}
                                className="bg-black/20 border-[#333333]"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valor Inicial</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={initialValue}
                                    onChange={(e) => setInitialValue(e.target.value)}
                                    placeholder="0,00"
                                    className="bg-black/20 border-[#333333]"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data Inicial</Label>
                                <Input
                                    type="date"
                                    value={initialDate}
                                    onChange={(e) => setInitialDate(e.target.value)}
                                    className="bg-black/20 border-[#333333]"
                                    required
                                />
                            </div>
                        </div>
                    </div>


                    {type === 'REAL_ESTATE' && (
                        <div className="pt-2 border-t border-[#333333] space-y-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="financed"
                                    checked={isFinanced}
                                    onCheckedChange={(c) => setIsFinanced(!!c)}
                                />
                                <Label htmlFor="financed">Incluir financiamento</Label>
                            </div>

                            {isFinanced && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 bg-black/40 p-4 rounded-lg border border-[#333333]">
                                    <h4 className="text-sm font-semibold text-muted-foreground mb-2">Detalhes do Financiamento</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Valor Entrada</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={downPayment}
                                                onChange={(e) => setDownPayment(e.target.value)}
                                                className="bg-black/20 border-[#333333]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nº Parcelas</Label>
                                            <Input
                                                type="number"
                                                value={installments}
                                                onChange={(e) => setInstallments(e.target.value)}
                                                className="bg-black/20 border-[#333333]"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Taxa Juros (% a.a.)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={interestRate}
                                                onChange={(e) => setInterestRate(e.target.value)}
                                                placeholder="10.5"
                                                className="bg-black/20 border-[#333333]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Início Pagamento</Label>
                                            <Input
                                                type="date"
                                                value={financingStartDate}
                                                onChange={(e) => setFinancingStartDate(e.target.value)}
                                                className="bg-black/20 border-[#333333]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#6777FA] hover:bg-[#5566EA] text-white"
                        >
                            {isLoading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

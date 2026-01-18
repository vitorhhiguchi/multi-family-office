'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { ptBR } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Schema Validation
const movementSchema = z.object({
    name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    type: z.enum(['INCOME', 'EXPENSE']),
    value: z.coerce.number().min(0.01, { message: 'Valor deve ser maior que zero' }),
    frequency: z.enum(['ONCE', 'MONTHLY', 'YEARLY']),
    startDate: z.date(),
    endDate: z.date().optional().nullable(),
    inflationAdjusted: z.boolean().default(true),
}).refine((data) => {
    if (data.frequency !== 'ONCE' && data.endDate && data.endDate < data.startDate) {
        return false;
    }
    return true;
}, {
    message: 'Data final deve ser após a data inicial',
    path: ['endDate'],
});

export type MovementFormData = z.infer<typeof movementSchema>;

interface MovementModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: MovementFormData) => Promise<void>;
    initialData?: MovementFormData | null;
    trigger?: React.ReactNode;
}

export function MovementModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    trigger
}: MovementModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<MovementFormData>({
        resolver: zodResolver(movementSchema),
        defaultValues: {
            name: '',
            type: 'INCOME',
            value: 0,
            frequency: 'MONTHLY',
            inflationAdjusted: true,
        },
    });

    // Reset form when opening/closing or changing initialData
    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset(initialData);
            } else {
                form.reset({
                    name: '',
                    type: 'INCOME',
                    value: 0,
                    frequency: 'MONTHLY',
                    inflationAdjusted: true,
                    startDate: new Date(),
                    endDate: undefined,
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = async (data: MovementFormData) => {
        try {
            setIsSubmitting(true);
            await onSubmit(data);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const type = form.watch('type');
    const frequency = form.watch('frequency');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] bg-[#1a1a1a] border-[#333] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {initialData ? 'Editar Movimentação' : 'Nova Movimentação'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Preencha os dados da movimentação financeira para a projeção.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">

                        {/* Type Selection (Radio-like visual) */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => field.onChange('INCOME')}
                                        className={cn(
                                            "cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:bg-[#262626]",
                                            field.value === 'INCOME'
                                                ? "border-[#48F7A1] bg-[#262626]"
                                                : "border-[#333] bg-[#0f0f0f]"
                                        )}
                                    >
                                        <span className={cn(
                                            "font-bold block",
                                            field.value === 'INCOME' ? "text-[#48F7A1]" : "text-slate-400"
                                        )}>Receita</span>
                                    </div>
                                    <div
                                        onClick={() => field.onChange('EXPENSE')}
                                        className={cn(
                                            "cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:bg-[#262626]",
                                            field.value === 'EXPENSE'
                                                ? "border-[#FF5151] bg-[#262626]"
                                                : "border-[#333] bg-[#0f0f0f]"
                                        )}
                                    >
                                        <span className={cn(
                                            "font-bold block",
                                            field.value === 'EXPENSE' ? "text-[#FF5151]" : "text-slate-400"
                                        )}>Despesa</span>
                                    </div>
                                </div>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ex: Salário, Aluguel..." {...field} className="bg-[#0f0f0f] border-[#333]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Value */}
                            <FormField
                                control={form.control}
                                name="value"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor (R$)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="0,00"
                                                {...field}
                                                className="bg-[#0f0f0f] border-[#333]"
                                                step="0.01"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Frequency */}
                            <FormField
                                control={form.control}
                                name="frequency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Frequência</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="bg-[#0f0f0f] border-[#333]">
                                                    <SelectValue placeholder="Selecione..." />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                                                <SelectItem value="MONTHLY">Mensal</SelectItem>
                                                <SelectItem value="YEARLY">Anual</SelectItem>
                                                <SelectItem value="ONCE">Única</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Inflation Adjusted */}
                            <FormField
                                control={form.control}
                                name="inflationAdjusted"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-[#333] p-4 bg-[#0f0f0f] mt-auto h-[40px] items-center">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="border-white/50 data-[state=checked]:bg-[#f05a28] data-[state=checked]:border-[#f05a28]"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>Correção inflacionária</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Start Date */}
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Data de Início</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-full pl-3 text-left font-normal bg-[#0f0f0f] border-[#333] hover:bg-[#262626] hover:text-white",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(field.value, "PPP", { locale: ptBR })
                                                        ) : (
                                                            <span>Selecione uma data</span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#333]" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    initialFocus
                                                    className="bg-[#1a1a1a] text-white"
                                                    classNames={{
                                                        day_selected: "bg-[#f05a28] text-white hover:bg-[#f05a28] hover:text-white focus:bg-[#f05a28] focus:text-white",
                                                        day_today: "bg-[#262626] text-white",
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* End Date (if not ONCE) */}
                            {frequency !== 'ONCE' && (
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Data Final (Opcional)</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal bg-[#0f0f0f] border-[#333] hover:bg-[#262626] hover:text-white",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP", { locale: ptBR })
                                                            ) : (
                                                                <span>Indeterminado</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#333]" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value || undefined}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < form.getValues('startDate')
                                                        }
                                                        initialFocus
                                                        className="bg-[#1a1a1a] text-white"
                                                        classNames={{
                                                            day_selected: "bg-[#f05a28] text-white hover:bg-[#f05a28] hover:text-white focus:bg-[#f05a28] focus:text-white",
                                                            day_today: "bg-[#262626] text-white",
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription className="text-xs">
                                                Deixe em branco para perpétuo
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="bg-transparent border-[#333] hover:bg-[#262626] hover:text-white"
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-[#f05a28] hover:bg-[#d94a1c] text-white">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

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
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

// Schema Validation
const insuranceSchema = z.object({
    name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    type: z.enum(['LIFE', 'DISABILITY', 'HEALTH', 'PROPERTY', 'OTHER']),
    startDate: z.date(),
    durationMonths: z.coerce.number().min(1, { message: 'Duração deve ser maior que 0' }),
    premiumValue: z.coerce.number().min(0.01, { message: 'Prêmio deve ser maior que zero' }),
    insuredValue: z.coerce.number().min(0.01, { message: 'Valor segurado deve ser maior que zero' }),
});

export type InsuranceFormData = z.infer<typeof insuranceSchema>;

interface InsuranceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: InsuranceFormData) => Promise<void>;
    initialData?: InsuranceFormData | null;
    trigger?: React.ReactNode;
}

export function InsuranceModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    trigger
}: InsuranceModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<InsuranceFormData>({
        resolver: zodResolver(insuranceSchema) as any,
        defaultValues: {
            name: '',
            type: 'LIFE',
            startDate: new Date(),
            durationMonths: 12,
            premiumValue: 0,
            insuredValue: 0,
        } as any,
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset(initialData);
            } else {
                form.reset({
                    name: '',
                    type: 'LIFE',
                    startDate: new Date(),
                    durationMonths: 120, // 10 years default
                    premiumValue: 0,
                    insuredValue: 0,
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = async (data: InsuranceFormData) => {
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-[#333] text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {initialData ? 'Editar Seguro' : 'Novo Seguro'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Configure o seguro de vida, invalidez ou outros.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">

                        {/* Name */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Seguro</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Seguro de Vida Prudential" {...field} className="bg-[#0f0f0f] border-[#333]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Type */}
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Seguro</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-[#0f0f0f] border-[#333] text-white">
                                                <SelectValue placeholder="Selecione o tipo" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                                            <SelectItem value="LIFE">Vida</SelectItem>
                                            <SelectItem value="DISABILITY">Invalidez</SelectItem>
                                            <SelectItem value="HEALTH">Saúde</SelectItem>
                                            <SelectItem value="PROPERTY">Patrimonial</SelectItem>
                                            <SelectItem value="OTHER">Outros</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
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

                            {/* Duration */}
                            <FormField
                                control={form.control}
                                name="durationMonths"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duração (meses)</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} className="bg-[#0f0f0f] border-[#333]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Premium */}
                            <FormField
                                control={form.control}
                                name="premiumValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Prêmio Mensal (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} className="bg-[#0f0f0f] border-[#333]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Insured Value */}
                            <FormField
                                control={form.control}
                                name="insuredValue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor Segurado (R$)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} className="bg-[#0f0f0f] border-[#333]" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
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

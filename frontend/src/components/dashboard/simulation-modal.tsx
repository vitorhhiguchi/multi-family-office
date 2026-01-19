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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Validação de Schema
const simulationSchema = z.object({
    name: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    startDate: z.date({ required_error: 'Data de início é obrigatória' }),
    inflationRate: z.coerce.number().min(0).max(100),
});

export type SimulationFormData = z.infer<typeof simulationSchema>;

interface SimulationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: SimulationFormData) => Promise<void>;
    initialData?: SimulationFormData | null;
    trigger?: React.ReactNode;
}

export function SimulationModal({
    open,
    onOpenChange,
    onSubmit,
    initialData,
    trigger
}: SimulationModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<SimulationFormData>({
        resolver: zodResolver(simulationSchema),
        defaultValues: {
            name: '',
            inflationRate: 4,
        },
    });

    useEffect(() => {
        if (open) {
            if (initialData) {
                form.reset(initialData);
            } else {
                form.reset({
                    name: '',
                    startDate: new Date(),
                    inflationRate: 4,
                });
            }
        }
    }, [open, initialData, form]);

    const handleSubmit = async (data: SimulationFormData) => {
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
                        {initialData ? 'Editar Simulação' : 'Nova Simulação'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Defina os parâmetros globais desta simulação.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome da Simulação</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Cenário Otimista" {...field} className="bg-[#0f0f0f] border-[#333]" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
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

                            <FormField
                                control={form.control}
                                name="inflationRate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Taxa Real (% a.a.)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} className="bg-[#0f0f0f] border-[#333]" />
                                        </FormControl>
                                        <FormDescription className="text-xs text-slate-500">
                                            Acima da inflação
                                        </FormDescription>
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

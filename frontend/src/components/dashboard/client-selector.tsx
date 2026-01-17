'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import type { Client } from '@/types';

interface ClientSelectorProps {
    clients: Client[];
    selectedClient: Client | null;
    onSelect: (client: Client) => void;
}

export function ClientSelector({
    clients,
    selectedClient,
    onSelect,
}: ClientSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'flex items-center gap-3 px-5 py-3 rounded-full border border-border',
                    'bg-card hover:border-primary/50 transition-colors',
                    'text-lg font-medium'
                )}
            >
                <span>{selectedClient?.name || 'Selecione um cliente'}</span>
                <ChevronDown
                    className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-64 bg-card border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                        {clients.map((client) => (
                            <button
                                key={client.id}
                                onClick={() => {
                                    onSelect(client);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    'w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                                    selectedClient?.id === client.id && 'bg-muted/30'
                                )}
                            >
                                <span className="font-medium">{client.name}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

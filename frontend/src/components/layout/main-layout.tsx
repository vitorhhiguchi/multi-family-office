'use client';

import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface MainLayoutProps {
    children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 lg:ml-0 min-h-screen min-w-0">
                {children}
            </main>
        </div>
    );
}

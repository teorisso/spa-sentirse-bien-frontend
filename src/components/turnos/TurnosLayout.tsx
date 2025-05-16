// src/components/turnos/TurnosLayout.tsx
'use client';

import React, { ReactNode } from 'react';
import PageHero from '../PageHero';

interface TurnosLayoutProps {
    title: string;
    description?: string;
    children: ReactNode;
}

export default function TurnosLayout({ title, description, children }: TurnosLayoutProps) {
    return (
        <>
            <PageHero title={title} description={description || ''} />
            <main className="max-w-2xl mx-auto py-8">
                {children}
            </main>
        </>
    );
}

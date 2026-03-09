'use client';

import * as ToastPrimitive from '@radix-ui/react-toast';
import { createContext, useCallback, useContext, useState } from 'react';

interface ToastData {
    id: string;
    title: string;
    description?: string;
    type?: 'success' | 'error' | 'info';
}

interface ToastContextValue {
    toast: (data: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => { } });

export function useToast() {
    return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const toast = useCallback((data: Omit<ToastData, 'id'>) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        setToasts((current) => [...current, { ...data, id }]);
    }, []);

    function removeToast(id: string) {
        setToasts((current) => current.filter((t) => t.id !== id));
    }

    return (
        <ToastContext.Provider value={{ toast }}>
            <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
                {children}
                {toasts.map((t) => (
                    <ToastPrimitive.Root
                        key={t.id}
                        className="toast-root"
                        data-type={t.type || 'info'}
                        onOpenChange={(open) => {
                            if (!open) removeToast(t.id);
                        }}
                    >
                        <div>
                            <ToastPrimitive.Title className="toast-title">{t.title}</ToastPrimitive.Title>
                            {t.description && (
                                <ToastPrimitive.Description className="toast-description">
                                    {t.description}
                                </ToastPrimitive.Description>
                            )}
                        </div>
                        <ToastPrimitive.Close className="btn-ghost" aria-label="Close">
                            ✕
                        </ToastPrimitive.Close>
                    </ToastPrimitive.Root>
                ))}
                <ToastPrimitive.Viewport className="toast-viewport" />
            </ToastPrimitive.Provider>
        </ToastContext.Provider>
    );
}

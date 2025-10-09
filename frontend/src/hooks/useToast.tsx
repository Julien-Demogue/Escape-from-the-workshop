import React, { useCallback, useRef, useState } from 'react';

export const useToast = () => {
    const [message, setMessage] = useState<string | null>(null);
    const timerRef = useRef<number | null>(null);

    const clear = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setMessage(null);
    }, []);

    const showToast = useCallback((msg: string, duration = 3000) => {
        // debug log to help diagnose visibility issues
        console.debug('[useToast] showToast', msg, duration);

        // cancel previous timer
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        setMessage(msg);
        if (duration > 0) {
            // store the id so we can clear it if showToast is called again
            timerRef.current = window.setTimeout(() => {
                setMessage(null);
                timerRef.current = null;
            }, duration) as unknown as number;
        }
    }, []);

    const Toast: React.FC = () => {
        if (!message) return null;
        console.debug('[useToast] render Toast', message);
        return (
            <div className="fixed left-1/2 transform -translate-x-1/2 bottom-8 z-50 pointer-events-auto">
                <div className="toast">{message}</div>
                <style>{`
                    .toast {
                        background: rgba(20,20,20,0.9);
                        color: #fff;
                        padding: 0.6rem 1rem;
                        border-radius: 0.5rem;
                        box-shadow: 0 6px 18px rgba(0,0,0,0.4);
                        font-weight: 600;
                        backdrop-filter: blur(4px);
                        animation: toast-in 200ms ease;
                    }
                    @keyframes toast-in {
                        from { transform: translateY(8px) scale(0.98); opacity: 0; }
                        to { transform: translateY(0) scale(1); opacity: 1; }
                    }
                `}</style>
            </div>
        );
    };

    return { showToast, clearToast: clear, Toast } as const;
};

export default useToast;

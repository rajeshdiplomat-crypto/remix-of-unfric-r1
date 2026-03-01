import React, { ReactNode } from "react";
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from "react-error-boundary";
import { Button } from "@/components/ui/button";

interface Props {
    children?: ReactNode;
}

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
    const errObj = error as Error;
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-background">
            <div className="max-w-md w-full space-y-4">
                <h2 className="text-2xl font-bold text-destructive">Something went wrong</h2>
                <p className="text-muted-foreground text-sm">
                    We're sorry, but an unexpected error occurred.
                </p>
                {errObj && (
                    <pre className="text-xs text-left bg-muted p-4 rounded-md overflow-auto max-h-40">
                        {errObj.message}
                    </pre>
                )}
                <Button
                    onClick={resetErrorBoundary}
                    variant="default"
                    className="mt-4"
                >
                    Refresh Page
                </Button>
            </div>
        </div>
    );
}

export function ErrorBoundary({ children }: Props) {
    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => window.location.reload()}
            onError={(error, info) => {
                console.error("Uncaught error:", error, info);
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}

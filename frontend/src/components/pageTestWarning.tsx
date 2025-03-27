"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

interface TestPageWarningProps {
    selectedAnswers: Record<number, string>;
    showResults: boolean;
    // currentQuestion: number;
    totalQuestions: number;
}

const TestPageWarning: React.FC<TestPageWarningProps> = ({
    selectedAnswers,
    showResults,
    // currentQuestion,
    totalQuestions
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [showDialog, setShowDialog] = useState<boolean>(false);
    const [attemptedPath, setAttemptedPath] = useState<string | null>(null);

    // Check if test is in progress
    const hasUnsavedProgress = !showResults && Object.keys(selectedAnswers).length > 0;

    // Function to prevent navigation
    const preventNavigation = useCallback((event: Event) => {
        if (hasUnsavedProgress) {
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    }, [hasUnsavedProgress]);

    useEffect(() => {
        if (!hasUnsavedProgress) return;

        // Handle browser back/forward/refresh
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            const message = 'You have an ongoing test. If you leave, your progress will be lost.';
            event.preventDefault();
            event.returnValue = message;
            return message;
        };

        // Handle navigation attempts
        const handleCapture = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const anchor = target.closest('a');

            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href.includes(pathname)) return;

            if (hasUnsavedProgress) {
                event.preventDefault();
                event.stopPropagation();
                setAttemptedPath(href);
                setShowDialog(true);
            }
        };

        // Add event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('click', handleCapture, true);
        window.addEventListener('popstate', preventNavigation);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('click', handleCapture, true);
            window.removeEventListener('popstate', preventNavigation);
        };
    }, [hasUnsavedProgress, pathname, preventNavigation]);

    const handleContinueNavigation = (): void => {
        setShowDialog(false);
        if (attemptedPath) {
            startTransition(() => {
                router.push(attemptedPath);
            });
            setAttemptedPath(null);
        }
    };

    const handleStayOnPage = (): void => {
        setShowDialog(false);
        setAttemptedPath(null);
    };

    // Block navigation when dialog is open
    useEffect(() => {
        if (showDialog) {
            const handlePopState = (e: PopStateEvent) => {
                e.preventDefault();
                window.history.pushState(null, '', window.location.href);
            };

            window.history.pushState(null, '', window.location.href);
            window.addEventListener('popstate', handlePopState);

            return () => {
                window.removeEventListener('popstate', handlePopState);
            };
        }
    }, [showDialog]);
    console.log(isPending);

    return (
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Leave Test?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {`You have completed ${Object.keys(selectedAnswers).length} out of ${totalQuestions} questions. `}
                        Your progress will be lost if you leave this page. Are you sure you want to leave?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={handleStayOnPage}>
                        Continue Test
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleContinueNavigation}>
                        Leave Page
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default TestPageWarning;
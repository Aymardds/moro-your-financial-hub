import { ReactNode } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';

interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
    description?: string;
}

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                {(title || description) && (
                    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex flex-col">
                            {title && <h1 className="text-lg font-semibold">{title}</h1>}
                            {description && <p className="text-sm text-muted-foreground">{description}</p>}
                        </div>
                    </header>
                )}
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}

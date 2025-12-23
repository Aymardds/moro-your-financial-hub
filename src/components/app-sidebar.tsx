import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    SidebarSeparator,
} from '@/components/ui/sidebar';
import {
    LayoutDashboard,
    TrendingUp,
    FolderKanban,
    PiggyBank,
    FileText,
    Shield,
    CreditCard,
    Users,
    Building2,
    BarChart3,
    Settings,
    LogOut,
    Wallet,
    UserCheck,
    Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItem {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    url?: string;
    subItems?: SubMenuItem[];
}

interface SubMenuItem {
    title: string;
    url: string;
}

interface MenuSection {
    label?: string;
    items: MenuItem[];
}

const getMenuItemsByRole = (role: string): MenuSection[] => {
    switch (role) {
        case 'entrepreneur':
            return [
                {
                    items: [
                        { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
                        { title: 'Opérations', icon: TrendingUp, url: '/operations' },
                        { title: 'Projets', icon: FolderKanban, url: '/projects' },
                        { title: 'Épargne', icon: PiggyBank, url: '/savings' },
                    ],
                },
                {
                    label: 'Services',
                    items: [
                        { title: 'Demande de Financement', icon: FileText, url: '/financing/apply' },
                        { title: 'Validation KYC', icon: Shield, url: '/kyc' },
                        { title: 'Abonnement', icon: CreditCard, url: '/subscription' },
                    ],
                },
            ];

        case 'agent':
            return [
                {
                    items: [
                        { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
                        { title: 'Clients', icon: Users, url: '/clients' },
                        { title: 'Opérations', icon: TrendingUp, url: '/operations' },
                        { title: 'Rapports', icon: BarChart3, url: '/reports' },
                    ],
                },
            ];

        case 'cooperative':
            return [
                {
                    items: [
                        { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
                        { title: 'Membres', icon: Users, url: '/members' },
                        { title: 'Demandes de Financement', icon: FileText, url: '/financing' },
                        { title: 'Statistiques', icon: BarChart3, url: '/statistics' },
                    ],
                },
            ];

        case 'institution':
            return [
                {
                    items: [
                        { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
                        { title: 'Demandes de Financement', icon: FileText, url: '/financing' },
                        { title: 'Portefeuille', icon: Wallet, url: '/portfolio' },
                        { title: 'Statistiques', icon: BarChart3, url: '/statistics' },
                    ],
                },
            ];

        case 'admin':
            return [
                {
                    items: [
                        { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
                        { title: 'Gestion des Utilisateurs', icon: Users, url: '/users' },
                        { title: 'Validation KYC', icon: UserCheck, url: '/kyc-validation' },
                        { title: 'Statistiques', icon: BarChart3, url: '/statistics' },
                    ],
                },
            ];

        case 'superAdmin':
            return [
                {
                    items: [
                        { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
                    ],
                },
                {
                    label: 'Gestion',
                    items: [
                        {
                            title: 'Utilisateurs',
                            icon: Users,
                            subItems: [
                                { title: 'Entrepreneurs', url: '/users/entrepreneurs' },
                            ],
                        },
                        {
                            title: 'Organisations',
                            icon: Building2,
                            subItems: [
                                { title: 'Coopératives', url: '/organizations/cooperatives' },
                                { title: 'Institutions Financières', url: '/organizations/institutions' },
                            ],
                        },
                        { title: 'Validation KYC', icon: UserCheck, url: '/kyc-validation' },
                    ],
                },
                {
                    label: 'Système',
                    items: [
                        { title: 'Statistiques', icon: BarChart3, url: '/statistics' },
                        { title: 'Base de Données', icon: Database, url: '/database' },
                        { title: 'Paramètres', icon: Settings, url: '/settings' },
                    ],
                },
            ];

        default:
            return [
                {
                    items: [
                        { title: 'Dashboard', icon: LayoutDashboard, url: '/dashboard' },
                    ],
                },
            ];
    }
};

export function AppSidebar() {
    const { user, role, signOut } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const menuSections = getMenuItemsByRole(role || '');

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <Sidebar>
            <SidebarHeader className="border-b border-sidebar-border">
                <div className="flex items-center gap-2 px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Wallet className="h-6 w-6" />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg">MORO</span>
                        <span className="text-xs text-muted-foreground">Financial Hub</span>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {menuSections.map((section, index) => (
                    <SidebarGroup key={index}>
                        {section.label && <SidebarGroupLabel>{section.label}</SidebarGroupLabel>}
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {section.items.map((item) => {
                                    const isActive = item.url ? location.pathname === item.url : false;
                                    const hasSubItems = item.subItems && item.subItems.length > 0;

                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            {hasSubItems ? (
                                                <>
                                                    <SidebarMenuButton tooltip={item.title}>
                                                        <item.icon className="h-4 w-4" />
                                                        <span>{item.title}</span>
                                                    </SidebarMenuButton>
                                                    <SidebarMenuSub>
                                                        {item.subItems!.map((subItem) => {
                                                            const isSubActive = location.pathname === subItem.url;
                                                            return (
                                                                <SidebarMenuSubItem key={subItem.url}>
                                                                    <SidebarMenuSubButton
                                                                        onClick={() => navigate(subItem.url)}
                                                                        isActive={isSubActive}
                                                                    >
                                                                        <span>{subItem.title}</span>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            );
                                                        })}
                                                    </SidebarMenuSub>
                                                </>
                                            ) : (
                                                <SidebarMenuButton
                                                    isActive={isActive}
                                                    onClick={() => item.url && navigate(item.url)}
                                                    tooltip={item.title}
                                                >
                                                    <item.icon className="h-4 w-4" />
                                                    <span>{item.title}</span>
                                                </SidebarMenuButton>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="px-2 py-2">
                            <div className="flex items-center gap-2 px-2 py-1">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Users className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm font-medium truncate">
                                        {user?.email || user?.phone || 'Utilisateur'}
                                    </span>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {role === 'superAdmin' ? 'Super Admin' : role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </SidebarMenuItem>
                    <SidebarSeparator />
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Déconnexion">
                            <LogOut className="h-4 w-4" />
                            <span>Déconnexion</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

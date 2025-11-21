import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, DollarSign, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  phone: string;
  name: string;
  created_at: string;
}

interface Transaction {
  id: string;
  client_id: string;
  amount: number;
  type: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export default function DashboardAgent() {
  const { user, signOut } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalTransactions: 0,
    totalVolume: 0,
    pendingTransactions: 0,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Récupérer les clients de l'agent
      const { data: clientsData } = await supabase
        .from('agent_clients')
        .select('*, user_profiles(*)')
        .eq('agent_id', user.id);

      if (clientsData) {
        setClients(clientsData.map((c: any) => ({
          id: c.user_id,
          phone: c.user_profiles?.phone || 'N/A',
          name: c.user_profiles?.name || 'Client',
          created_at: c.created_at,
        })));
      }

      // Récupérer les transactions
      const { data: transactionsData } = await supabase
        .from('agent_transactions')
        .select('*')
        .eq('agent_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transactionsData) {
        setTransactions(transactionsData);
        const volume = transactionsData
          .filter((t: Transaction) => t.status === 'completed')
          .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const pending = transactionsData.filter((t: Transaction) => t.status === 'pending').length;

        setStats({
          totalClients: clientsData?.length || 0,
          totalTransactions: transactionsData.length,
          totalVolume: volume,
          pendingTransactions: pending,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Dashboard Agent</h1>
              <p className="text-sm text-muted-foreground">
                Gestion des clients et transactions
              </p>
            </div>
            <Button variant="outline" onClick={signOut}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">Clients actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Total transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volume</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalVolume.toLocaleString('fr-FR')} FCFA
              </div>
              <p className="text-xs text-muted-foreground">Volume total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTransactions}</div>
              <p className="text-xs text-muted-foreground">Transactions en attente</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="clients" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="clients">
            <Card>
              <CardHeader>
                <CardTitle>Mes Clients</CardTitle>
                <CardDescription>Liste de vos clients</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : clients.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun client enregistré
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.phone}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Voir détails
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Historique des transactions</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Chargement...</div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune transaction
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.amount.toLocaleString('fr-FR')} FCFA
                          </p>
                          <p className="text-sm text-muted-foreground">{transaction.type}</p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            transaction.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : transaction.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.status === 'completed'
                            ? 'Terminé'
                            : transaction.status === 'pending'
                            ? 'En attente'
                            : 'Échoué'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


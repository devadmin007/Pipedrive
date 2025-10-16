import { useState, useEffect } from 'react';
import { useAuthCheck } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BarChart3, UserPlus, Phone, Mail, Calendar, FileCheck, Clock, DollarSign } from 'lucide-react';
import api from '@/lib/api';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  leadCount: number;
  newLeadsCount: number;
  qualifiedLeadsCount: number;
  closedWonCount: number;
  closedLostCount: number;
  totalValue: number;
  upcomingActivities: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    leadCount: 0,
    newLeadsCount: 0,
    qualifiedLeadsCount: 0,
    closedWonCount: 0,
    closedLostCount: 0,
    totalValue: 0,
    upcomingActivities: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuthCheck();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Mock data since we don't have specific dashboard endpoints yet
        // In a real app, you would have dedicated endpoints for these stats
        const leadsResponse = await api.get('/leads');
        const leads = leadsResponse.data.data;
        
        const newLeads = leads.filter(l => l.status === 'New Lead');
        const qualifiedLeads = leads.filter(l => l.status === 'Qualified');
        const closedWon = leads.filter(l => l.status === 'Closed Won');
        const closedLost = leads.filter(l => l.status === 'Closed Lost');
        const totalValue = leads.reduce((sum, lead) => sum + (lead.value || 0), 0);
        
        // Get upcoming activities
        const upcomingActivities = [];
        for (const lead of leads) {
          const pendingActivities = lead.activities
            .filter(a => a.dueDate && !a.completed && new Date(a.dueDate) >= new Date())
            .map(a => ({
              ...a,
              leadName: lead.name,
              leadId: lead._id
            }));
          upcomingActivities.push(...pendingActivities);
        }
        
        // Sort by due date
        upcomingActivities.sort((a, b) => 
          new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        );
        
        setStats({
          leadCount: leads.length,
          newLeadsCount: newLeads.length,
          qualifiedLeadsCount: qualifiedLeads.length,
          closedWonCount: closedWon.length,
          closedLostCount: closedLost.length,
          totalValue,
          upcomingActivities: upcomingActivities.slice(0, 5) // Get only 5 closest activities
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'note': return <FileCheck className="h-4 w-4" />;
      case 'follow-up': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {/* <Button onClick={() => navigate('/leads')}>
          <UserPlus className="mr-2 h-4 w-4" /> Add New Lead
        </Button> */}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.leadCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.newLeadsCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Qualified Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.qualifiedLeadsCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              <div className="flex items-center">
                <DollarSign className="mr-1 h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US').format(stats.totalValue)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-card p-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">Win Rate</div>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex items-center">
                    <div className="font-bold text-xl">
                      {stats.closedWonCount + stats.closedLostCount > 0
                        ? Math.round((stats.closedWonCount / (stats.closedWonCount + stats.closedLostCount)) * 100)
                        : 0}%
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">Closed Won</div>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex items-center">
                    <div className="font-bold text-xl">{stats.closedWonCount}</div>
                  </div>
                )}
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">Closed Lost</div>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex items-center">
                    <div className="font-bold text-xl">{stats.closedLostCount}</div>
                  </div>
                )}
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="text-sm font-medium text-muted-foreground mb-1">Avg Value</div>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="flex items-center">
                    <div className="font-bold text-xl">
                      ${stats.leadCount > 0
                        ? new Intl.NumberFormat('en-US').format(Math.round(stats.totalValue / stats.leadCount))
                        : 0}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array(3).fill(null).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : stats.upcomingActivities.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingActivities.map((activity) => (
                  <div 
                    key={activity._id} 
                    className="flex items-start space-x-3 cursor-pointer hover:bg-accent hover:bg-opacity-50 rounded-lg p-2 transition-colors"
                    onClick={() => navigate(`/leads/${activity.leadId}`)}
                  >
                    <div className="bg-primary/10 p-2 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{activity.description}</div>
                      <div className="text-sm text-muted-foreground flex flex-col md:flex-row md:items-center gap-1">
                        <span>
                          Lead: {activity.leadName}
                        </span>
                        <span className="hidden md:inline">•</span>
                        <span>
                          Due: {format(new Date(activity.dueDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No upcoming activities
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/leads')}>
              View All Leads
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
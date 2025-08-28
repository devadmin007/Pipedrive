import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LEAD_STATUSES, useLeadsStore } from '@/lib/leads';
import { useAuthCheck } from '@/lib/auth';
import { UserPlus, Search, Filter, ChevronRight, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import LeadKanbanBoard from '@/components/leads/LeadKanbanBoard';
import api from '@/lib/api';

export default function LeadsPage() {
  const navigate = useNavigate();
  const { user } = useAuthCheck();
  const { 
    leads, 
    loading, 
    error,
    filters,
    pagination,
    fetchLeads,
    setFilters,
    setPage
  } = useLeadsStore();
  const [salesReps, setSalesReps] = useState([]);
  const [loadingReps, setLoadingReps] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'

  useEffect(() => {
    // Initial load of leads
    fetchLeads();
    
    // Fetch sales reps for filter
    const fetchSalesReps = async () => {
      try {
        setLoadingReps(true);
        const response = await api.get('/users/sales');
        setSalesReps(response.data.data);
      } catch (err) {
        console.error('Failed to fetch sales reps', err);
      } finally {
        setLoadingReps(false);
      }
    };
    
    fetchSalesReps();
  }, [fetchLeads]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleStatusFilterChange = (value: string) => {
    setFilters({ status: value === 'all' ? null : value });
  };

  const handleAssigneeFilterChange = (value: string) => {
    setFilters({ assignedTo: value === 'all' ? null : value });
  };

  const loadMoreLeads = () => {
    if (pagination.hasMore) {
      setPage(pagination.page + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Button onClick={() => navigate('/leads/new')}>
          <UserPlus className="mr-2 h-4 w-4" /> Add New Lead
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            className="pl-8"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={filters.assignedTo || 'all'}
          onValueChange={handleAssigneeFilterChange}
          disabled={loadingReps}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {salesReps.map((rep: any) => (
              <SelectItem key={rep._id} value={rep._id}>{rep.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Tabs 
        defaultValue="list" 
        value={viewMode} 
        onValueChange={setViewMode}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="kanban">Status Board</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list">
          {loading && leads.length === 0 ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">No leads found</p>
                <Button onClick={() => navigate('/leads/new')}>
                  <UserPlus className="mr-2 h-4 w-4" /> Create your first lead
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <Card 
                  key={lead._id} 
                  className="hover:bg-accent/50 cursor-pointer"
                  onClick={() => navigate(`/leads/${lead._id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lead.name}</span>
                          {lead.company && (
                            <span className="text-sm text-muted-foreground">
                              • {lead.company}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span>Status: {lead.status}</span>
                          <span>Value: ${lead.value ? new Intl.NumberFormat('en-US').format(lead.value) : 0}</span>
                          {lead.assignedTo && (
                            <span>Assigned to: {lead.assignedTo.name}</span>
                          )}
                          <span>Created: {format(new Date(lead.createdAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {pagination.hasMore && (
                <div className="flex justify-center pt-4">
                  <Button 
                    variant="outline" 
                    onClick={loadMoreLeads} 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="kanban">
          <LeadKanbanBoard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
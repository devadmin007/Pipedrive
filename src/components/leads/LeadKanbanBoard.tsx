import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LEAD_STATUSES, useLeadsStore, Lead } from '@/lib/leads';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function KanbanBoard() {
  const navigate = useNavigate();
  const { leads, loading, fetchLeads, updateLeadStatus } = useLeadsStore();

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      await updateLeadStatus(leadId, newStatus);
      // state auto-updates via store
    } catch (err) {
      console.error('Failed to update lead status', err);
    }
  };

  const handleCardClick = (leadId: string) => {
    navigate(`/leads/${leadId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {leads.map((lead: Lead) => (
        <Card 
          key={lead._id} 
          className="p-4 flex justify-between items-center cursor-pointer"
          onClick={() => handleCardClick(lead._id)}
        >
          <div>
            <p className="font-medium">{lead.name}</p>
            <p className="text-sm text-muted-foreground">{lead.email}</p>
          </div>

          <Select
            value={lead.status}
            onValueChange={(newStatus) => handleStatusChange(lead._id, newStatus)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>
      ))}
    </div>
  );
}

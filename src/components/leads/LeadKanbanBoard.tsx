import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeadsStore, Lead } from '@/lib/leads';
 
// Use the correct status values that match your backend enum
const LEAD_STATUSES = ["prospect", "qualified", "opportunity", "deal"];
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import LeadPopup from './LeadPopup';
 
export default function KanbanBoard() {
  const navigate = useNavigate();
  const { leads, loading, fetchLeads, updateLead } = useLeadsStore(); // Use updateLead instead of updateLeadStatus
 
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
 
  console.log("heloo");
 
 
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);
 
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      console.log('Status change triggered:', { leadId, newStatus }); // Debug log
 
      // Get the lead before updating
      const lead = leads.find((l) => l._id === leadId);
      if (!lead) {
        console.error('Lead not found:', leadId);
        return;
      }
 
      console.log('Opening popup for status:', newStatus); // Debug log
 
      // Set selected lead and open popup immediately (no API call here)
      setSelectedLead({ ...lead, status: newStatus, currentStage: newStatus });
      setPopupOpen(true);
 
    } catch (err) {
      console.error('Failed to update lead status', err);
    }
  };
 
  const handlePopupSave = async (formData: any) => {
    try {
      if (selectedLead) {
        // Send the complete form data to update the lead (including status change)
        await updateLead(selectedLead._id, formData);
        setPopupOpen(false);
        setSelectedLead(null);
      }
    } catch (err) {
      console.error('Failed to save lead details', err);
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
 
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              value={selectedLead?._id === lead._id ? selectedLead.status : lead.status}
              onValueChange={(newStatus) => {
                setSelectedLead({
                  ...lead,
                  status: newStatus,
                  currentStage: newStatus,
                });
                setPopupOpen(true);
              }}
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
 
          </div>
        </Card>
      ))}
 
      {/* Popup for extra details */}
      {selectedLead && (
        <LeadPopup
          open={popupOpen}
          onClose={() => {
            setPopupOpen(false);
            setSelectedLead(null);
          }}
          onSave={handlePopupSave}
          initialData={selectedLead}
        />
      )}
    </div>
  );
}
 
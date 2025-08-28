import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lead } from '@/lib/leads';
import KanbanCard from './KanbanCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: string;
  leads: Lead[];
  onCardClick: (leadId: string) => void;
}

export default function KanbanColumn({ status, leads, onCardClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const statusColors: Record<string, string> = {
    'New Lead': 'bg-blue-100 text-blue-800',
    'Contacted': 'bg-purple-100 text-purple-800',
    'Qualified': 'bg-cyan-100 text-cyan-800',
    'Proposal': 'bg-amber-100 text-amber-800',
    'Negotiation': 'bg-orange-100 text-orange-800',
    'Closed Won': 'bg-green-100 text-green-800',
    'Closed Lost': 'bg-red-100 text-red-800',
  };

  return (
    <Card 
      ref={setNodeRef} 
      className={cn(
        "h-[70vh] flex flex-col",
        isOver && "ring-2 ring-primary ring-inset"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", 
              status === 'New Lead' ? 'bg-blue-500' : 
              status === 'Contacted' ? 'bg-purple-500' :
              status === 'Qualified' ? 'bg-cyan-500' :
              status === 'Proposal' ? 'bg-amber-500' :
              status === 'Negotiation' ? 'bg-orange-500' :
              status === 'Closed Won' ? 'bg-green-500' :
              'bg-red-500'
            )} />
            <CardTitle className="text-sm font-medium">{status}</CardTitle>
          </div>
          <span className="bg-muted rounded-full px-2 py-0.5 text-xs font-medium">
            {leads.length}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-2">
        <SortableContext items={leads.map(lead => lead._id)} strategy={verticalListSortingStrategy}>
          {leads.length === 0 ? (
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-md p-4">
              <p className="text-muted-foreground text-sm text-center">
                Drag leads here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <KanbanCard
                  key={lead._id}
                  lead={lead}
                  onClick={() => onCardClick(lead._id)}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}
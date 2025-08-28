import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Lead } from '@/lib/leads';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  lead: Lead;
  onClick?: () => void;
}

export default function KanbanCard({ lead, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "mb-2 cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors",
        isDragging && "ring-2 ring-primary"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick && onClick();
      }}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium leading-tight">{lead.name}</h3>
              {lead.company && (
                <p className="text-xs text-muted-foreground">{lead.company}</p>
              )}
            </div>
            {lead.value > 0 && (
              <div className="text-xs font-medium flex items-center">
                <DollarSign className="h-3 w-3" />
                {new Intl.NumberFormat('en-US').format(lead.value)}
              </div>
            )}
          </div>
          
          {lead.assignedTo && (
            <div className="flex justify-between items-center">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[10px]">
                  {lead.assignedTo.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
              </div>
            </div>
          )}
          
          {!lead.assignedTo && (
            <div className="text-xs text-right text-muted-foreground">
              {formatDistanceToNow(new Date(lead.updatedAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
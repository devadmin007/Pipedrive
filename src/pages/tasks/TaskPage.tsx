import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ChevronRight, Phone, Mail, Calendar, FileCheck, Clock } from "lucide-react";
import api from "@/lib/api";
import { format, addDays, isSameDay } from "date-fns";

interface Activity {
  _id: string;
  type: string;
  description: string;
  dueDate: string;
  completed: boolean;
  leadName: string;
  leadId: string;
}

export default function TaskPage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "3days" | "7days">("all");
  const [showAll, setShowAll] = useState(false); // New state

  // Fetch upcoming activities
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const response = await api.get("/leads");
        const leads = response.data.data;

        const upcoming: Activity[] = [];
        leads.forEach((lead: any) => {
          const pendingActivities = (lead.activities || [])
            .filter((a: any) => a.dueDate && !a.completed && new Date(a.dueDate) >= new Date())
            .map((a: any) => ({
              ...a,
              leadName: lead.name,
              leadId: lead._id,
            }));
          upcoming.push(...pendingActivities);
        });

        upcoming.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

        setActivities(upcoming);
      } catch (err) {
        console.error("Failed to fetch activities", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityChip = (type: string) => {
    let icon, label;
    switch (type) {
      case "call":
        icon = <Phone className="h-4 w-4" />;
        label = "Call";
        break;
      case "email":
        icon = <Mail className="h-4 w-4" />;
        label = "Email";
        break;
      case "meeting":
        icon = <Calendar className="h-4 w-4" />;
        label = "Meeting";
        break;
      case "note":
        icon = <FileCheck className="h-4 w-4" />;
        label = "Note";
        break;
      case "follow-up":
        icon = <Clock className="h-4 w-4" />;
        label = "Follow-Up";
        break;
      default:
        icon = <Clock className="h-4 w-4" />;
        label = "Other";
        break;
    }
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-200 text-gray-800 text-xs font-medium">
        {" "}
        {icon} <span>{label}</span>{" "}
      </div>
    );
  };

  // Filter activities
  const filteredActivities = activities
    .filter((a) => (search ? a.description.toLowerCase().includes(search.toLowerCase()) : true))
    .filter((a) => {
      const due = new Date(a.dueDate);
      const today = new Date();
      switch (dateFilter) {
        case "today":
          return isSameDay(due, today);
        case "tomorrow":
          return isSameDay(due, addDays(today, 1));
        case "3days":
          return due <= addDays(today, 3);
        case "7days":
          return due <= addDays(today, 7);
        default:
          return true;
      }
    });

  // Show only first 5 tasks if showAll is false
  const displayedActivities = showAll ? filteredActivities : filteredActivities.slice(0, 5);

  return (
    <Card className="col-span-full lg:col-span-3">
      <CardHeader>
        <CardTitle>Upcoming Activities</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search activities..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as any)}>
            <SelectTrigger className="w-full sm:w-[240px]">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="3days">Next 3 Days</SelectItem>
              <SelectItem value="7days">Next 7 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Activity List */}
        {loading ? (
          <div className="space-y-2">
            {Array(3)
              .fill(null)
              .map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
          </div>
        ) : displayedActivities.length > 0 ? (
          <div className="space-y-2">
            {displayedActivities.map((activity) => (
              <Card key={activity._id} className="hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/leads/${activity.leadId}`)}>
                <CardContent className="flex items-center gap-3 p-2">
                  <div className="bg-primary/10 p-2 rounded-full">{getActivityChip(activity.type)}</div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{activity.description}</span>
                    <span className="text-sm text-muted-foreground">
                      Lead: {activity.leadName} • Due: {format(new Date(activity.dueDate), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No upcoming activities</div>
        )}
      </CardContent>
      {filteredActivities.length > 5 && !showAll && (
        <CardFooter>
          <Button variant="ghost" className="w-full" onClick={() => setShowAll(true)}>
            View All Tasks
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

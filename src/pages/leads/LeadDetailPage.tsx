import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLeadsStore, LEAD_STATUSES, ACTIVITY_TYPES } from '@/lib/leads';
import { useAuthCheck } from '@/lib/auth';
import { ArrowLeft, Edit, Trash2, UserPlus, Mail, Phone, Building, AlertCircle, Plus, DollarSign } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthCheck();
  const { currentLead, loading, error, fetchLead, updateLead, deleteLead, addActivity } = useLeadsStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [salesReps, setSalesReps] = useState([]);
  const [loadingReps, setLoadingReps] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    value: 0,
    status: '',
    notes: '',
    assignedTo: ''
  });

  const [activityForm, setActivityForm] = useState({
    type: 'note',
    description: '',
    dueDate: '',
  });

  useEffect(() => {
    if (id) {
      fetchLead(id);
    }

    // Fetch sales reps for assigning
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
  }, [id, fetchLead]);

  // Initialize edit form when lead is loaded
  useEffect(() => {
    if (currentLead) {
      setEditForm({
        name: currentLead?.name,
        company: currentLead?.company || '',
        position: currentLead?.position || '',
        email: currentLead?.email || '',
        phone: currentLead?.phone || '',
        value: currentLead?.value || 0,
        status: currentLead?.status,
        notes: currentLead?.notes || '',
        assignedTo: currentLead?.assignedTo?._id || ''
      });
    }
  }, [currentLead]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLead(id!, editForm);
      setIsEditDialogOpen(false);
      toast.success('Lead updated successfully');
    } catch (err) {
      toast.error('Failed to update lead');
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addActivity(id!, activityForm);
      setIsActivityDialogOpen(false);
      setActivityForm({
        type: 'note',
        description: '',
        dueDate: '',
      });
      toast.success('Activity added successfully');
    } catch (err) {
      toast.error('Failed to add activity');
    }
  };

  const handleDeleteLead = async () => {
    try {
      await deleteLead(id!);
      navigate('/leads');
      toast.success('Lead deleted successfully');
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  if (loading && !currentLead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leads
          </Button>
        </div>
        <div className="space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !currentLead) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Error Loading Lead</h2>
        <p className="text-muted-foreground">{error || 'Lead not found'}</p>
        <Button onClick={() => navigate('/leads')}>Return to Leads</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leads
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{currentLead?.name}</h1>
          {currentLead?.company && (
            <p className="text-muted-foreground mt-1">{currentLead?.company}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={
            currentLead.status === 'New Lead' ? 'bg-blue-500' :
              currentLead.status === 'Contacted' ? 'bg-purple-500' :
                currentLead.status === 'Qualified' ? 'bg-cyan-500' :
                  currentLead.status === 'Proposal' ? 'bg-amber-500' :
                    currentLead.status === 'Negotiation' ? 'bg-orange-500' :
                      currentLead.status === 'Closed Won' ? 'bg-green-500' :
                        'bg-red-500'
          }>
            {currentLead.status}
          </Badge>

          <Button size="sm" variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit Lead
          </Button>

          <Button size="sm" variant="outline" onClick={() => setIsActivityDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Activity
          </Button>

          {user?.role === 'admin' && (
            <Button size="sm" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lead Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentLead.position && (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span>{currentLead.position}</span>
                </div>
              )}
              {currentLead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${currentLead.email}`} className="hover:underline">{currentLead.email}</a>
                </div>
              )}
              {currentLead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${currentLead.phone}`} className="hover:underline">{currentLead.phone}</a>
                </div>
              )}
              {currentLead.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{currentLead.company}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="text-sm text-muted-foreground mb-1">Value</div>
              <div className="text-xl font-bold flex items-center">
                <DollarSign className="h-5 w-5" />
                {currentLead.value ? new Intl.NumberFormat('en-US').format(currentLead.value) : '0'}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Assigned To</h4>
              {currentLead.assignedTo ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {currentLead.assignedTo?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{currentLead.assignedTo.name}</div>
                    <div className="text-xs text-muted-foreground">{currentLead.assignedTo.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">Not assigned</div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Created By</h4>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {currentLead.createdBy?.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{currentLead.createdBy?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(currentLead.createdAt), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {currentLead.notes ? (
              <div className="whitespace-pre-wrap">{currentLead.notes}</div>
            ) : (
              <div className="text-muted-foreground text-sm">No notes yet. Add notes by editing the lead.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Activities</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setIsActivityDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Activity
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {currentLead.activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No activities recorded yet</p>
              <Button onClick={() => setIsActivityDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> Add first activity
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {currentLead.activities.map((activity) => (
                <div key={activity._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {activity.type}
                      </Badge>
                      {activity.dueDate && (
                        <span className="text-sm text-muted-foreground">
                          Due: {format(new Date(activity.dueDate), 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{activity.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <span>By {activity.createdBy?.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>
              Update the lead's information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={editForm.company}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={editForm.position}
                    onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value ($)</Label>
                  <Input
                    id="value"
                    type="number"
                    value={editForm.value}
                    onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select
                  value={editForm.assignedTo ?? "unassigned"}
                  onValueChange={(value) =>
                    setEditForm({
                      ...editForm,
                      assignedTo: value === "unassigned" ? null : value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {salesReps.map((rep: any) => (
                      <SelectItem key={rep._id} value={rep._id}>
                        {rep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="h-24"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>
              Record a new activity for this lead.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleActivitySubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Activity Type</Label>
                <Select
                  value={activityForm.type}
                  onValueChange={(value) => setActivityForm({ ...activityForm, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="h-24"
                  placeholder="Describe the activity details..."
                  required
                />
              </div>
              {(activityForm.type === 'follow-up' || activityForm.type === 'meeting') && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={activityForm.dueDate}
                    onChange={(e) => setActivityForm({ ...activityForm, dueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsActivityDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Activity</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this lead and all associated activities. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLead} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
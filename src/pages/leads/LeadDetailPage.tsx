import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLeadsStore, ACTIVITY_TYPES } from "@/lib/leads";
import { useAuthCheck } from "@/lib/auth";
import { ArrowLeft, Edit, Trash2, UserPlus, Mail, Phone, Building, AlertCircle, Plus, DollarSign, Pencil, Trash } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { log } from "console";
import axios from "axios";
import { Toast } from "@radix-ui/react-toast";

const LEAD_STATUSES = ["hot", "cold", "warm"];
const LEAD_SOURCES = ["linkedin", "email", "upwork", "otherportal"];

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthCheck();
  const { currentLead, loading, error, fetchLead, updateLead, deleteLead, addActivity } = useLeadsStore();
  console.log(currentLead, "current lead");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [salesReps, setSalesReps] = useState([]);
  const [loadingReps, setLoadingReps] = useState(false);
  const [isEditActivityDialogOpen, setIsEditActivityDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<any | null>(null);
  console.log(currentLead, "current lead");

  // Form states
  const [editForm, setEditForm] = useState({
    name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    value: 0,
    status: "",
    currency: "",
    notes: "",
    assignedTo: "",
    suspect: {
      leadSource: "",
      otherPortalName: "",
      jobUrl: "",
    },
  });

  console.log("editForm", editForm);

  const [activityForm, setActivityForm] = useState({
    type: "note",
    description: "",
    dueDate: "",
  });

  useEffect(() => {
    if (id) {
      fetchLead(id);
    }

    // Fetch sales reps for assigning
    const fetchSalesReps = async () => {
      try {
        setLoadingReps(true);
        const response = await api.get("/users/sales");
        setSalesReps(response.data.data);
      } catch (err) {
        console.error("Failed to fetch sales reps", err);
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
        name: currentLead.name,
        company: currentLead.company || "",
        position: currentLead.position || "",
        email: currentLead.email || "",
        phone: currentLead.phone || "",
        currency: currentLead.currency || "",
        value: currentLead.value || 0,
        status: currentLead.status,
        notes: currentLead.notes || "",
        assignedTo: currentLead.assignedTo?._id || "",
        suspect: {
          leadSource: currentLead.suspect?.leadSource || "",
          otherPortalName: currentLead.suspect?.otherPortalName || "",
          jobUrl: currentLead.suspect?.jobUrl || "",
        },
      });
    }
  }, [currentLead]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateLead(id!, editForm);
      setIsEditDialogOpen(false);
      toast.success("Lead updated successfully");
    } catch (err) {
      toast.error("Failed to update lead");
    }
  };

  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addActivity(id!, activityForm);
      setIsActivityDialogOpen(false);
      setActivityForm({
        type: "note",
        description: "",
        dueDate: "",
      });
      toast.success("Activity added successfully");
    } catch (err) {
      toast.error("Failed to add activity");
    }
  };

  const handleDeleteLead = async () => {
    try {
      await deleteLead(id!);
      navigate("/leads");
      toast.success("Lead deleted successfully");
    } catch (err) {
      toast.error("Failed to delete lead");
    }
  };

  if (loading && !currentLead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
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
        <p className="text-muted-foreground">{error || "Lead not found"}</p>
        <Button onClick={() => navigate("/leads")}>Return to Leads</Button>
      </div>
    );
  }

  console.log("currentLead?.suspect=====>", currentLead?.suspect);

  // const handleEditActivity = (activity) => {
  //   // open modal or inline edit
  //   console.log("Edit activity:", activity);
  // };
  const handleEditActivity = async (leadId: string, activityId: string, updates: any) => {
    try {
      await api.put(`/leads/${leadId}/activities/${activityId}`, updates);
      toast.success("Activity updated");
    } catch (err) {
      toast.error("Failed to update activity");
    }
  };

  // const handleDeleteActivity = (id) => {
  //   // confirm + delete API call
  //   console.log("Delete activity:", id);
  // };

  const handleDeleteActivity = async (leadId: string, activityId: string) => {
    try {
      await api.delete(`/leads/${leadId}/activities/${activityId}`);

      // Option 1: refetch lead
      fetchLead(leadId);
      // refresh lead or update state
    } catch (err) {
      toast.error("Failed to delete activity");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/leads")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leads
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{currentLead?.name}</h1>
          {currentLead?.company && <p className="text-muted-foreground mt-1">{currentLead?.company}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={currentLead.status === "New Lead" ? "bg-blue-500" : currentLead.status === "Contacted" ? "bg-purple-500" : currentLead.status === "Qualified" ? "bg-cyan-500" : currentLead.status === "Proposal" ? "bg-amber-500" : currentLead.status === "Negotiation" ? "bg-orange-500" : currentLead.status === "Closed Won" ? "bg-green-500" : "bg-red-500"}>{currentLead.status}</Badge>

          <Button size="sm" variant="outline" onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit Lead
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setCurrentActivity(null); // important: clear any previous activity
              setActivityForm({
                type: "note",
                description: "",
                dueDate: "",
              }); // reset form
              setIsActivityDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Activity
          </Button>

          {user?.role === "admin" && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setCurrentActivity(null); // adding new activity
                setIsActivityDialogOpen(true);
              }}
            >
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
                  <a href={`mailto:${currentLead.email}`} className="hover:underline">
                    {currentLead.email}
                  </a>
                </div>
              )}
              {currentLead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${currentLead.phone}`} className="hover:underline">
                    {currentLead.phone}
                  </a>
                </div>
              )}
              {currentLead.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span>{currentLead.company}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <div className="pt-2">
                  <div className="text-sm text-muted-foreground mb-1">Value</div>
                  <div className="text-xl font-bold flex items-center">
                    <DollarSign className="h-5 w-5" />
                    {currentLead.value ? new Intl.NumberFormat("en-US").format(currentLead.value) : "0"}
                  </div>
                </div>

                <Separator className="mt-2" />

                <div className="space-y-2 pt-2">
                  <h4 className="font-medium">Assigned To</h4>
                  {currentLead.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{currentLead.assignedTo?.name?.charAt(0)}</AvatarFallback>
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

                <Separator className="mt-2" />

                <div className="space-y-2 pt-2">
                  <h4 className="font-medium">Created By</h4>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{currentLead.createdBy?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{currentLead.createdBy?.name}</div>
                      <div className="text-xs text-muted-foreground">{format(new Date(currentLead.createdAt), "MMM dd, yyyy")}</div>
                    </div>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader className="p-3">
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent className="pl-3 pr-3 pb-3">{currentLead.notes ? <div className="whitespace-pre-wrap">{currentLead.notes}</div> : <div className="text-muted-foreground text-sm">No notes yet. Add notes by editing the lead.</div>}</CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Activities</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setCurrentActivity(null); // important: clear any previous activity
                  setActivityForm({
                    type: "note",
                    description: "",
                    dueDate: "",
                  }); // reset form
                  setIsActivityDialogOpen(true);
                }}
              >
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
                        {activity.dueDate && <span className="text-sm text-muted-foreground">Due: {format(new Date(activity.dueDate), "MMM dd, yyyy")}</span>}
                      </div>

                      {/* Right side: time + actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</span>
                        {/* Action buttons */}
                        <button
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setCurrentActivity(activity);
                            setIsActivityDialogOpen(true);
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteActivity(currentLead._id, activity._id)}>
                          <Trash size={16} />
                        </button>
                      </div>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lead Lifecycle</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="suspect">
            <TabsList>
              <TabsTrigger value="suspect">Suspect</TabsTrigger>
              <TabsTrigger value="prospect">Prospect</TabsTrigger>
              <TabsTrigger value="qualified">Qualified</TabsTrigger>
              <TabsTrigger value="opportunity">Opportunity</TabsTrigger>
              <TabsTrigger value="deal">Deal</TabsTrigger>
            </TabsList>

            {/* Suspect */}
            <TabsContent value="suspect">
              {currentLead?.suspect && (currentLead.suspect.otherPortalName || currentLead.suspect.jobUrl) ? (
                <div className="space-y-2">
                  {currentLead.suspect.leadSource && (
                    <p>
                      <b>Lead Source :</b> {currentLead.suspect.leadSource}
                    </p>
                  )}
                  {currentLead.suspect.otherPortalName && (
                    <p>
                      <b>Other Portal Name :</b> {currentLead.suspect.otherPortalName}
                    </p>
                  )}
                  {currentLead.suspect.jobUrl && (
                    <p>
                      <b>Url : </b>
                      <a href={currentLead.suspect.jobUrl} target="_blank" className="text-blue-500 underline">
                        View Job Post
                      </a>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No suspect info yet</p>
              )}
            </TabsContent>

            {/* Prospect */}
            <TabsContent value="prospect">
              {currentLead?.prospect ? (
                <div className="space-y-2">
                  <p>
                    <b>Status:</b> {currentLead.prospect.status}
                  </p>
                  {currentLead.prospect.lastContactedAt && (
                    <p>
                      <b>Last Contacted:</b> {format(new Date(currentLead.prospect.lastContactedAt), "MMM dd, yyyy")}
                    </p>
                  )}
                  {currentLead.prospect.notes && (
                    <p>
                      <b>Notes:</b> {currentLead.prospect.notes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No prospect info yet</p>
              )}
            </TabsContent>

            {/* Qualified */}
            <TabsContent value="qualified">
              {currentLead?.leadQualified ? (
                <div className="space-y-2">
                  {currentLead.leadQualified.budgetApprox && (
                    <p>
                      <b>Budget Approx:</b> {currentLead.leadQualified.budgetApprox}
                    </p>
                  )}
                  {currentLead.leadQualified.budgetCurrency && (
                    <p>
                      <b>Budget Currency:</b> {currentLead.leadQualified.budgetCurrency}
                    </p>
                  )}
                  {currentLead.leadQualified.timelineApprox && (
                    <p>
                      <b>Timeline Approx:</b> {currentLead.leadQualified.timelineApprox}
                    </p>
                  )}
                  {currentLead.leadQualified.meetingScheduled && (
                    <p>
                      <b>Meeting Scheduled:</b> {currentLead.leadQualified.meetingScheduled}
                    </p>
                  )}
                  {currentLead.leadQualified.meetingDate && (
                    <p>
                      <b>Meeting Date:</b> {format(new Date(currentLead.leadQualified.meetingDate), "MMM dd, yyyy")}
                    </p>
                  )}
                  {currentLead.leadQualified.notes && (
                    <p>
                      <b>Notes:</b> {currentLead.leadQualified.notes}
                    </p>
                  )}
                  {currentLead.leadQualified.interestedServices && (
                    <p>
                      <b>Interested Services:</b> {currentLead.leadQualified.interestedServices.map((service) => service).join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No qualification info yet</p>
              )}
            </TabsContent>

            {/* Opportunity */}
            <TabsContent value="opportunity">
              {currentLead?.opportunity ? (
                <div className="space-y-2">
                  {currentLead.opportunity.budgetAmount && (
                    <p>
                      <b>Budget:</b> {currentLead.opportunity.budgetCurrency} {currentLead.opportunity.budgetAmount}
                    </p>
                  )}
                  {currentLead.opportunity.customRequirements && (
                    <p>
                      <b>Custom Requirements:</b> {currentLead.opportunity.customRequirements}
                    </p>
                  )}
                  {currentLead.opportunity.dealStage && (
                    <p>
                      <b>Deal Stage:</b> {currentLead.opportunity.dealStage}
                    </p>
                  )}
                  {currentLead.opportunity.customRequirements && (
                    <p>
                      <b>Custom Requirements:</b> {currentLead.opportunity.customRequirements}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No opportunity info yet</p>
              )}
            </TabsContent>

            {/* Deal */}
            <TabsContent value="deal">
              {currentLead?.deal ? (
                <div className="space-y-2">
                  <p>
                    <b>Status:</b> {currentLead.deal.status}
                  </p>
                  {currentLead.deal.finalDealValue && (
                    <p>
                      <b>Final Value:</b> {currentLead.deal.finalDealCurrency} {currentLead.deal.finalDealValue}
                    </p>
                  )}
                  {currentLead.deal.serviceTypeSold && (
                    <p>
                      <b>Service Type Sold:</b> {currentLead.deal.serviceTypeSold}
                    </p>
                  )}
                  {currentLead.deal.projectStartDate && (
                    <p>
                      <b>Project Start Date:</b> {format(new Date(currentLead.deal.projectStartDate), "MMM dd, yyyy")}
                    </p>
                  )}
                  {currentLead.deal.closedAt && (
                    <p>
                      <b>Closed On:</b> {format(new Date(currentLead.deal.closedAt), "MMM dd, yyyy")}
                    </p>
                  )}
                  {currentLead.deal.otherNotes && (
                    <p>
                      <b>Other Notes:</b> {currentLead.deal.otherNotes}
                    </p>
                  )}
                  {currentLead.deal.reasonLost && (
                    <p>
                      <b>Reason Lost:</b> {currentLead.deal.reasonLost}
                    </p>
                  )}
                  {currentLead.deal.otherNotes && (
                    <p>
                      <b>Other Notes:</b> {currentLead.deal.otherNotes}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No deal info yet</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await updateLead(currentLead._id, editForm);
                toast.success("Lead updated successfully");
                setIsEditDialogOpen(false);
                fetchLead(currentLead._id); // refresh lead
              } catch {
                toast.error("Failed to update lead");
              }
            }}
            className="grid gap-6 mt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input id="value" type="number" value={editForm.value} onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={editForm.currency || "USD"} onValueChange={(value) => setEditForm({ ...editForm, currency: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {["USD", "INR", "EUR"].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Suspect info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Source</Label>
                <Select value={editForm.suspect.leadSource} onValueChange={(value) => setEditForm({ ...editForm, suspect: { ...editForm.suspect, leadSource: value } })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {editForm.suspect.leadSource === "otherportal" && (
                <div className="space-y-2">
                  <Label htmlFor="otherPortalName">Other Portal Name</Label>
                  <Input id="otherPortalName" value={editForm.suspect.otherPortalName} onChange={(e) => setEditForm({ ...editForm, suspect: { ...editForm.suspect, otherPortalName: e.target.value } })} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="jobUrl">URL</Label>
                <Input id="jobUrl" value={editForm.suspect.jobUrl} onChange={(e) => setEditForm({ ...editForm, suspect: { ...editForm.suspect, jobUrl: e.target.value } })} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
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
                <Select value={editForm.assignedTo || "unassigned"} onValueChange={(value) => setEditForm({ ...editForm, assignedTo: value === "unassigned" ? null : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {salesReps.map((rep) => (
                      <SelectItem key={rep._id} value={rep._id}>
                        {rep.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="h-24" />
            </div>

            <DialogFooter className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" onClick={handleEditSubmit}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Activity Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{currentActivity ? "Edit Activity" : "Add Activity"}</DialogTitle>
            <DialogDescription>{currentActivity ? "Update this activity's details." : "Record a new activity for this lead."}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={async (e) => {
              e.preventDefault();

              try {
                if (currentActivity) {
                  // Edit existing
                  await handleEditActivity(currentLead._id, currentActivity._id, {
                    type: currentActivity.type,
                    description: currentActivity.description,
                    dueDate: currentActivity.dueDate,
                  });
                  toast.success("Activity updated");
                } else {
                  // Add new
                  await addActivity(currentLead._id, activityForm);
                  toast.success("Activity added");
                }

                setIsActivityDialogOpen(false);
                setCurrentActivity(null);
                setActivityForm({ type: "note", description: "", dueDate: "" });
                fetchLead(currentLead._id); // refresh lead
              } catch (err) {
                toast.error(currentActivity ? "Failed to update activity" : "Failed to add activity");
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Activity Type</Label>
                <Select value={currentActivity?.type || activityForm.type} onValueChange={(value) => (currentActivity ? setCurrentActivity({ ...currentActivity, type: value }) : setActivityForm({ ...activityForm, type: value }))}>
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
                <Textarea id="description" value={currentActivity?.description || activityForm.description} onChange={(e) => (currentActivity ? setCurrentActivity({ ...currentActivity, description: e.target.value }) : setActivityForm({ ...activityForm, description: e.target.value }))} className="h-24" required placeholder="Describe the activity details..." />
              </div>

              {(currentActivity?.type === "follow-up" || currentActivity?.type === "meeting" || activityForm.type === "follow-up" || activityForm.type === "meeting") && (
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" value={currentActivity?.dueDate ? currentActivity.dueDate.split("T")[0] : activityForm.dueDate} onChange={(e) => (currentActivity ? setCurrentActivity({ ...currentActivity, dueDate: e.target.value }) : setActivityForm({ ...activityForm, dueDate: e.target.value }))} min={new Date().toISOString().split("T")[0]} required />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsActivityDialogOpen(false);
                  setActivityForm({
                    type: "note",
                    description: "",
                    dueDate: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">{currentActivity ? "Save Changes" : "Add Activity"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Lead Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this lead and all associated activities. This action cannot be undone.</AlertDialogDescription>
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

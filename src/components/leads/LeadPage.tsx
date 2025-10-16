// import { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { useLeadsStore } from "@/lib/leads";
// import { useAuthCheck } from "@/lib/auth";
// import { UserPlus, Search, Filter, ChevronRight, Loader2 } from "lucide-react";
// import { format } from "date-fns";
// import LeadKanbanBoard from "@/components/leads/LeadKanbanBoard";
// import api from "@/lib/api";
// import { toast } from "sonner";

// const LEAD_STATUSES = ["hot", "cold", "warm"];
// const LEAD_SOURCES = ["linkedin", "email", "upwork", "otherportal"];
// export default function LeadsPage() {
//     const navigate = useNavigate();
//     const { user } = useAuthCheck();
//     const { leads, loading, filters, pagination, fetchLeads, setFilters, setPage, createLead } = useLeadsStore();

//     const [salesReps, setSalesReps] = useState([]);
//     const [loadingReps, setLoadingReps] = useState(false);
//     const [viewMode, setViewMode] = useState("list");
//     const [open, setOpen] = useState(false);

//     console.log("salesReps====>", salesReps);
//     console.log("user===>", user.id);

//     const [form, setForm] = useState({
//         name: "",
//         email: "",
//         phone: "",
//         company: "",
//         currency: "",
//         position: "",
//         value: 0,
//         status: "New Lead",
//         notes: "",
//         assignedTo: "",
//         suspect: {
//             leadSource: "",
//             otherPortalName: "",
//             jobUrl: "",
//         },
//     });

//     useEffect(() => {
//         if (user && !form.assignedTo) {
//             setForm((prev) => ({ ...prev, assignedTo: user.id }));
//         }
//     }, [user]);

//     useEffect(() => {
//         fetchLeads();

//         const fetchSalesReps = async () => {
//             try {
//                 setLoadingReps(true);
//                 const response = await api.get("/users/sales");
//                 const reps = response.data.data || [];
//                 setSalesReps(reps);

//                 if (!filters.assignedTo) {
//                     if (user.role === "admin") {
//                         setFilters({ assignedTo: null });
//                     } else {
//                         setFilters({ assignedTo: user.id });
//                     }
//                 }
//             } catch (err) {
//                 console.error("Failed to fetch sales reps", err);
//             } finally {
//                 setLoadingReps(false);
//             }
//         };

//         fetchSalesReps();
//     }, [fetchLeads]);

//     const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setFilters({ search: e.target.value });
//     };

//     const handleStatusFilterChange = (value: string) => {
//         setFilters({ status: value === "all" ? null : value });
//     };

//     const handleAssigneeFilterChange = (value: string) => {
//         setFilters({ assignedTo: value === "all" ? null : value });
//     };

//     const loadMoreLeads = () => {
//         if (pagination.hasMore) {
//             setPage(pagination.page + 1);
//         }
//     };

//     const handleCreateLead = async (e: React.FormEvent) => {
//         e.preventDefault();
//         console.log("Submitting Lead:", form);
//         try {
//             await createLead(form);
//             toast.success("Lead created successfully");
//             setOpen(false); // Close dialog
//             setForm({
//                 name: "",
//                 email: "",
//                 phone: "",
//                 currency: "",
//                 company: "",
//                 position: "",
//                 value: 0,
//                 status: "New Lead",
//                 notes: "",
//                 assignedTo: user?.id || "",
//                 suspect: {
//                     leadSource: "",
//                     otherPortalName: "",
//                     jobUrl: "",
//                 },
//             });
//             fetchLeads(); // Reload leads
//         } catch (error) {
//             toast.error("Failed to create lead");
//         }
//     };

//     const handleChange = (field: string, value: any) => {
//         const keys = field.split(".");
//         setForm((prevForm) => {
//             const updatedForm = { ...prevForm };
//             let obj: any = updatedForm;
//             for (let i = 0; i < keys.length - 1; i++) {
//                 obj[keys[i]] = { ...obj[keys[i]] };
//                 obj = obj[keys[i]];
//             }
//             obj[keys[keys.length - 1]] = value;
//             return updatedForm;
//         });
//     };

//     return (
//         <div className="space-y-6">
//             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                 <h1 className="text-3xl font-bold">Leads</h1>

//                 <Dialog open={open} onOpenChange={setOpen}>
//                     <DialogTrigger asChild>
//                         <Button>
//                             <UserPlus className="mr-2 h-4 w-4" /> Add New Lead
//                         </Button>
//                     </DialogTrigger>

//                     <DialogContent className="max-w-3xl">
//                         <DialogHeader>
//                             <DialogTitle>Create New Lead</DialogTitle>
//                         </DialogHeader>

//                         <form onSubmit={handleCreateLead} className="grid gap-6 mt-4">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div className="space-y-2">
//                                     <Label htmlFor="name">Name</Label>
//                                     <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
//                                 </div>

//                                 <div className="space-y-2">
//                                     <Label htmlFor="company">Company</Label>
//                                     <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
//                                 </div>

//                                 <div className="space-y-2">
//                                     <Label htmlFor="position">Position</Label>
//                                     <Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
//                                 </div>

//                                 <div className="space-y-2">
//                                     <Label htmlFor="email">Email</Label>
//                                     <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
//                                 </div>

//                                 <div className="space-y-2">
//                                     <Label htmlFor="phone">Phone</Label>
//                                     <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
//                                 </div>
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                     <div className="space-y-2">
//                                         <Label htmlFor="value">Value</Label>
//                                         <Input id="value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
//                                     </div>
//                                     <div className="space-y-2">
//                                         <Label htmlFor="currency">Currency</Label>
//                                         <Select value={form.currency || "USD"} onValueChange={(value) => setForm({ ...form, currency: value })}>
//                                             <SelectTrigger>
//                                                 <SelectValue placeholder="Select currency" />
//                                             </SelectTrigger>
//                                             <SelectContent>
//                                                 <SelectItem value="USD">USD</SelectItem>
//                                                 <SelectItem value="INR">INR</SelectItem>
//                                                 <SelectItem value="EUR">EUR</SelectItem>
//                                             </SelectContent>
//                                         </Select>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div className="space-y-4">
//                                 <div className="space-y-2">
//                                     <Label htmlFor="leadSource">Lead Source </Label>
//                                     <Select value={form.suspect.leadSource} onValueChange={(value) => handleChange("suspect.leadSource", value)}>
//                                         <SelectTrigger>
//                                             <SelectValue placeholder="Select lead source" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             {LEAD_SOURCES.map((source) => (
//                                                 <SelectItem key={source} value={source}>
//                                                     {source}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>
//                                 </div>

//                                 {form.suspect.leadSource === "otherportal" && (
//                                     <div className="space-y-2">
//                                         <Label htmlFor="otherPortalName">Other Portal Name</Label>
//                                         <Input id="otherPortalName" value={form.suspect.otherPortalName} onChange={(e) => handleChange("suspect.otherPortalName", e.target.value)} />
//                                     </div>
//                                 )}

//                                 <div className="space-y-2">
//                                     <Label htmlFor="jobUrl">URL</Label>
//                                     <Input id="jobUrl" placeholder="https://example.com/job" value={form.suspect.jobUrl} onChange={(e) => handleChange("suspect.jobUrl", e.target.value)} />
//                                 </div>
//                             </div>
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div className="space-y-2">
//                                     <Label htmlFor="status">Status</Label>
//                                     <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
//                                         <SelectTrigger>
//                                             <SelectValue placeholder="Select status" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             {LEAD_STATUSES.map((status) => (
//                                                 <SelectItem key={status} value={status}>
//                                                     {status}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>
//                                 </div>

//                                 <div className="space-y-2">
//                                     <Label htmlFor="assignedTo">Assigned To</Label>
//                                     <Select value={form.assignedTo} onValueChange={(value) => setForm({ ...form, assignedTo: value })}>
//                                         <SelectTrigger>
//                                             <SelectValue placeholder="Select assignee" />
//                                         </SelectTrigger>
//                                         <SelectContent>
//                                             {salesReps.map((rep: any) => (
//                                                 <SelectItem key={rep._id} value={rep._id}>
//                                                     {rep.name}
//                                                 </SelectItem>
//                                             ))}
//                                         </SelectContent>
//                                     </Select>
//                                 </div>
//                             </div>

//                             <div className="space-y-2">
//                                 <Label htmlFor="notes">Notes</Label>
//                                 <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-24" />
//                             </div>

//                             <DialogFooter className="flex justify-end gap-2">
//                                 <Button type="button" variant="outline" onClick={() => setOpen(false)}>
//                                     Cancel
//                                 </Button>
//                                 <Button type="submit">Create Lead</Button>
//                             </DialogFooter>
//                         </form>
//                     </DialogContent>
//                 </Dialog>
//             </div>

//             {/* Filters */}
//             <div className="flex flex-col sm:flex-row gap-4">
//                 <div className="flex-1 relative">
//                     <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//                     <Input placeholder="Search leads..." className="pl-8" value={filters.search} onChange={handleSearchChange} />
//                 </div>

//                 <Select value={filters.status || "all"} onValueChange={handleStatusFilterChange}>
//                     <SelectTrigger className="w-full sm:w-[180px]">
//                         <SelectValue placeholder="Filter by status" />
//                     </SelectTrigger>
//                     <SelectContent>
//                         <SelectItem value="all">All Statuses</SelectItem>
//                         {LEAD_STATUSES.map((status) => (
//                             <SelectItem key={status} value={status}>
//                                 {status}
//                             </SelectItem>
//                         ))}
//                     </SelectContent>
//                 </Select>

//                 <Select value={filters.assignedTo || "all"} onValueChange={handleAssigneeFilterChange} disabled={loadingReps}>
//                     <SelectTrigger className="w-full sm:w-[180px]">
//                         <SelectValue placeholder="Filter by assignee" />
//                     </SelectTrigger>
//                     <SelectContent>
//                         <SelectItem value="all">All Assignees</SelectItem>
//                         {salesReps.map((rep: any) => (
//                             <SelectItem key={rep._id} value={rep._id}>
//                                 {rep.name}
//                             </SelectItem>
//                         ))}
//                     </SelectContent>
//                 </Select>
//             </div>

//             {/* Tab Views */}
//             <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
//                 <TabsList className="grid w-full grid-cols-2 mb-4">
//                     <TabsTrigger value="list">List View</TabsTrigger>
//                     <TabsTrigger value="kanban">Status Board</TabsTrigger>
//                 </TabsList>

//                 <TabsContent value="list">
//                     {loading && leads.length === 0 ? (
//                         <div className="flex justify-center p-6">
//                             <Loader2 className="h-6 w-6 animate-spin text-primary" />
//                         </div>
//                     ) : leads.length === 0 ? (
//                         <Card>
//                             <CardContent className="flex flex-col items-center justify-center p-6">
//                                 <p className="text-muted-foreground mb-4">No leads found</p>
//                                 <Button onClick={() => setOpen(true)}>
//                                     <UserPlus className="mr-2 h-4 w-4" /> Create your first lead
//                                 </Button>
//                             </CardContent>
//                         </Card>
//                     ) : (
//                         <div className="space-y-2">
//                             {leads.map((lead) => (
//                                 <Card key={lead._id} className="hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/leads/${lead._id}`)}>
//                                     <CardContent className="p-4">
//                                         <div className="flex items-center justify-between">
//                                             <div className="flex flex-col">
//                                                 <div className="flex items-center gap-2">
//                                                     <span className="font-medium">{lead.name}</span>
//                                                     {lead.company && <span className="text-sm text-muted-foreground">• {lead.company}</span>}
//                                                 </div>
//                                                 <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
//                                                     <span>Status: {lead.status}</span>
//                                                     <span>Value: ${lead.value ? new Intl.NumberFormat("en-US").format(lead.value) : 0}</span>
//                                                     {lead.assignedTo && <span>Assigned to: {lead.assignedTo.name}</span>}
//                                                     <span>Created: {format(new Date(lead.createdAt), "MMM dd, yyyy")}</span>
//                                                 </div>
//                                             </div>
//                                             <ChevronRight className="h-5 w-5 text-muted-foreground" />
//                                         </div>
//                                     </CardContent>
//                                 </Card>
//                             ))}

//                             {pagination.hasMore && (
//                                 <div className="flex justify-center pt-4">
//                                     <Button variant="outline" onClick={loadMoreLeads} disabled={loading}>
//                                         {loading ? (
//                                             <>
//                                                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                                                 Loading...
//                                             </>
//                                         ) : (
//                                             "Load More"
//                                         )}
//                                     </Button>
//                                 </div>
//                             )}
//                         </div>
//                     )}
//                 </TabsContent>

//                 <TabsContent value="kanban">
//                     <LeadKanbanBoard />
//                 </TabsContent>
//             </Tabs>
//         </div>
//     );
// }


import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
 
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLeadsStore } from "@/lib/leads";
import { useAuthCheck } from "@/lib/auth";
import { UserPlus, Search, Filter, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import LeadKanbanBoard from "@/components/leads/LeadKanbanBoard";
import api from "@/lib/api";
import { toast } from "sonner";
 
const LEAD_STATUSES = ["hot", "cold", "warm"];
const LEAD_SOURCES = ["linkedin", "email", "upwork", "otherportal"];
export default function LeadsPage() {
  const navigate = useNavigate();
  const { user } = useAuthCheck();
  const { leads, loading, filters, pagination, fetchLeads, setFilters, setPage, createLead } = useLeadsStore();
 
  const [salesReps, setSalesReps] = useState([]);
  const [loadingReps, setLoadingReps] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [open, setOpen] = useState(false);
 
  console.log("salesReps====>", salesReps);
  console.log("user===>", user.id);
 
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    currency: "",
    position: "",
    value: 0,
    status: "New Lead",
    notes: "",
    assignedTo: "",
    suspect: {
      leadSource: "",
      otherPortalName: "",
      jobUrl: "",
    },
  });
 
  useEffect(() => {
    if (user && !form.assignedTo) {
      setForm((prev) => ({ ...prev, assignedTo: user.id }));
    }
  }, [user]);
 
  useEffect(() => {
    fetchLeads();
 
    const fetchSalesReps = async () => {
      try {
        setLoadingReps(true);
        const response = await api.get("/users/sales");
        const reps = response.data.data || [];
        setSalesReps(reps);
 
        if (!filters.assignedTo) {
          if (user.role === "admin") {
            setFilters({ assignedTo: null });
          } else {
            setFilters({ assignedTo: user.id });
          }
        }
      } catch (err) {
        console.error("Failed to fetch sales reps", err);
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
    setFilters({ status: value === "all" ? null : value });
  };
 
  const handleAssigneeFilterChange = (value: string) => {
    setFilters({ assignedTo: value === "all" ? null : value });
  };
 
  const loadMoreLeads = () => {
    if (pagination.hasMore) {
      setPage(pagination.page + 1);
    }
  };
 
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Lead:", form);
    try {
      await createLead(form);
      toast.success("Lead created successfully");
      setOpen(false); // Close dialog
      setForm({
        name: "",
        email: "",
        phone: "",
        currency: "",
        company: "",
        position: "",
        value: 0,
        status: "New Lead",
        notes: "",
        assignedTo: user?.id || "",
        suspect: {
          leadSource: "",
          otherPortalName: "",
          jobUrl: "",
        },
      });
      fetchLeads(); // Reload leads
    } catch (error) {
      toast.error("Failed to create lead");
    }
  };
 
  const handleChange = (field: string, value: any) => {
    const keys = field.split(".");
    setForm((prevForm) => {
      const updatedForm = { ...prevForm };
      let obj: any = updatedForm;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return updatedForm;
    });
  };
 
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Leads</h1>
 
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" /> Add New Lead
            </Button>
          </DialogTrigger>
 
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
            </DialogHeader>
 
            <form onSubmit={handleCreateLead} className="grid gap-6 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
 
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                </div>
 
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
                </div>
 
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
 
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="value">Value</Label>
                    <Input id="value" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={form.currency || "USD"} onValueChange={(value) => setForm({ ...form, currency: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leadSource">Lead Source </Label>
                  <Select value={form.suspect.leadSource} onValueChange={(value) => handleChange("suspect.leadSource", value)}>
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
 
                {form.suspect.leadSource === "otherportal" && (
                  <div className="space-y-2">
                    <Label htmlFor="otherPortalName">Other Portal Name</Label>
                    <Input id="otherPortalName" value={form.suspect.otherPortalName} onChange={(e) => handleChange("suspect.otherPortalName", e.target.value)} />
                  </div>
                )}
 
                <div className="space-y-2">
                  <Label htmlFor="jobUrl">URL</Label>
                  <Input id="jobUrl" placeholder="https://example.com/job" value={form.suspect.jobUrl} onChange={(e) => handleChange("suspect.jobUrl", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
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
                  <Select value={form.assignedTo} onValueChange={(value) => setForm({ ...form, assignedTo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {salesReps.map((rep: any) => (
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
                <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-24" />
              </div>
 
              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Lead</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
 
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." className="pl-8" value={filters.search} onChange={handleSearchChange} />
        </div>
 
        <Select value={filters.status || "all"} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
 
        <Select value={filters.assignedTo || "all"} onValueChange={handleAssigneeFilterChange} disabled={loadingReps}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {salesReps.map((rep: any) => (
              <SelectItem key={rep._id} value={rep._id}>
                {rep.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
 
      {/* Tab Views */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
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
                <Button onClick={() => setOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" /> Create your first lead
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <Card key={lead._id} className="hover:bg-accent/50 cursor-pointer" onClick={() => navigate(`/leads/${lead._id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{lead.name}</span>
                          {lead.company && <span className="text-sm text-muted-foreground">• {lead.company}</span>}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                          <span>Status: {lead.status}</span>
                          <span>Value: ${lead.value ? new Intl.NumberFormat("en-US").format(lead.value) : 0}</span>
                          {lead.assignedTo && <span>Assigned to: {lead.assignedTo.name}</span>}
                          <span>Created: {format(new Date(lead.createdAt), "MMM dd, yyyy")}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
 
              {pagination.hasMore && (
                <div className="flex justify-center pt-4">
                  <Button variant="outline" onClick={loadMoreLeads} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
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
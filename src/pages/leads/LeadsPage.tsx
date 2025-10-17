import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLeadsStore } from "@/lib/leads";
import { useAuthCheck } from "@/lib/auth";
import {
  UserPlus,
  Search,
  Loader2,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import LeadKanbanBoard from "@/components/leads/LeadKanbanBoard";
import api from "@/lib/api";
import { toast } from "sonner";

const LEAD_STATUSES = ["hot", "cold", "warm"];
const LEAD_SOURCES = ["linkedin", "email", "upwork", "otherportal"];

export default function LeadsPage() {
  const navigate = useNavigate();
  const { user } = useAuthCheck();
  const {
    leads,
    loading,
    filters,
    pagination,
    fetchLeads,
    setFilters,
    setPage,
  } = useLeadsStore();

  const [salesReps, setSalesReps] = useState([]);
  const [loadingReps, setLoadingReps] = useState(false);
  const [viewMode, setViewMode] = useState("list");

  // 🔹 unified dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 🔹 shared form
  const emptyForm = {
    name: "",
    company: "",
    position: "",
    email: "",
    phone: "",
    currency: "USD",
    value: 0,
    status: "hot",
    notes: "",
    assignedTo: "",
    suspect: {
      leadSource: "",
      otherPortalName: "",
      jobUrl: "",
    },
  };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchLeads();
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      setLoadingReps(true);
      const response = await api.get("/users/sales");
      setSalesReps(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch sales reps", err);
    } finally {
      setLoadingReps(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ search: e.target.value });
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/leads/${form._id}`, form);
        toast.success("Lead updated successfully");
      } else {
        await api.post(`/leads`, form);
        toast.success("Lead created successfully");
      }

      setIsDialogOpen(false);
      setForm(emptyForm);
      fetchLeads();
    } catch (error) {
      toast.error(isEditing ? "Failed to update lead" : "Failed to create lead");
    }
  };

  const handleEdit = (lead: any) => {
  setForm({
    ...lead,
    assignedTo: lead.assignedTo?._id || "", 
  });
  setIsEditing(true);
  setIsDialogOpen(true);
};

  // const handleDelete = async (leadId: string) => {
  //   if (confirm("Are you sure you want to delete this lead?")) {
  //     try {
  //       await api.delete(`/leads/${leadId}`);
  //       toast.success("Lead deleted successfully");
  //       fetchLeads();
  //     } catch {
  //       toast.error("Failed to delete lead");
  //     }
  //   }
  // };

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

  const getStatusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "hot":
        return "bg-red-100 text-red-700 border border-red-300";
      case "warm":
        return "bg-yellow-100 text-yellow-700 border border-yellow-300";
      case "cold":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      default:
        return "bg-green-100 text-green-700 border border-green-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Button
          onClick={() => {
            setIsEditing(false);
            setForm(emptyForm);
            setIsDialogOpen(true);
          }}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add New Lead
        </Button>
      </div>

      {/* Filters */}
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
      </div>

      {/* Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="kanban">Status Board</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {loading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : leads.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-muted-foreground mb-4">No leads found</p>
                <Button
                  onClick={() => {
                    setIsEditing(false);
                    setForm(emptyForm);
                    setIsDialogOpen(true);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Create your first lead
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-3 font-semibold">Name</th>
                    <th className="p-3 font-semibold">Company</th>
                    <th className="p-3 font-semibold">Email</th>
                    <th className="p-3 font-semibold">Phone</th>
                    <th className="p-3 font-semibold">Value</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Assigned To</th>
                    <th className="p-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead._id} onClick={() => navigate(`/leads/${lead._id}`)} className="border-b hover:bg-accent/40 cursor-pointer">
                      <td className="p-3">{lead.name}</td>
                      <td className="p-3">{lead.company || "-"}</td>
                      <td className="p-3">{lead.email || "-"}</td>
                      <td className="p-3">{lead.phone || "-"}</td>
                      <td className="p-3">{lead.value || 0} {lead.currency}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusStyle(lead.status)}`}
                        >
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-3">
                        {lead.assignedTo?.name ? (
                          <div>
                            <p className="font-medium">{lead.assignedTo.name}</p>
                            <p className="text-xs text-muted-foreground">{lead.assignedTo.email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm italic">Unassigned</span>
                        )}
                      </td>
                      <td className="p-3 flex justify-center gap-2">
                        <Button size="sm" variant="secondary" onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(lead);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="kanban">
          <LeadKanbanBoard />
        </TabsContent>
      </Tabs>

      {/* 🔹 Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle >{isEditing ? "Edit Lead" : "Add New Lead"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateOrUpdate} className="grid gap-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Update Lead" : "Create Lead"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div >
  );
}
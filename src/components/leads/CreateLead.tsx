import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeadsStore } from '@/lib/leads';
import { toast } from 'sonner';
import api from '@/lib/api';

const LEAD_STATUSES = ['Hot', 'Cold', 'Warm']
export default function LeadCreatePage() {
  const navigate = useNavigate();
  const { createLead } = useLeadsStore();
  const [salesReps, setSalesReps] = useState([]);
  const [loadingReps, setLoadingReps] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    position: '',
    value: 0,
    status: 'New Lead',
    notes: '',
    assignedTo: '',
    suspect: {
      leadSource: '',
      otherPortalName: '',
      jobUrl: '',
      jobTitle: '',
      jobDescription: '',
      jobLocation: '',
      jobType: '',
      jobSalary: '',
      jobExperience: '',
      jobSkills: '',
      jobRequirements: '',
      jobBenefits: '',
      jobStatus: '',
    },
    prospect: {
      status: '',
    },
    leadQualified: {
      status: '',
    },
    opportunity: {
      dealStage: '',
    },
    deal: {
      status: '',
    },
  });

  useEffect(() => {
    const fetchSalesReps = async () => {
      try {
        setLoadingReps(true);
        const response = await api.get('/users/sales');
        console.log(response.data.data, "reponse")
        setSalesReps(response.data.data);
      } catch (error) {
        console.error('Failed to fetch sales reps', error);
        toast.error('Failed to load sales reps');
      } finally {
        setLoadingReps(false);
      }
    };

    fetchSalesReps();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createLead(form);
      toast.success('Lead created successfully');
      navigate('/leads');
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Create New Lead</h1>
        <Button variant="outline" onClick={() => navigate('/leads')}>Cancel</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-6">
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

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value })}
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
                value={form.assignedTo || "unassigned"}
                onValueChange={(value) =>
                  setForm({ ...form, assignedTo: value === "unassigned" ? "" : value })
                }
                disabled={loadingReps}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="unassigned"></SelectItem> */}
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
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="h-24"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit">Create Lead</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

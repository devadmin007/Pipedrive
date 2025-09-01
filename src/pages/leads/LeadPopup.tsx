"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const LEAD_SOURCES = ["linkedin", "email", "upwork", "otherportal"];
const PROSPECT_STATUSES = ["interested", "not_interested", "not_now", "unqualified", "no_response"];
const INTERESTED_SERVICES = ["mvp", "website", "app", "dedicated developer", "ui/ux", "qa", "devops", "other"];
const DEAL_STAGES = ["proposal_sent", "negotiation", "verbal_commit", "legal/procurement", "closed_won", "closed_lost"];
const DEAL_STATUSES = ["Won", "Lost"];
const REASON_LOST_OPTIONS = ["Price", "Delay", "No Response", "Bad Fit", "Timing", "Competitor", "Other"];

// Default form structure
const getDefaultForm = () => ({
  name: "",
  company: "",
  position: "",
  email: "",
  phone: "",
  notes: "",
  status: "cold",
  currentStage: "cold", // Track which stage we're editing
  suspect: { leadSource: "", otherPortalName: "", jobUrl: "" },
  prospect: { status: "", lastContactedAt: "", notes: "" },
  leadQualified: {
    interestedServices: [],
    budgetApprox: "",
    budgetCurrency: "USD",
    timelineApprox: "",
    meetingScheduled: false,
    meetingDate: "",
  },
  opportunity: {
    budgetAmount: "",
    budgetCurrency: "USD",
    dealStage: "",
    customRequirements: "",
  },
  deal: {
    status: "",
    serviceTypeSold: "",
    projectStartDate: "",
    finalDealValue: "",
    finalDealCurrency: "USD",
    reasonLost: "",
    otherNotes: "",
  },
});

export default function LeadPopup({ open, onClose, onSave, initialData = null }) {
  const [form, setForm] = useState(getDefaultForm());

  // Pre-fill form when initialData is provided
  useEffect(() => {
    console.log('LeadPopup received:', { open, initialData });
    
    if (initialData && open) {
      setForm({
        ...getDefaultForm(),
        ...initialData,
        // Ensure nested objects are properly merged
        suspect: { ...getDefaultForm().suspect, ...(initialData.suspect || {}) },
        prospect: { ...getDefaultForm().prospect, ...(initialData.prospect || {}) },
        leadQualified: { ...getDefaultForm().leadQualified, ...(initialData.leadQualified || {}) },
        opportunity: { ...getDefaultForm().opportunity, ...(initialData.opportunity || {}) },
        deal: { ...getDefaultForm().deal, ...(initialData.deal || {}) },
      });
    } else if (open) {
      // Reset form when opening without initial data
      setForm(getDefaultForm());
    }
  }, [initialData, open]);

  const handleChange = (path: string, value: any) => {
    setForm((prev) => {
      const keys = path.split(".");
      let obj = { ...prev };
      let temp = obj;
      keys.slice(0, -1).forEach((k) => {
        temp[k] = { ...temp[k] };
        temp = temp[k];
      });
      temp[keys[keys.length - 1]] = value;
      return obj;
    });
  };

  const handleSubmit = () => {
    // Clean up the form data before sending - only include relevant sections
    const cleanedForm = {
      ...form,
    };

    // Remove empty strings from enum fields to avoid validation errors
    if (cleanedForm.deal?.status === "") delete cleanedForm.deal.status;
    if (cleanedForm.deal?.reasonLost === "") delete cleanedForm.deal.reasonLost;
    if (cleanedForm.opportunity?.dealStage === "") delete cleanedForm.opportunity.dealStage;
    if (cleanedForm.prospect?.status === "") delete cleanedForm.prospect.status;
    if (cleanedForm.suspect?.leadSource === "") delete cleanedForm.suspect.leadSource;

    // Remove currentStage as it's just for UI logic
    delete cleanedForm.currentStage;

    console.log('Saving form data:', cleanedForm);
    onSave(cleanedForm);
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD for date input
  };

  const handleMultiSelectChange = (path, value) => {
    const currentValues = form.leadQualified.interestedServices;
    let newValues;
    
    if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }
    
    handleChange(path, newValues);
  };

  const currentStage = form.currentStage || form.status;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead - {currentStage.charAt(0).toUpperCase() + currentStage.slice(1)} Stage</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info - Always show */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(e) => handleChange("company", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={form.position}
                  onChange={(e) => handleChange("position", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>
           
          </div>

          {/* Conditional sections based on what stage they want to fill */}

          <Separator />

          {/* Suspect Details */}
          {currentStage === "suspect" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Suspect Details</h3>
              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Source *</Label>
                <Select
                  value={form.suspect.leadSource}
                  onValueChange={(value) => handleChange("suspect.leadSource", value)}
                >
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
                  <Input
                    id="otherPortalName"
                    value={form.suspect.otherPortalName}
                    onChange={(e) => handleChange("suspect.otherPortalName", e.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="jobUrl">Job URL</Label>
                <Input
                  id="jobUrl"
                  placeholder="https://example.com/job"
                  value={form.suspect.jobUrl}
                  onChange={(e) => handleChange("suspect.jobUrl", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Prospect Details */}
          {currentStage === "prospect" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Prospect Details</h3>
              <div className="space-y-2">
                <Label htmlFor="prospectStatus">Prospect Status *</Label>
                <Select
                  value={form.prospect.status}
                  onValueChange={(value) => handleChange("prospect.status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select prospect status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROSPECT_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastContactedAt">Last Contacted At</Label>
                <Input
                  id="lastContactedAt"
                  type="date"
                  value={formatDate(form.prospect.lastContactedAt)}
                  onChange={(e) => handleChange("prospect.lastContactedAt", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prospectNotes">Notes</Label>
                <Textarea
                  id="prospectNotes"
                  value={form.prospect.notes}
                  onChange={(e) => handleChange("prospect.notes", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Lead Qualified Details */}
          {currentStage === "qualified" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lead Qualified Details</h3>
              <div className="space-y-2">
                <Label>Interested Services</Label>
                <div className="grid grid-cols-3 gap-2">
                  {INTERESTED_SERVICES.map((service) => (
                    <label key={service} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.leadQualified.interestedServices.includes(service)}
                        onChange={() => handleMultiSelectChange("leadQualified.interestedServices", service)}
                        className="rounded"
                      />
                      <span className="text-sm">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetApprox">Budget Approx</Label>
                  <Input
                    id="budgetApprox"
                    type="number"
                    value={form.leadQualified.budgetApprox}
                    onChange={(e) => handleChange("leadQualified.budgetApprox", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timelineApprox">Timeline Approx</Label>
                  <Input
                    id="timelineApprox"
                    placeholder="e.g., 4-6 weeks, Q4"
                    value={form.leadQualified.timelineApprox}
                    onChange={(e) => handleChange("leadQualified.timelineApprox", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingDate">Meeting Date</Label>
                <Input
                  id="meetingDate"
                  type="date"
                  value={formatDate(form.leadQualified.meetingDate)}
                  onChange={(e) => handleChange("leadQualified.meetingDate", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Opportunity Details */}
          {currentStage === "opportunity" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Opportunity Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budgetAmount">Budget Amount</Label>
                  <Input
                    id="budgetAmount"
                    type="number"
                    value={form.opportunity.budgetAmount}
                    onChange={(e) => handleChange("opportunity.budgetAmount", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budgetCurrency">Budget Currency</Label>
                  <Select
                    value={form.opportunity.budgetCurrency}
                    onValueChange={(value) => handleChange("opportunity.budgetCurrency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealStage">Deal Stage</Label>
                <Select
                  value={form.opportunity.dealStage}
                  onValueChange={(value) => handleChange("opportunity.dealStage", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customRequirements">Custom Requirements</Label>
                <Textarea
                  id="customRequirements"
                  value={form.opportunity.customRequirements}
                  onChange={(e) => handleChange("opportunity.customRequirements", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Deal Details */}
          {currentStage === "deal" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Deal Details</h3>
              <div className="space-y-2">
                <Label htmlFor="dealStatus">Deal Status *</Label>
                <Select
                  value={form.deal.status}
                  onValueChange={(value) => handleChange("deal.status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deal status" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.deal.status === "Won" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceTypeSold">Service Type Sold</Label>
                    <Input
                      id="serviceTypeSold"
                      value={form.deal.serviceTypeSold}
                      onChange={(e) => handleChange("deal.serviceTypeSold", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectStartDate">Project Start Date</Label>
                    <Input
                      id="projectStartDate"
                      type="date"
                      value={formatDate(form.deal.projectStartDate)}
                      onChange={(e) => handleChange("deal.projectStartDate", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="finalDealValue">Final Deal Value</Label>
                      <Input
                        id="finalDealValue"
                        type="number"
                        value={form.deal.finalDealValue}
                        onChange={(e) => handleChange("deal.finalDealValue", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finalDealCurrency">Currency</Label>
                      <Select
                        value={form.deal.finalDealCurrency}
                        onValueChange={(value) => handleChange("deal.finalDealCurrency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {form.deal.status === "Lost" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reasonLost">Reason Lost</Label>
                    <Select
                      value={form.deal.reasonLost}
                      onValueChange={(value) => handleChange("deal.reasonLost", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        {REASON_LOST_OPTIONS.map((reason) => (
                          <SelectItem key={reason} value={reason}>
                            {reason}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherNotes">Other Notes</Label>
                    <Textarea
                      id="otherNotes"
                      value={form.deal.otherNotes}
                      onChange={(e) => handleChange("deal.otherNotes", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
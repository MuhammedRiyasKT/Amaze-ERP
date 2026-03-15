// components/dashboards/sales/SalesLeadsTab.tsx
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog"

// --- ICONS ---
import { 
    Search, Target, Plus, ArrowRight, Edit, Trash2, Phone, Mail, User, 
    Calendar, SlidersHorizontal, FilterX, Activity, CheckCircle2, XCircle, Eye 
} from "lucide-react"

import { type Customer, type StaffUser } from "@/lib/sales"

// Define the expected props
interface SalesLeadsTabProps {
    error: string
    isLoading: boolean
    searchTerm: string
    setSearchTerm: (term: string) => void
    leadStaffFilterName: string
    setLeadStaffFilterName: (name: string) => void
    leadStatusFilter: string
    setLeadStatusFilter: (status: string) => void
    leadFromDate: string
    setLeadFromDate: (date: string) => void
    leadToDate: string
    setLeadToDate: (date: string) => void
    staffs: StaffUser[]
    isStaffLoading: boolean
    filteredCustomers: Customer[]
    LEAD_STATUSES: string[]
    handleAddCustomer: () => void
    handleViewLead: (lead: Customer) => void
    handleEditCustomer: (lead: Customer) => void
    handleConvertToOrder: (lead: Customer) => void
    handleDeleteCustomer: (id: number) => void
    getStatusColor: (status: string) => string
}

// -------------------------------------------------------------
// Helper: Map Status to Intuitive Icon
// -------------------------------------------------------------
const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('new') || s.includes('pending')) return <Activity className="w-3.5 h-3.5 mr-1.5" />;
    if (s.includes('contact') || s.includes('follow')) return <Phone className="w-3.5 h-3.5 mr-1.5" />;
    if (s.includes('convert') || s.includes('won') || s.includes('qualif')) return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />;
    if (s.includes('lost') || s.includes('reject') || s.includes('dead')) return <XCircle className="w-3.5 h-3.5 mr-1.5" />;
    return <Target className="w-3.5 h-3.5 mr-1.5" />;
};

export const SalesLeadsTab: React.FC<SalesLeadsTabProps> = ({
    error,
    isLoading,
    searchTerm,
    setSearchTerm,
    leadStaffFilterName,
    setLeadStaffFilterName,
    leadStatusFilter,
    setLeadStatusFilter,
    leadFromDate,
    setLeadFromDate,
    leadToDate,
    setLeadToDate,
    staffs,
    isStaffLoading,
    filteredCustomers,
    LEAD_STATUSES,
    handleAddCustomer,
    handleViewLead,
    handleEditCustomer,
    handleConvertToOrder,
    handleDeleteCustomer,
    getStatusColor
}) => {

    const hasActiveFilters = searchTerm || leadStaffFilterName !== 'all' || leadStatusFilter !== 'all' || leadFromDate || leadToDate;

    const clearAllFilters = () => {
        setSearchTerm('');
        setLeadStaffFilterName('all');
        setLeadStatusFilter('all');
        setLeadFromDate('');
        setLeadToDate('');
    };

    const FilterControls = ({ className = "" }: { className?: string }) => (
        <div className={className}>
            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Sales Rep</label>
                <Select value={leadStaffFilterName} onValueChange={setLeadStaffFilterName} disabled={isStaffLoading}>
                    <SelectTrigger className="w-full md:w-[160px] bg-white">
                        <SelectValue placeholder="All Staff" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Staff</SelectItem>
                        {staffs.map(staff => (<SelectItem key={staff.id} value={staff.staff_name}>{staff.staff_name}</SelectItem>))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">From Date</label>
                <Input
                    type="date"
                    value={leadFromDate}
                    onChange={(e) => setLeadFromDate(e.target.value)}
                    className="w-full md:w-[150px] bg-white"
                />
            </div>
            
            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">To Date</label>
                <Input
                    type="date"
                    value={leadToDate}
                    onChange={(e) => setLeadToDate(e.target.value)}
                    className="w-full md:w-[150px] bg-white"
                />
            </div>
        </div>
    );

    return (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="pb-4 px-4 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center text-2xl">
                            <Target className="h-6 w-6 mr-3 text-orange-600" />
                            Lead Management
                        </CardTitle>
                        <CardDescription className="mt-1 text-sm text-gray-500">
                            Track your sales pipeline, follow up with prospects, and convert leads to orders.
                        </CardDescription>
                    </div>
                    <Button 
                        className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-sm" 
                        onClick={handleAddCustomer}
                        size="lg"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Add New Lead
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}

                {/* --- QUICK STATUS TABS (Pipeline Stages) --- */}
                <div className="mb-6 flex overflow-x-auto pb-2 scrollbar-hide gap-2">
                    <Button 
                        variant={leadStatusFilter === 'all' ? 'default' : 'outline'}
                        onClick={() => setLeadStatusFilter('all')}
                        className={`rounded-full px-5 flex-shrink-0 ${leadStatusFilter === 'all' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-white'}`}
                    >
                        All Leads
                    </Button>
                    {LEAD_STATUSES.map(status => (
                        <Button
                            key={status}
                            variant={leadStatusFilter === status ? 'default' : 'outline'}
                            onClick={() => setLeadStatusFilter(status)}
                            className={`rounded-full px-5 flex-shrink-0 capitalize ${leadStatusFilter === status ? getStatusColor(status).replace('text-', 'bg-').replace('100', '600').replace('800', 'white') : 'bg-white text-gray-600'}`}
                        >
                            {getStatusIcon(status)}
                            {status.replace('_', ' ')}
                        </Button>
                    ))}
                </div>

                {/* --- ADVANCED SEARCH & FILTERS BOX --- */}
                <div className="bg-gray-50/70 border rounded-xl p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        
                        {/* SEARCH INPUT */}
                        <div className="flex-1 w-full">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Search Leads</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="Search by name, email, or phone..." 
                                    className="pl-10 bg-white" 
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>

                        {/* MOBILE FILTER TRIGGER */}
                        <div className="w-full lg:w-auto lg:hidden">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="w-full flex items-center bg-white">
                                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                                        More Filters
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent> 
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Apply Filters</AlertDialogTitle>
                                        <AlertDialogDescription>Refine your lead pipeline view.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <FilterControls className="flex flex-col gap-4 py-4" />
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Close</AlertDialogCancel>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        {/* DESKTOP FILTERS */}
                        <FilterControls className="hidden lg:flex items-center gap-4 flex-wrap" />

                        {hasActiveFilters && (
                            <Button 
                                variant="ghost" 
                                onClick={clearAllFilters} 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                <FilterX className="h-4 w-4 mr-2" /> Clear Filters
                            </Button>
                        )}
                    </div>
                </div>

                {/* --- LEADS LIST --- */}
                {isLoading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
                        <p className="mt-4 text-sm font-medium text-gray-500">Loading pipeline...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredCustomers.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
                                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900">No leads found</h3>
                                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                                    {hasActiveFilters 
                                        ? "Try adjusting your filters or search terms to find what you're looking for." 
                                        : "Your pipeline is empty. Click 'Add New Lead' to start tracking a prospect."}
                                </p>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredCustomers.map((lead) => (
                                <div key={lead.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                                    
                                    {/* CARD HEADER: Name & Status */}
                                    <div className="bg-gray-50/80 px-4 py-3 border-b flex justify-between items-center flex-wrap gap-2">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-orange-100 rounded-full flex-shrink-0 flex items-center justify-center">
                                                <Target className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <span className="font-bold text-gray-900 text-lg">
                                                {lead.customer_name}
                                            </span>
                                        </div>
                                        <Badge className={`px-2.5 py-1 uppercase tracking-wide text-[10px] font-bold ${getStatusColor(lead.status)}`}>
                                            <span className="flex items-center">
                                                {getStatusIcon(lead.status)}
                                                {lead.status}
                                            </span>
                                        </Badge>
                                    </div>

                                    {/* CARD BODY: Details Grid */}
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        
                                        {/* Contact Info (if available in Customer type) */}
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Contact Details</p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <User className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                    {lead.customer_name}
                                                </div>
                                                {/* Note: Adjust property names if your Customer type differs */}
                                                {'contact_number' in lead && lead.contact_number && (
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                        {lead.contact_number as string}
                                                    </div>
                                                )}
                                                {'email' in lead && lead.email && (
                                                    <div className="flex items-center text-sm text-gray-700">
                                                        <Mail className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                        <span className="truncate max-w-[180px]">{lead.email as string}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Timeline</p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                    Created: <span className="font-medium ml-1">{new Date(lead.created_on).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Activity className="h-3.5 w-3.5 mr-2 text-gray-300" />
                                                    Updated: <span className="ml-1">{new Date(lead.updated_on).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rep / Assignment */}
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Assigned To</p>
                                            <div className="flex items-center text-sm text-gray-800 font-medium">
                                                <div className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs mr-2">
                                                    {(lead.created_by_staff_name || 'S')[0].toUpperCase()}
                                                </div>
                                                {lead.created_by_staff_name || 'System / Auto'}
                                            </div>
                                        </div>

                                    </div>

                                    {/* CARD FOOTER: Actions */}
                                    <div className="px-4 py-3 bg-gray-50/50 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            {/* Destructive Action */}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100 px-2">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                                                        <AlertDialogDescription>Are you sure you want to permanently delete {lead.customer_name}? This action cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteCustomer(lead.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                            
                                            {/* Secondary Actions */}
                                            <Button variant="outline" size="sm" className="bg-white" onClick={() => handleEditCustomer(lead)}>
                                                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                            </Button>
                                            <Button variant="outline" size="sm" className="bg-white" onClick={() => handleViewLead(lead)}>
                                                <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                                            </Button>
                                        </div>

                                        {/* Primary Action */}
                                        <Button 
                                            variant="default" 
                                            size="sm" 
                                            onClick={() => handleConvertToOrder(lead)} 
                                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                        >
                                            Convert to Order <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
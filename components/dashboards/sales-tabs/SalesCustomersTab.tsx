// components/dashboards/sales/SalesCustomersTab.tsx
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
    AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger 
} from "@/components/ui/alert-dialog"

// --- ICONS ---
import { 
    Search, Users, Phone, MessageSquare, Edit, ShoppingCart, 
    SlidersHorizontal, FilterX, Calendar, Activity, User, Eye, Plus
} from "lucide-react"

import { type RealCustomer, type StaffUser } from "@/lib/sales"

interface SalesCustomersTabProps {
    error: string
    isRealCustomersLoading: boolean
    realCustomerSearchTerm: string
    setRealCustomerSearchTerm: (term: string) => void
    customerStaffFilterName: string
    setCustomerStaffFilterName: (name: string) => void
    customerFromDate: string
    setCustomerFromDate: (date: string) => void
    customerToDate: string
    setCustomerToDate: (date: string) => void
    staffs: StaffUser[]
    isStaffLoading: boolean
    filteredRealCustomers: RealCustomer[]
    handleViewRealCustomer: (customer: RealCustomer) => void
    handleEditRealCustomer: (customer: RealCustomer) => void
    handleMakeNewOrder: (customer: RealCustomer) => void
}

export const SalesCustomersTab: React.FC<SalesCustomersTabProps> = ({
    error,
    isRealCustomersLoading,
    realCustomerSearchTerm,
    setRealCustomerSearchTerm,
    customerStaffFilterName,
    setCustomerStaffFilterName,
    customerFromDate,
    setCustomerFromDate,
    customerToDate,
    setCustomerToDate,
    staffs,
    isStaffLoading,
    filteredRealCustomers,
    handleViewRealCustomer,
    handleEditRealCustomer,
    handleMakeNewOrder,
}) => {

    const hasActiveFilters = realCustomerSearchTerm || customerStaffFilterName !== 'all' || customerFromDate || customerToDate;

    const clearAllFilters = () => {
        setRealCustomerSearchTerm('');
        setCustomerStaffFilterName('all');
        setCustomerFromDate('');
        setCustomerToDate('');
    };

    const FilterControls = ({ className = "" }: { className?: string }) => (
        <div className={className}>
            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Account Manager</label>
                <Select value={customerStaffFilterName} onValueChange={setCustomerStaffFilterName} disabled={isStaffLoading}>
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
                    value={customerFromDate}
                    onChange={(e) => setCustomerFromDate(e.target.value)}
                    className="w-full md:w-[150px] bg-white"
                />
            </div>
            
            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">To Date</label>
                <Input
                    type="date"
                    value={customerToDate}
                    onChange={(e) => setCustomerToDate(e.target.value)}
                    className="w-full md:w-[150px] bg-white"
                />
            </div>
        </div>
    );

    return (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="pb-4 px-4 sm:px-6">
                <div>
                    <CardTitle className="flex items-center text-2xl">
                        <Users className="h-6 w-6 mr-3 text-blue-600" />
                        Customer Directory
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-gray-500">
                        Manage your active clients who have successfully placed orders.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
                {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}

                {/* --- ADVANCED SEARCH & FILTERS BOX --- */}
                <div className="bg-gray-50/70 border rounded-xl p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        
                        {/* SEARCH INPUT */}
                        <div className="flex-1 w-full">
                            <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">Search Customers</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input 
                                    placeholder="Search by name, phone, or WhatsApp..." 
                                    className="pl-10 bg-white" 
                                    value={realCustomerSearchTerm} 
                                    onChange={(e) => setRealCustomerSearchTerm(e.target.value)} 
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
                                        <AlertDialogDescription>Refine your customer list view.</AlertDialogDescription>
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

                {/* --- CUSTOMERS LIST --- */}
                {isRealCustomersLoading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-sm font-medium text-gray-500">Loading customers...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredRealCustomers.length === 0 ? (
                            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
                                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900">No customers found</h3>
                                <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                                    {hasActiveFilters 
                                        ? "Try adjusting your filters or search terms to find what you're looking for." 
                                        : "You don't have any converted customers yet. Leads that are converted to orders will appear here automatically."}
                                </p>
                                {hasActiveFilters && (
                                    <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                                        Clear Filters
                                    </Button>
                                )}
                            </div>
                        ) : (
                            filteredRealCustomers.map((customer) => (
                                <div key={customer.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                                    
                                    {/* CARD HEADER: Name & Avatar */}
                                    <div className="bg-gray-50/80 px-4 py-3 border-b flex justify-between items-center gap-2">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center">
                                                <User className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <span className="font-bold text-gray-900 text-lg">
                                                {customer.customer_name}
                                            </span>
                                        </div>
                                    </div>

                                    {/* CARD BODY: Details Grid */}
                                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                                        
                                        {/* Contact Info */}
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Contact Details</p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                    {customer.mobile_number || 'N/A'}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <MessageSquare className="h-3.5 w-3.5 mr-2 text-green-500" />
                                                    {customer.whatsapp_number || 'N/A'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timeline */}
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Timeline</p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center text-sm text-gray-700">
                                                    <Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                                    Created: <span className="font-medium ml-1">{new Date(customer.created_on).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Activity className="h-3.5 w-3.5 mr-2 text-gray-300" />
                                                    Updated: <span className="ml-1">{new Date(customer.updated_on).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rep / Assignment */}
                                        <div>
                                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Account Manager</p>
                                            <div className="flex items-center text-sm text-gray-800 font-medium">
                                                <div className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs mr-2">
                                                    {(customer.created_by_staff_name || 'S')[0].toUpperCase()}
                                                </div>
                                                {customer.created_by_staff_name || 'System / Auto'}
                                            </div>
                                        </div>

                                    </div>

                                    {/* CARD FOOTER: Actions */}
                                    <div className="px-4 py-3 bg-gray-50/50 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
                                        
                                        {/* Secondary Actions */}
                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Button variant="outline" size="sm" className="bg-white" onClick={() => handleEditRealCustomer(customer)}>
                                                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                            </Button>
                                            <Button variant="outline" size="sm" className="bg-white" onClick={() => handleViewRealCustomer(customer)}>
                                                <Eye className="h-3.5 w-3.5 mr-1.5" /> View Details
                                            </Button>
                                        </div>

                                        {/* Primary Action */}
                                        <Button 
                                            variant="default" 
                                            size="sm" 
                                            onClick={() => handleMakeNewOrder(customer)} 
                                            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Order
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
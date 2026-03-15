"use client"

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// --- ICONS ---
import { 
    Search, ShoppingCart, Edit, Trash2, IndianRupee, Calendar, Package, 
    SlidersHorizontal, Image as ImageIcon, Upload, X, Plus, Clock, 
    CheckCircle2, XCircle, Activity, FilterX, Eye, CheckSquare
} from "lucide-react"

import { type Order, type Customer, type RealCustomer, type StaffUser } from "@/lib/sales"

// =========================================================================================
// API IMPORTS from '@/lib/crm'
// =========================================================================================
import { 
    type OrderImage as ApiOrderImage, 
    getOrderImages, 
    uploadOrderImage, 
    deleteOrderImage 
} from '@/lib/crm'; 

type OrderImage = ApiOrderImage & {
    public_id: string; 
};

// =========================================================================================

export interface SalesTask {
    id: number
    order_id: number
    status: string
    task_description?: string

    assigned_to?: {
        id?: number
        staff_name?: string
        role?: string   // ⭐ ADD THIS
    }

    assigned_by?: {
        id?: number
        staff_name?: string
        role?: string
    }

    [key: string]: any
}

interface SalesOrdersTabProps {
    error: string
    isOrdersLoading: boolean
    orderSearchTerm: string
    setOrderSearchTerm: (term: string) => void
    orderRoleFilter: string // CHANGED: Staff to Role
    setOrderRoleFilter: (role: string) => void // CHANGED: Staff to Role
    orderStatusFilter: string
    setOrderStatusFilter: (status: string) => void
    orderFromDate: string
    setOrderFromDate: (date: string) => void
    orderToDate: string
    setOrderToDate: (date: string) => void
    staffs: StaffUser[]
    isStaffLoading: boolean
    filteredOrders: Order[]
    tasks?: SalesTask[] 
    ORDER_STATUSES: string[]
    customers: Customer[]
    realCustomers: RealCustomer[]
    handleMakeNewOrder: (customer: RealCustomer | null) => void
    handleViewOrder: (order: Order) => void
    handleEditOrder: (order: Order) => void
    handleDeleteOrder: (id: number) => void
    getOrderStatusColor: (status: string) => string
}

// -------------------------------------------------------------
// Image Manager Component
// -------------------------------------------------------------

interface ImageManagerProps {
    order: Order;
    onClose: () => void;
}

const OrderImageManagerDialog: React.FC<ImageManagerProps> = ({ order, onClose }) => {
    const [images, setImages] = useState<OrderImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const[isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const[uploadFile, setUploadFile] = useState<File | null>(null);
    const[uploadDescription, setUploadDescription] = useState('');

    const orderId = order.id;

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const fetchedImages = await getOrderImages(orderId); 
            setImages(fetchedImages as OrderImage[]); 
        } catch (err) {
            setError(`Failed to load images: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchImages();
    },[fetchImages]);

    const handleUpload = async () => {
        if (!uploadFile) {
            setError('Please select an image file.');
            return;
        }
        setIsUploading(true);
        setError('');
        try {
            const newImage = await uploadOrderImage(orderId, uploadFile, uploadDescription); 
            setImages(prev => [...prev, newImage as OrderImage]); 
            setUploadFile(null);
            setUploadDescription('');
            const fileInput = (document.getElementById('image-file-input') as HTMLInputElement);
            if (fileInput) fileInput.value = ''; 
        } catch (err) {
            setError(`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (imageToDelete: OrderImage) => {
        setIsLoading(true); 
        setError('');
        try {
            await deleteOrderImage(imageToDelete.id, imageToDelete.public_id); 
            setImages(prev => prev.filter(img => img.id !== imageToDelete.id));
        } catch (err) {
            setError(`Deletion failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
            fetchImages(); 
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2 text-blue-600" /> 
                        Images for Order #{orderId}
                    </DialogTitle>
                </DialogHeader>

                {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
                
                {/* Image Upload Section */}
                <div className="border p-4 rounded-lg mb-4 bg-gray-50/80">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wider">Upload New Image</h4>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input 
                            id="image-file-input"
                            type="file" 
                            accept="image/*"
                            onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                            className="flex-1 bg-white"
                            disabled={isUploading}
                        />
                        <Input 
                            placeholder="Optional Description (e.g., 'Site Photo')"
                            value={uploadDescription}
                            onChange={(e) => setUploadDescription(e.target.value)}
                            className="flex-1 bg-white"
                            disabled={isUploading}
                        />
                        <Button onClick={handleUpload} disabled={isUploading || !uploadFile} className="sm:w-auto bg-blue-600 hover:bg-blue-700">
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </div>
                </div>

                {/* Image Gallery Section */}
                <div className="mt-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3 uppercase tracking-wider">Existing Images ({images.length})</h4>

                    {isLoading && images.length === 0 ? ( 
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading images...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-gray-50">
                            <ImageIcon className="h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-gray-500 text-sm">No images attached to this order yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map(img => (
                                <div key={img.id} className="relative group border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                                    <div className="aspect-square w-full bg-gray-100 flex items-center justify-center">
                                        <img src={img.image_url} alt={img.description || `Order Image ${img.id}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-3 text-sm border-t">
                                        <p className="font-medium text-gray-900 truncate">{img.description || 'No Description'}</p>
                                        <p className="text-xs text-gray-500 mt-1">Uploaded: {new Date(img.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity rounded-full shadow-md" disabled={isLoading}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                                                <AlertDialogDescription>Are you sure you want to remove this image permanently?</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(img)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 mt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isLoading || isUploading}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// -------------------------------------------------------------
// Helper: Map Status to Intuitive Icon
// -------------------------------------------------------------
const getStatusIcon = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending') || s.includes('waiting')) return <Clock className="w-3.5 h-3.5 mr-1.5" />;
    if (s.includes('completed') || s.includes('delivered') || s.includes('success')) return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />;
    if (s.includes('cancelled') || s.includes('rejected') || s.includes('failed')) return <XCircle className="w-3.5 h-3.5 mr-1.5" />;
    return <Activity className="w-3.5 h-3.5 mr-1.5" />;
};

const getOrderStatusButtonColor = (status: string) => {
    switch (status) {
        case "pending":
            return "bg-yellow-500 hover:bg-yellow-600 text-white"

        case "confirmed":
            return "bg-blue-500 hover:bg-blue-600 text-white"

        case "in_progress":
            return "bg-orange-500 hover:bg-orange-600 text-white"

        case "completed":
            return "bg-green-500 hover:bg-green-600 text-white"

        case "cancelled":
            return "bg-red-500 hover:bg-red-600 text-white"

        default:
            return "bg-gray-500 hover:bg-gray-600 text-white"
    }
}

const PROJECT_CATEGORIES =[
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' },
];


// -------------------------------------------------------------
// Main SalesOrdersTab Component
// -------------------------------------------------------------

export const SalesOrdersTab: React.FC<SalesOrdersTabProps> = ({
    error,
    isOrdersLoading,
    orderSearchTerm,
    setOrderSearchTerm,
    orderRoleFilter, // CHANGED
    setOrderRoleFilter, // CHANGED
    orderStatusFilter,
    setOrderStatusFilter,
    orderFromDate,
    setOrderFromDate,
    orderToDate,
    setOrderToDate,
    staffs,
    isStaffLoading,
    filteredOrders,
    tasks =[],
    ORDER_STATUSES,
    customers,
    realCustomers,
    handleMakeNewOrder, 
    handleViewOrder,
    handleEditOrder,
    handleDeleteOrder,
    getOrderStatusColor
}) => {
    const [selectedOrderForImages, setSelectedOrderForImages] = useState<Order | null>(null);
    const [taskAssignmentFilter, setTaskAssignmentFilter] = useState("all");
    const[orderCategoryFilter, setOrderCategoryFilter] = useState("all");

    useEffect(() => {
        console.log("Orders Data:", filteredOrders);
        console.log("Tasks Data:", tasks);
        console.log("orderRoleFilter:", orderRoleFilter);
    }, [filteredOrders, tasks, orderRoleFilter]);

    const handleOpenImageModal = (order: Order) => setSelectedOrderForImages(order);

    const allKnownCustomers: (Customer | RealCustomer)[] =[...customers, ...realCustomers];

    // Added local filtering for Task Assignment and Category states
    const finalOrders = useMemo(() => {
        return filteredOrders.filter(order => {
            const projectTasks = tasks.filter(t => t.order_id === order.id)

            // Role Logic
            const matchesRole =
                orderRoleFilter === "all" ||
                projectTasks.some(
                    t => t.assigned_to?.role?.toLowerCase() === orderRoleFilter
                )

            // Category Logic
            const matchesCategory = 
                orderCategoryFilter === "all" || 
                order.category?.toLowerCase() === orderCategoryFilter.toLowerCase();

            // Task Assignment Logic
            const totalTasks = projectTasks.length;
            const unassignedTasksCount = projectTasks.filter(t => !t.assigned_to?.staff_name).length;
            const isFullyAssigned = totalTasks > 0 && unassignedTasksCount === 0;

            const matchesTaskAssignment = 
                taskAssignmentFilter === "all" ||
                (taskAssignmentFilter === "assigned" && isFullyAssigned) ||
                (taskAssignmentFilter === "unassigned" && !isFullyAssigned);

            return matchesRole && matchesCategory && matchesTaskAssignment;
        })
    },[filteredOrders, tasks, orderRoleFilter, orderCategoryFilter, taskAssignmentFilter])

    // Check if any filter is active
    const hasActiveFilters = orderSearchTerm || orderRoleFilter !== 'all' || orderStatusFilter !== 'all' || orderFromDate || orderToDate || taskAssignmentFilter !== 'all' || orderCategoryFilter !== 'all';

    const clearAllFilters = () => {
        setOrderSearchTerm('');
        setOrderRoleFilter('all'); 
        setOrderStatusFilter('all');
        setOrderFromDate('');
        setOrderToDate('');
        setTaskAssignmentFilter('all');
        setOrderCategoryFilter('all');
    };

    const FilterControls = ({ className = "" }: { className?: string }) => (
        <div className={className}>
            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                <Select value={orderCategoryFilter} onValueChange={setOrderCategoryFilter}>
                    <SelectTrigger className="w-full md:w-[160px] bg-white">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {PROJECT_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Staff Roles</label>
                <Select value={orderRoleFilter} onValueChange={setOrderRoleFilter}>
                    <SelectTrigger className="w-full md:w-[160px] bg-white">
                        <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="designer">Designer</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="logistics">Logistics</SelectItem>
                    </SelectContent>
                </Select>
            </div> */}

            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">Task Assignment</label>
                <Select value={taskAssignmentFilter} onValueChange={setTaskAssignmentFilter}>
                    <SelectTrigger className="w-full md:w-[160px] bg-white">
                        <SelectValue placeholder="All Tasks" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Tasks</SelectItem>
                        <SelectItem value="assigned">Fully Assigned</SelectItem>
                        <SelectItem value="unassigned">Pending Assignment</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">From Date</label>
                <Input
                    type="date"
                    value={orderFromDate}
                    onChange={(e) => setOrderFromDate(e.target.value)}
                    className="w-full md:w-[150px] bg-white"
                />
            </div>
            
            <div className="flex flex-col space-y-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase">To Date</label>
                <Input
                    type="date"
                    value={orderToDate}
                    onChange={(e) => setOrderToDate(e.target.value)}
                    className="w-full md:w-[150px] bg-white"
                />
            </div>
        </div>
    );

    return (
        <>
            <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                <CardHeader className="pb-4 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center text-2xl">
                                <ShoppingCart className="h-6 w-6 mr-3 text-blue-600" />
                                Sales Orders
                            </CardTitle>
                            <CardDescription className="mt-1 text-sm text-gray-500">
                                Track and manage customer orders, statuses, and payment timelines.
                            </CardDescription>
                        </div>
                        
                        <Button 
                            onClick={() => handleMakeNewOrder(null)} 
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            size="lg"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Create New Order
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="px-4 sm:px-6">
                    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{error}</p></div>}

                    {/* --- QUICK STATUS TABS (Massive UX Improvement for new users) --- */}
                    {/* STATUS TABS + SEARCH */}
<div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

    {/* STATUS TABS */}
    <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2">
        <Button 
            variant={orderStatusFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setOrderStatusFilter('all')}
            className={`rounded-full px-5 flex-shrink-0 ${orderStatusFilter === 'all' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-white'}`}
        >
            All Orders
        </Button>

        {ORDER_STATUSES.map(status => (
            <Button
                key={status}
                variant={orderStatusFilter === status ? 'default' : 'outline'}
                onClick={() => setOrderStatusFilter(status)}
                className={`rounded-full px-5 flex-shrink-0 capitalize ${
                    orderStatusFilter === status
                        ? getOrderStatusButtonColor(status)
                        : "bg-white text-gray-600 border"
                }`}
            >
                {getStatusIcon(status)}
                {status.replace('_', ' ')}
            </Button>
        ))}
    </div>

    {/* SEARCH BAR */}
    <div className="w-full lg:w-[320px]">
        <label className="text-xs font-semibold text-gray-500 uppercase mb-1.5 block">
            Search Order or Customer
        </label>
        <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
                placeholder="Type name, ID, or reference..."
                className="pl-10 bg-white"
                value={orderSearchTerm}
                onChange={(e) => setOrderSearchTerm(e.target.value)}
            />
        </div>
    </div>

</div>

                    {/* --- ADVANCED SEARCH & FILTERS BOX --- */}
                    <div className="bg-gray-50/70 border rounded-xl p-4 mb-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-end">
                            

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
                                            <AlertDialogDescription>Refine your order list.</AlertDialogDescription>
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

                    {/* --- ORDERS LIST --- */}
                    {isOrdersLoading ? (
                        <div className="text-center py-16">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-4 text-sm font-medium text-gray-500">Loading orders...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {finalOrders.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
                                    <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900">No orders found</h3>
                                    <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">
                                        {hasActiveFilters 
                                            ? "Try adjusting your filters or search terms to find what you're looking for." 
                                            : "You haven't created any orders yet. Click 'Create New Order' to get started."}
                                    </p>
                                    {hasActiveFilters && (
                                        <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                                            Clear Filters
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                finalOrders.map((order) => {
                                    const customer = allKnownCustomers.find(c => c.id === order.customer_id);
                                    const totalAmountDisplay = (order.total_amount || order.amount)?.toLocaleString('en-IN') || 'N/A';
                                    const completionDateDisplay = order.completion_date ? new Date(order.completion_date).toLocaleDateString() : 'Not Set';
                                    const isPending = order.status?.toLowerCase() === 'pending';
                                    
                                    // --- Calculate Task Status Details ---
                                    const projectTasks = tasks.filter(t => t.order_id === order.id);
                                    const totalTasks = projectTasks.length;
                                    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
                                    const unassignedTasksCount = projectTasks.filter(t => !t.assigned_to?.staff_name).length;
                                    
                                    let taskStatusDisplay;
                                    if (totalTasks === 0) {
                                        taskStatusDisplay = <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 border font-semibold">0 Tasks</Badge>;
                                    } else if (unassignedTasksCount > 0) {
                                        taskStatusDisplay = <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 border font-semibold">{unassignedTasksCount} Pending Assign</Badge>;
                                    } else {
                                        taskStatusDisplay = (
                                            <div className="flex items-center space-x-1">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 border font-medium">
                                                    {totalTasks} Assigned
                                                </Badge>
                                                {completedTasks === totalTasks && totalTasks > 0 ? (
                                                    <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 border font-bold"><CheckCircle2 className="w-3 h-3 mr-1 inline"/> Done</Badge>
                                                ) : null}
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={order.id} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
                                            
                                            {/* CARD HEADER: ID & Status */}
                                            <div className="bg-gray-50/80 px-4 py-3 border-b flex justify-between items-center flex-wrap gap-2">
                                                <div className="flex items-center space-x-3">
                                                    <span className="font-bold text-gray-800 flex items-center">
                                                        Order #{order.id}
                                                    </span>
                                                    {('reference_id' in order && order.reference_id) && (
                                                        <Badge variant="outline" className="bg-white text-gray-600 font-mono text-xs">
                                                            Ref: {order.reference_id}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Badge className={`px-2.5 py-1 uppercase tracking-wide text-[10px] font-bold ${getOrderStatusColor(order.status || 'pending')}`}>
                                                    <span className="flex items-center">
                                                        {getStatusIcon(order.status || 'pending')}
                                                        {order.status || 'pending'}
                                                    </span>
                                                </Badge>
                                            </div>

                                            {/* CARD BODY: Details Grid */}
                                            <div className="p-4 grid grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
                                                
                                                {/* Customer */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Customer</p>
                                                    <p className="font-semibold text-gray-900 text-base">{customer?.customer_name || 'Unknown Customer'}</p>
                                                    {customer?.contact_number && <p className="text-xs text-gray-500 mt-0.5">{customer.contact_number}</p>}
                                                </div>

                                                {/* Product */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Product</p>
                                                    <div className="flex items-start">
                                                        <Package className="h-4 w-4 text-gray-400 mr-1.5 mt-0.5" />
                                                        <span className="font-medium text-gray-800 break-words">{order.product_name || 'N/A'}</span>
                                                    </div>
                                                </div>

                                                {/* Financials */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Amount</p>
                                                    <div className="flex items-center text-green-700 font-bold text-lg">
                                                        <IndianRupee className="h-4 w-4 mr-0.5" /> 
                                                        {totalAmountDisplay}
                                                    </div>
                                                </div>

                                                {/* Timeline */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1">Target Date</p>
                                                    <div className="flex items-center text-sm font-medium text-gray-700">
                                                        <Calendar className="h-4 w-4 mr-1.5 text-blue-500" />
                                                        {completionDateDisplay}
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Created {new Date(order.created_on).toLocaleDateString()}
                                                    </p>
                                                </div>

                                                {/* Task Status */}
                                                <div>
                                                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 flex items-center">
                                                        <CheckSquare className="h-3 w-3 mr-1" /> Task Status
                                                    </p>
                                                    <div className="flex items-start mt-0.5">
                                                        {taskStatusDisplay}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* CARD FOOTER: Actions */}
                                            <div className="px-4 py-3 bg-gray-50/50 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
                                                <div className="text-xs text-gray-500 w-full sm:w-auto">
                                                    Sales Rep: <span className="font-medium text-gray-700">{order.created_by_staff_name || 'System'}</span>
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                                                    
                                                    {/* Media Manager */}
                                                    <Button variant="outline" size="sm" className="bg-white" onClick={() => handleOpenImageModal(order)}>
                                                        <ImageIcon className="h-3.5 w-3.5 mr-1.5 text-blue-600" /> Images
                                                    </Button>
                                                    
                                                    {/* Conditional Edit/Delete Actions */}
                                                    {isPending ? (
                                                        <>
                                                            <Button variant="outline" size="sm" className="bg-white" onClick={() => handleEditOrder(order)}>
                                                                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                                            </Button>
                                                            
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" className="bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100">
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Order #{order.id}?</AlertDialogTitle>
                                                                        <AlertDialogDescription>Are you sure you want to permanently delete this order? This action cannot be undone.</AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDeleteOrder(order.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </>
                                                    ) : (
                                                        <div title="Only pending orders can be edited by sales staff" className="cursor-not-allowed opacity-50 flex gap-2">
                                                            <Button variant="outline" size="sm" className="bg-gray-100 pointer-events-none">
                                                                <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit
                                                            </Button>
                                                        </div>
                                                    )}

                                                    {/* Primary Action */}
                                                    <Button variant="default" size="sm" className="bg-gray-900 hover:bg-gray-800 text-white" onClick={() => handleViewOrder(order)}>
                                                        <Eye className="h-3.5 w-3.5 mr-1.5" /> View Details
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Image Management Dialog */}
            {selectedOrderForImages && (
                <OrderImageManagerDialog 
                    order={selectedOrderForImages} 
                    onClose={() => setSelectedOrderForImages(null)} 
                />
            )}
        </>
    )
}
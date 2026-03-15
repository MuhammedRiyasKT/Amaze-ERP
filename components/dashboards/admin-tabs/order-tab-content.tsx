// FILE: src/components/admin/admin-tabs/project-management-page.tsx
"use client"

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2 } from "lucide-react";

import {
    type Order,
    type DetailedTask,
    type OrderById,
    getActiveStaffs,
    type OrderImage,
    getOrderImages
} from "@/lib/admin";

import {
    FolderOpen, Package, Edit, Trash2, Plus, Search, Filter, Eye, Calendar, User, UserPlus, IndianRupee, Phone, MessageSquare, CheckSquare, ChevronDown, ChevronRight, Image as ImageIcon, Repeat2, CheckCircle2
} from "lucide-react";

// --- Type Definitions ---
type Staff = {
    id: number;
    name: string;
    role?: string;
};

type OrderWithGeneratedId = Order & {
    generated_order_id?: string | null;
    product_name?: string | null;
    total_amount?: number | null;
    amount?: number | null;
    completion_date?: string | null;
    created_by_staff_name?: string | null;
    created_on?: string;
    customer_name?: string | null;
    category?: string | null;
};

// --- Constants for Filters ---
const ORDER_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled', 'confirmed'];
const PROJECT_CATEGORIES = [
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' },
];

// --- Utility Functions ---
const getProjectStatusColor = (status?: string | null) => {
    const s = status?.toLowerCase();
    switch (s) {
        case 'completed': return 'bg-green-100 text-green-800 border-green-200'
        case 'in_progress': case 'inprogress': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}
const getTaskStatusColor = (status?: string | null) => {
    const s = status?.toLowerCase();
    switch (s) {
        case 'completed': return 'bg-green-100 text-green-800'
        case 'inprogress': case 'assigned': return 'bg-blue-100 text-blue-800'
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}
const canAssignTasksToOrder = (order: Order) => order.status === 'in_progress' || order.status === 'inprogress';

const getPaymentStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    let color = 'bg-gray-100 text-gray-800';
    let label = status;

    if (lowerStatus === 'paid' || lowerStatus === 'completed') {
        color = 'bg-green-100 text-green-800';
    } else if (lowerStatus === 'pending' || lowerStatus === 'unpaid') {
        color = 'bg-red-100 text-red-800';
    } else if (lowerStatus === 'partial') {
        color = 'bg-yellow-100 text-yellow-800';
    }

    return <Badge className={`capitalize ${color}`}>{label.replace(/_/g, ' ')}</Badge>;
};

// =============================================================
// IMAGE MANAGER DIALOG 
// =============================================================

interface ProjectImageManagerProps {
    order: OrderWithGeneratedId;
    onClose: () => void;
}

const ProjectImageManagerDialog: React.FC<ProjectImageManagerProps> = ({ order, onClose }) => {
    const [images, setImages] = useState<OrderImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const orderId = order.id;

    const fetchImages = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const fetchedImages = await getOrderImages(orderId);
            setImages(fetchedImages);
        } catch (err) {
            setError(`Failed to load images: ${err instanceof Error ? err.message : 'Unknown error'}`);
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    const handleDownload = (imageUrl: string, description: string | null, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const filename = `${order.generated_order_id || `Order-${order.id}`}-${(description || `Image-${index + 1}`).replace(/\s/g, '_')}.jpg`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <ImageIcon className="w-5 h-5 mr-2" />
                        Images for Project PRJ-{order.id} {order.generated_order_id ? `(${order.generated_order_id})` : ''}
                    </DialogTitle>
                    <DialogDescription>
                        View and download images associated with this project.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
                )}

                <div className="mt-2">
                    <h4 className="font-semibold mb-3">Project Images ({images.length})</h4>

                    {isLoading ? (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                            <p className="mt-2 text-sm text-gray-500">Loading images...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center py-8 border rounded-lg bg-gray-50">
                            <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No images found for this project.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((img, index) => (
                                <Card key={img.id} className="relative group overflow-hidden shadow-sm">
                                    <div className="aspect-square w-full bg-gray-200 relative">
                                        <img
                                            src={img.image_url}
                                            alt={img.description || `Project Image ${img.id}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
                                            <a href={img.image_url} target="_blank" rel="noopener noreferrer">
                                                <Button variant="secondary" size="icon" title="View Image">
                                                    <Eye className="h-5 w-5" />
                                                </Button>
                                            </a>
                                            <Button
                                                variant="secondary"
                                                size="icon"
                                                title="Download Image"
                                                onClick={() => handleDownload(img.image_url, img.description, index)}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-3 text-sm">
                                        <p className="font-medium truncate">{img.description || `Image ${img.id}`}</p>
                                        <p className="text-xs text-gray-500 mt-1">Uploaded: {new Date(img.created_at).toLocaleDateString()}</p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// =============================================================
// PROJECT DETAILS DIALOG 
// =============================================================

interface ProjectDetailsDialogProps {
    viewingOrder: OrderById | null;
    viewingOrderTasks: DetailedTask[];
    isOrderDetailsLoading: boolean;
    onClose: () => void;
    onEditTask: (task: DetailedTask) => void;
}

export const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
    viewingOrder,
    viewingOrderTasks,
    isOrderDetailsLoading,
    onClose,
    onEditTask
}) => {
    return (
        <Dialog open={!!viewingOrder} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[425px] md:max-w-xl flex flex-col max-h-[90vh]">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Project Details #{viewingOrder?.id}</DialogTitle>
                    <DialogDescription>
                        Comprehensive information about this customer project.
                    </DialogDescription>
                </DialogHeader>

                {isOrderDetailsLoading ? (
                    <div className="py-10 flex flex-col items-center flex-grow">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <p className="mt-2 text-sm text-gray-500">Loading project details...</p>
                    </div>
                ) : viewingOrder && (
                    <div className="overflow-y-auto flex-grow pr-2">
                        <div className="grid gap-4 py-4 text-sm">

                            {/* CUSTOMER INFO SECTION */}
                            <div className="p-3 bg-gray-50 rounded-lg border">
                                <h4 className="font-bold text-gray-700 mb-2">Customer Information</h4>

                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Customer Name</span>
                                    <span className="col-span-2 font-semibold text-blue-700">{viewingOrder.customer_name || 'N/A'}</span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Mobile Number</span>
                                    {viewingOrder.mobile_number ? (
                                        <a
                                            href={`tel:${viewingOrder.mobile_number}`}
                                            className="col-span-2 flex items-center text-blue-600 hover:text-blue-800 transition duration-150"
                                        >
                                            <Phone className="h-3 w-3 mr-2 text-gray-400" />
                                            {viewingOrder.mobile_number}
                                        </a>
                                    ) : (
                                        <span className="col-span-2 text-gray-500">N/A</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">WhatsApp</span>
                                    {viewingOrder.whatsapp_number ? (
                                        <a
                                            href={`https://wa.me/${viewingOrder.whatsapp_number}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="col-span-2 flex items-center text-green-600 hover:text-green-800 transition duration-150"
                                        >
                                            <MessageSquare className="h-3 w-3 mr-2 text-gray-400" />
                                            {viewingOrder.whatsapp_number}
                                        </a>
                                    ) : (
                                        <span className="col-span-2 text-gray-500">N/A</span>
                                    )}
                                </div>
                            </div>

                            {/* PROJECT CORE DETAILS */}
                            <h4 className="font-bold text-gray-700 mt-2 border-t pt-3">Product & Project Details</h4>

                            {viewingOrder.generated_order_id && (
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Generated ID</span>
                                    <span className="col-span-2 font-bold text-red-600">{viewingOrder.generated_order_id}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Product Name</span>
                                <span className="col-span-2">{viewingOrder.product_name || 'N/A'}</span>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500 flex items-center"><Package className="h-4 w-4 mr-1" /> Type</span>
                                <span className="col-span-2 font-medium text-purple-700 capitalize">{viewingOrder.order_type?.replace(/_/g, ' ') || 'N/A'}</span>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Category</span>
                                <span className="col-span-2">{viewingOrder.category || 'N/A'}</span>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Status</span>
                                <Badge className={getProjectStatusColor(viewingOrder.status || 'pending')}>{viewingOrder.status?.replace(/_/g, ' ') || 'Pending'}</Badge>
                            </div>

                            {/* FINANCIAL DETAILS */}
                            <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><IndianRupee className="h-4 w-4 mr-2" /> Financials</h4>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Total Billed Amount</span>
                                <span className="col-span-2 flex items-center text-blue-700 font-bold">
                                    ₹ {(viewingOrder.total_amount || viewingOrder.amount)?.toLocaleString('en-IN') || '0.00'}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Amount Paid</span>
                                <span className="col-span-2 flex items-center text-orange-700 font-medium">
                                    ₹ {viewingOrder.amount_payed ? viewingOrder.amount_payed.toLocaleString('en-IN') : '0.00'}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 items-center gap-4">
                                <span className="font-medium text-gray-500">Payment Status</span>
                                <span className="col-span-2">{getPaymentStatusBadge(viewingOrder.payment_status || 'pending')}</span>
                            </div>

                            {/* Tasks for this Order */}
                            <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><CheckSquare className="h-4 w-4 mr-2" /> Assigned Tasks ({viewingOrderTasks.length})</h4>

                            {viewingOrderTasks.length === 0 ? (
                                <p className="text-gray-500 italic">No tasks currently assigned to this project.</p>
                            ) : (
                                <div className="space-y-3">
                                    {viewingOrderTasks.map((task) => (
                                        <div key={task.id} className="p-3 border rounded-lg bg-white shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <p className="font-semibold">{task.task_description || `Task #${task.id}`}</p>
                                                <Badge variant="secondary" className={`capitalize flex-shrink-0 ${getTaskStatusColor(task.status)}`}>
                                                    {task.status?.replace(/_/g, ' ')}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1 space-y-1">
                                                <p className="flex items-center">
                                                    <User className="h-3 w-3 mr-1" /> Assigned to:
                                                    {task.assigned_to?.staff_name ? (
                                                        <span className="ml-1 font-medium text-gray-800">{task.assigned_to.staff_name}</span>
                                                    ) : (
                                                        <Badge variant="outline" className="ml-1 bg-red-50 text-red-600 border-red-200 h-5 px-1.5 text-[10px] uppercase">Unassigned</Badge>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="mt-2 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 px-2 text-xs"
                                                    onClick={() => onEditTask(task)}
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />Edit Task
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* DESCRIPTION */}
                            <div className="pt-4 border-t mt-4">
                                <p className="font-medium text-gray-500 mb-2">Description / Notes</p>
                                <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{viewingOrder.description || 'No description provided.'}</p>
                            </div>

                            {/* FOOTER */}
                            <div className="mt-4 pt-4 text-xs text-gray-500 text-right flex-shrink-0">
                                <p>Created by: {viewingOrder.created_by_staff_name || 'Staff'} on {new Date(viewingOrder.created_on).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex-shrink-0">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


// =============================================================
// MAIN PROJECT MANAGEMENT PAGE COMPONENT
// =============================================================

interface ProjectManagementProps {
    orders: OrderWithGeneratedId[];
    tasks: DetailedTask[];
    isLoading: boolean;
    searchTerm: string;
    setSearchTerm: (term: string) => void;

    // Actions
    handleOpenAssignModal: (order: OrderWithGeneratedId) => void;
    handleOpenStatusUpdateModal: (order: OrderWithGeneratedId) => void;
    handleDeleteProject: (id: number) => void;
    handleOpenEditTaskModal: (task: DetailedTask) => void;

    // View Details State and Handlers
    handleViewProject: (order: Order) => void;
    viewingOrder: OrderById | null;
    viewingOrderTasks: DetailedTask[];
    isOrderDetailsLoading: boolean;
    onCloseViewProject: () => void;
}


export const ProjectManagementPage: React.FC<ProjectManagementProps> = ({
    orders,
    tasks,
    isLoading,
    searchTerm,
    setSearchTerm,
    handleOpenAssignModal,
    handleViewProject,
    handleOpenStatusUpdateModal,
    handleDeleteProject,
    handleOpenEditTaskModal,

    viewingOrder,
    viewingOrderTasks,
    isOrderDetailsLoading,
    onCloseViewProject
}) => {

    // --- State for self-fetched data ---
    const [staff, setStaff] = useState<Staff[]>([]);

    // --- State for Images Modal ---
    const [selectedProjectForImages, setSelectedProjectForImages] = useState<OrderWithGeneratedId | null>(null);

    // --- Filter States ---
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [taskAssignmentFilter, setTaskAssignmentFilter] = useState("all");
    const [staffFilter, setStaffFilter] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openDepartment, setOpenDepartment] = useState<string | null>(null);

    // --- Data Fetching Effect for Staff ---
    useEffect(() => {
        const fetchStaff = async () => {
            const response = await getActiveStaffs();
            if (response.data && response.data.staffs) {
                setStaff(response.data.staffs);
            } else {
                console.error("Failed to fetch staff list:", response.error);
            }
        };

        fetchStaff();
    }, []);

    const clearOrderFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setTaskAssignmentFilter("all");
        setStaffFilter("all");
        setCategoryFilter("all");
        setFromDate("");
        setToDate("");
    };

    const activeFilterCount = [statusFilter, staffFilter, categoryFilter, taskAssignmentFilter, fromDate, toDate].filter(f => f !== 'all' && f !== '').length;
    const hasActiveOrderFilters = activeFilterCount > 0 || searchTerm !== "";

    const filteredOrders = useMemo(() => orders.filter(order => {
        // Search Term Check
        const matchesSearch =
            (order.description && order.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.product_name && order.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (order.id && order.id.toString().includes(searchTerm)) ||
            (order.generated_order_id && order.generated_order_id.toLowerCase().includes(searchTerm.toLowerCase()));

        // Status Filter Check
        const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter.toLowerCase();

        // Staff Filter Check
        const matchesStaff = staffFilter === 'all' || order.created_by_staff_name === staffFilter;

        // Category Filter Check
        const matchesCategory = categoryFilter === 'all' || order.category?.toLowerCase() === categoryFilter.toLowerCase();

        // Task Assignment Check
        const projectTasks = tasks.filter(t => t.order_id === order.id);
        const totalTasks = projectTasks.length;

        let matchesTaskAssignment = true;

        if (taskAssignmentFilter === "assigned") {
            matchesTaskAssignment = totalTasks > 0;
        }

        if (taskAssignmentFilter === "zero_tasks") {
            matchesTaskAssignment = totalTasks === 0;
        }

        // Date Filter Check
        let matchesDate = true;
        const projectCompletionDate = order.completion_date ? new Date(order.completion_date).getTime() : null;
        const hasDateFilters = fromDate || toDate;

        if (hasDateFilters) {
            if (projectCompletionDate === null) {
                matchesDate = false;
            } else {
                if (fromDate) {
                    const fromDateTime = new Date(fromDate);
                    fromDateTime.setHours(0, 0, 0, 0);
                    matchesDate = matchesDate && projectCompletionDate >= fromDateTime.getTime();
                }
                if (toDate) {
                    const toDateTime = new Date(toDate);
                    toDateTime.setHours(23, 59, 59, 999);
                    matchesDate = matchesDate && projectCompletionDate <= toDateTime.getTime();
                }
            }
        }

        return matchesSearch && matchesStatus && matchesStaff && matchesCategory && matchesDate && matchesTaskAssignment;

    }), [orders, tasks, searchTerm, statusFilter, staffFilter, categoryFilter, taskAssignmentFilter, fromDate, toDate]);


    // --- Descriptively styled and responsive filter panel ---
    const renderFilters = () => (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-6">

            {/* Header Section explaining the use */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <Filter className="h-5 w-5 mr-2 text-blue-600" />
                        Find & Organize Projects
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                        Use these filters to easily find specific projects. Search by name, check which stage they are in, or quickly find projects that still need team members assigned to them.
                    </p>
                </div>

                {hasActiveOrderFilters && (
                    <Button variant="ghost" size="sm" onClick={clearOrderFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Filters
                    </Button>
                )}
            </div>

            {/* Primary Row: Most used tools */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Main Search Bar (Takes up half the space on large screens) */}
                <div className="lg:col-span-6 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">What are you looking for?</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="e.g., John Doe, PRJ-102, Wall Art..."
                            className="pl-10 h-11 text-base bg-gray-50/50 focus:bg-white transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Current Stage</label>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full h-11 bg-white">
                            <SelectValue placeholder="All Stages" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">Any Stage</SelectItem>

                            {ORDER_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium ${getProjectStatusColor(status)}`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>

                    </Select>
                </div>

                {/* Assignment Filter */}
                <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Task Assignment</label>

                    <Select value={taskAssignmentFilter} onValueChange={setTaskAssignmentFilter}>
                        <SelectTrigger className="w-full h-11 bg-white">
                            <SelectValue placeholder="Assignment Tracking" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">All Tasks</SelectItem>
                            <SelectItem value="assigned">Task Assigned</SelectItem>
                            <SelectItem value="zero_tasks">0 Task Assigned</SelectItem>
                        </SelectContent>

                    </Select>
                </div>
            </div>

            {/* Collapsible Advanced Filters */}
            <div className="mt-4 pt-2">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">

                    {/* Product Category */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Product Category
                        </label>

                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className="w-full bg-white">
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


                    {/* Staff Filter */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Staff
                        </label>

                        <Select value={staffFilter} onValueChange={setStaffFilter}>
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="All Staff" />
                            </SelectTrigger>

                            <SelectContent>

                                <SelectItem value="all">All Staff</SelectItem>

                                {/* CRM */}
                                <div
                                    className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenDepartment(openDepartment === "crm" ? null : "crm");
                                    }}
                                >
                                    <span>CRM</span>

                                    {openDepartment === "crm" ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </div>

                                {openDepartment === "crm" &&
                                    staff
                                        .filter(s => s.role?.toLowerCase() === "crm")
                                        .map(s => (
                                            <SelectItem key={s.id} value={s.name}>
                                                {s.name}
                                            </SelectItem>
                                        ))}

                                {/* Sales */}
                                <div
                                    className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setOpenDepartment(openDepartment === "sales" ? null : "sales");
                                    }}
                                >
                                    <span>Sales</span>

                                    {openDepartment === "sales" ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </div>

                                {openDepartment === "sales" &&
                                    staff
                                        .filter(s => s.role?.toLowerCase() === "sales")
                                        .map(s => (
                                            <SelectItem key={s.id} value={s.name}>
                                                {s.name}
                                            </SelectItem>
                                        ))}

                            </SelectContent>
                        </Select>
                    </div>


                    {/* Target Date From */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Target Date (From)
                        </label>

                        <Input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="w-full bg-white"
                        />
                    </div>


                    {/* Target Date To */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Target Date (To)
                        </label>

                        <Input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="w-full bg-white"
                        />
                    </div>

                </div>

            </div>
        </div>
    );

    const handleOpenImageModal = (project: OrderWithGeneratedId) => {
        setSelectedProjectForImages(project);
    };

    return (
        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="px-2 sm:px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center text-2xl">
                            <FolderOpen className="h-6 w-6 mr-3 text-blue-600" />
                            Project Management
                        </CardTitle>
                        <CardDescription className="mt-1">Track and manage all customer projects, assignments, and statuses.</CardDescription>
                    </div>
                    <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        New Project
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6">

                {/* --- DESKTOP FILTERS --- */}
                <div className="hidden md:block">
                    {renderFilters()}
                </div>

                {/* --- MOBILE FILTERS (Collapsible) --- */}
                <Collapsible
                    open={isFilterOpen}
                    onOpenChange={setIsFilterOpen}
                    className="md:hidden mb-4 border rounded-xl bg-gray-50 overflow-hidden shadow-sm"
                >
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between font-semibold text-sm text-gray-700 p-4 h-auto hover:bg-gray-100 rounded-none">
                            <span className="flex items-center">
                                <Filter className="h-4 w-4 mr-2 text-blue-600" />
                                Filters & Search
                                {activeFilterCount > 0 && <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-200">{activeFilterCount}</Badge>}
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-0 border-t">
                        <div className="p-4 bg-white">
                            {renderFilters()}
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                        <p className="mt-4 text-sm text-gray-500 font-medium">Loading your projects...</p>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-16 border-2 border-dashed rounded-xl bg-gray-50">
                        <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700">No Projects Found</h3>
                        <p className="text-gray-500 mt-1 max-w-md mx-auto">
                            {searchTerm || activeFilterCount > 0
                                ? 'We could not find any projects matching your current filters. Try adjusting your search criteria.'
                                : 'There are no active projects to display right now.'
                            }
                        </p>
                        {(searchTerm || activeFilterCount > 0) && (
                            <Button variant="outline" className="mt-6" onClick={clearOrderFilters}>
                                Clear All Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {filteredOrders.map((project) => {
                            const canAssign = canAssignTasksToOrder(project)

                            const totalAmountDisplay = (project.total_amount || project.amount)?.toLocaleString('en-IN') || '0.00';
                            const completionDateDisplay = project.completion_date
                                ? new Date(project.completion_date).toLocaleDateString()
                                : 'Not Set';

                            const generatedIdDisplay = project.generated_order_id
                                ? <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold border-purple-200 border text-xs">{project.generated_order_id}</Badge>
                                : null;

                            // --- Calculate Task Assignments ---
                            const projectTasks = tasks.filter(t => t.order_id === project.id);
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
                                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 border font-bold"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Done</Badge>
                                        ) : null}
                                    </div>
                                );
                            }

                            return (
                                <div key={project.id} className="border border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-lg bg-white flex flex-col">

                                    {/* CARD HEADER */}
                                    <div className="bg-gray-50 border-b border-gray-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm">
                                                <FolderOpen className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                    {project.customer_name || `Project PRJ-${project.id}`}
                                                </h3>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-gray-500 text-sm font-medium">ID: #{project.id}</span>
                                                    {generatedIdDisplay}
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className={`capitalize px-3 py-1 text-sm font-semibold border-2 ${getProjectStatusColor(project.status || 'pending')}`}>
                                            {project.status?.replace(/_/g, ' ') || 'Pending'}
                                        </Badge>
                                    </div>

                                    {/* CARD BODY (Metrics Grid) */}
                                    <div className="px-4 sm:px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 bg-white">
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mb-1"><Package className="h-3 w-3 mr-1" /> Product</span>
                                            <span className="font-medium text-gray-800 break-words line-clamp-2">{project.product_name || 'N/A'}</span>
                                        </div>

                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mb-1"><IndianRupee className="h-3 w-3 mr-1" /> Total Budget</span>
                                            <span className="font-bold text-blue-700 text-base">₹ {totalAmountDisplay}</span>
                                        </div>

                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mb-1"><Calendar className="h-3 w-3 mr-1" /> Target Date</span>
                                            <span className="font-medium text-gray-800">{completionDateDisplay}</span>
                                        </div>

                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center mb-1"><CheckSquare className="h-3 w-3 mr-1" /> Task Status</span>
                                            <div>{taskStatusDisplay}</div>
                                        </div>
                                    </div>

                                    {/* CARD FOOTER (Actions) */}
                                    <div className="bg-gray-50/50 border-t border-gray-100 px-4 sm:px-6 py-3 mt-auto flex flex-col xl:flex-row items-center justify-between gap-4">

                                        {/* Created By Info */}
                                        <div className="text-xs text-gray-500 w-full xl:w-auto text-center xl:text-left">
                                            Created by <span className="font-medium text-gray-700">{project.created_by_staff_name || 'Staff'}</span>
                                            {project.created_on && ` on ${new Date(project.created_on).toLocaleDateString()}`}
                                        </div>

                                        {/* Action Buttons ALIGNED BOTTOM RIGHT */}
                                        <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2 w-full xl:w-auto">
                                            <Button variant="outline" size="sm" className="bg-white" onClick={() => handleViewProject(project)}>
                                                <Eye className="h-4 w-4 mr-1.5 text-gray-500" />View Details
                                            </Button>

                                            <Button variant="outline" size="sm" className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200" onClick={() => handleOpenImageModal(project)}>
                                                <ImageIcon className="h-4 w-4 mr-1.5" />Images
                                            </Button>

                                            <Button variant="outline" size="sm" className="bg-white" onClick={() => handleOpenStatusUpdateModal(project)}>
                                                <Repeat2 className="h-4 w-4 mr-1.5 text-blue-500" />Status
                                            </Button>

                                            {canAssign && (
                                                <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={() => handleOpenAssignModal(project)} disabled={isLoading}>
                                                    <UserPlus className="h-4 w-4 mr-1.5" /> Assign Task
                                                </Button>
                                            )}

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Project</AlertDialogTitle>
                                                        <AlertDialogDescription>Are you sure you want to delete Project PRJ-#{project.id}? This action cannot be undone.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteProject(project.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>

                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>

            {/* RENDER THE PROJECT DETAILS DIALOG */}
            <ProjectDetailsDialog
                viewingOrder={viewingOrder}
                viewingOrderTasks={viewingOrderTasks}
                isOrderDetailsLoading={isOrderDetailsLoading}
                onClose={onCloseViewProject}
                onEditTask={handleOpenEditTaskModal}
            />

            {/* RENDER THE IMAGE MANAGER DIALOG */}
            {selectedProjectForImages && (
                <ProjectImageManagerDialog
                    order={selectedProjectForImages}
                    onClose={() => setSelectedProjectForImages(null)}
                />
            )}
        </Card>
    );
};
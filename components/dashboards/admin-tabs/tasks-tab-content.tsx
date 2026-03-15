// src/components/admin/task-management-page.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { 
    type DetailedTask, 
    type OrderById, 
    getOrder, 
    getActiveStaffs, 
} from "@/lib/admin" 

// Components needed for the modal
import { useToast } from "@/components/ui/use-toast"
import { EditTaskForm } from "@/components/edit-task-form" 

import { 
    CheckSquare, Plus, Search, Filter, Edit, ChevronDown, ChevronRight, User, UserPlus, Calendar, FolderOpen, Eye, 
    Loader2, IndianRupee, Package, Phone, MessageSquare, CreditCard, Truck, Hourglass, Trash2 
} from "lucide-react"

// =============================================================
// STAFF TYPE DEFINITION
// =============================================================
export interface Staff {
    id: number;
    name: string; 
    role: string;
}

// =============================================================
// HELPER FUNCTIONS & CONSTANTS
// =============================================================

const TASK_STATUSES = ['assigned', 'inprogress', 'completed'];

const PROJECT_CATEGORIES =[
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' },
];

const isDateToday = (dateString?: string | null): boolean => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    const today = new Date();
    
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return date.getTime() === today.getTime();
};

const getTaskStatusColor = (status?: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'inprogress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

const getProjectStatusColor = (status?: string | null) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800 border-green-200'
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

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

interface TaskManagementProps {
    tasks: DetailedTask[];
    isLoading: boolean;
    setActiveTab: (tab: string) => void;
    setSearchTerm: (term: string) => void; 
    onTaskDataChange: () => void; 
    projectLookup?: Record<number, any>; 
}

export const TaskManagementPage: React.FC<TaskManagementProps> = ({
    tasks,
    isLoading,
    setActiveTab,
    setSearchTerm,
    onTaskDataChange,
    projectLookup = {},
}) => {
    const { toast } = useToast();
    
    // --- Staff State ---
    const [staff, setStaff] = useState<Staff[]>([]);
    const[isStaffLoading, setIsStaffLoading] = useState(true);

    // --- Task Filter States ---
    const[taskSearchTerm, setTaskSearchTerm] = useState("");
    const[taskStaffFilterName, setTaskStaffFilterName] = useState("all");
    const [taskStatusFilter, setTaskStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const[taskFromDate, setTaskFromDate] = useState("");
    const [taskToDate, setTaskToDate] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const[openDepartment, setOpenDepartment] = useState<string | null>(null);

    // --- Task Edit Modal States ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const[selectedTaskForEdit, setSelectedTaskForEdit] = useState<DetailedTask | null>(null);

    // --- View Detail States for Order Modal ---
    const [viewingOrder, setViewingOrder] = useState<OrderById | null>(null);
    const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false);

    // --- Fetch Active Staff on Component Mount ---
    useEffect(() => {
        const fetchStaff = async () => {
            setIsStaffLoading(true);
            try {
                const response = await getActiveStaffs();
                if (response.data && response.data.staffs) {
                    setStaff(response.data.staffs as Staff[]);
                } else {
                    console.error("Failed to load active staff:", response.error);
                }
            } catch (error) {
                console.error("API Error fetching staff:", error);
            } finally {
                setIsStaffLoading(false);
            }
        };

        fetchStaff();
    },[]);

    // --- Task Edit Handlers ---
    const handleOpenEditModal = (task: DetailedTask) => {
        setSelectedTaskForEdit(task);
        setIsEditModalOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setSelectedTaskForEdit(null);
        onTaskDataChange(); 
        toast({
            title: "Task Updated",
            description: "Task changes saved successfully.",
        });
    };
    
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const search = taskSearchTerm.toLowerCase().trim();
            const associatedProject = projectLookup[task.order_id];
            
            // Search across task details AND associated project details
            const matchesSearch = !search || Boolean(
                task.task_description?.toLowerCase().includes(search) ||
                task.assigned_to?.staff_name?.toLowerCase().includes(search) ||
                task.order_id?.toString().includes(search) ||
                associatedProject?.customer_name?.toLowerCase().includes(search) ||
                associatedProject?.product_name?.toLowerCase().includes(search) ||
                associatedProject?.generated_order_id?.toLowerCase().includes(search)
            );

            const matchesStatus = taskStatusFilter === 'all' || task.status?.toLowerCase() === taskStatusFilter.toLowerCase();
            
            const matchesStaff = taskStaffFilterName === 'all' || task.assigned_to?.staff_name === taskStaffFilterName; 

            // Filter by product category (data exists on the associated project)
            const matchesCategory = categoryFilter === 'all' || associatedProject?.category?.toLowerCase() === categoryFilter.toLowerCase();

            let matchesDate = true;
            const taskCompletionTime = task.completion_time ? new Date(task.completion_time).getTime() : null;
            const hasDateFilters = taskFromDate || taskToDate;

            if (hasDateFilters) {
                if (taskCompletionTime === null) {
                    matchesDate = false;
                } else {
                    if (taskFromDate) {
                        const fromDate = new Date(taskFromDate);
                        fromDate.setHours(0, 0, 0, 0);
                        matchesDate = matchesDate && taskCompletionTime >= fromDate.getTime();
                    }
                    if (taskToDate) {
                        const toDate = new Date(taskToDate);
                        toDate.setHours(23, 59, 59, 999); 
                        matchesDate = matchesDate && taskCompletionTime <= toDate.getTime();
                    }
                }
            }
            return matchesSearch && matchesStatus && matchesStaff && matchesCategory && matchesDate;
        });
    },[tasks, taskSearchTerm, taskStatusFilter, taskStaffFilterName, categoryFilter, taskFromDate, taskToDate, projectLookup]);

    const handleViewOrder = async (orderId: number) => {
        setViewingOrder(null);
        setIsOrderDetailsLoading(true);

        setViewingOrder({ id: orderId } as OrderById); 
        
        try {
            const orderResponse = await getOrder(orderId);
            
            if (orderResponse.data) {
                setViewingOrder(orderResponse.data);
            } else {
                console.error("Failed to load detailed order view:", orderResponse.error);
                toast({
                    title: "Error",
                    description: "Failed to load detailed project information.",
                    variant: "destructive",
                });
                setViewingOrder(null); 
            }
        } catch (error) {
             toast({
                title: "API Error",
                description: `An unexpected error occurred while fetching order details for ID ${orderId}.`,
                variant: "destructive",
            });
            setViewingOrder(null);
        } finally {
            setIsOrderDetailsLoading(false);
        }
    };

    const clearTaskFilters = () => {
        setTaskSearchTerm("");
        setTaskStatusFilter("all");
        setTaskStaffFilterName("all");
        setCategoryFilter("all");
        setTaskFromDate("");
        setTaskToDate("");
    };

    const filterCount = [taskStatusFilter, taskStaffFilterName, categoryFilter, taskFromDate, taskToDate].filter(f => f !== 'all' && f !== '').length;
    const hasActiveTaskFilters = filterCount > 0 || taskSearchTerm !== '';

    // --- Descriptively styled and responsive filter panel ---
    const renderTaskFilters = () => (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-6">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <Filter className="h-5 w-5 mr-2 text-blue-600" />
                        Find & Organize Tasks
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                        Use these filters to easily find specific tasks. Search by description, check which stage they are in, or quickly find tasks assigned to specific team members.
                    </p>
                </div>

                {hasActiveTaskFilters && (
                    <Button variant="ghost" size="sm" onClick={clearTaskFilters} className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All Filters
                    </Button>
                )}
            </div>

            {/* Primary Row: Most used tools */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Main Search Bar */}
                <div className="lg:col-span-6 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">What are you looking for?</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="Search tasks, customers, or order ID..."
                            className="pl-10 h-11 text-base bg-gray-50/50 focus:bg-white transition-colors"
                            value={taskSearchTerm}
                            onChange={(e) => setTaskSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Task Status</label>
                    <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                        <SelectTrigger className="w-full h-11 bg-white">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Any Status</SelectItem>
                            {TASK_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${getTaskStatusColor(status)}`}>
                                        {status.replace('_', ' ')}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Staff Filter */}
                <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Assigned Staff</label>
                    <Select value={taskStaffFilterName} onValueChange={setTaskStaffFilterName} disabled={isLoading || isStaffLoading}>
                        <SelectTrigger className="w-full h-11 bg-white">
                            <SelectValue placeholder="All Staff" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Staff</SelectItem>
                            
                            {/* Designer */}
                            <div
                                className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenDepartment(openDepartment === "designer" ? null : "designer");
                                }}
                            >
                                <span>Designer</span>
                                {openDepartment === "designer" ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                            {openDepartment === "designer" && staff.filter(s => s.role?.toLowerCase() === "designer").map(s => (
                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}

                            {/* Production */}
                            <div
                                className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenDepartment(openDepartment === "production" ? null : "production");
                                }}
                            >
                                <span>Production</span>
                                {openDepartment === "production" ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                            {openDepartment === "production" && staff.filter(s => s.role?.toLowerCase() === "production").map(s => (
                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}

                            {/* Logistics */}
                            <div
                                className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenDepartment(openDepartment === "logistics" ? null : "logistics");
                                }}
                            >
                                <span>Logistics</span>
                                {openDepartment === "logistics" ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                            {openDepartment === "logistics" && staff.filter(s => s.role?.toLowerCase() === "logistics").map(s => (
                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                            ))}

                            {/* Other Staff */}
                            <div
                                className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenDepartment(openDepartment === "other" ? null : "other");
                                }}
                            >
                                <span>Other Staff</span>
                                {openDepartment === "other" ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                            {openDepartment === "other" && staff.filter(s => !["designer", "production", "logistics"].includes(s.role?.toLowerCase() || "")).map(s => (
                                <SelectItem key={s.id} value={s.name}>{s.name} <span className="text-gray-400 capitalize">({s.role})</span></SelectItem>
                            ))}

                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Secondary Row (Categories & Dates) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100">
                {/* Product Category Filter */}
                <div className="space-y-1.5 lg:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Category</label>
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

                {/* Due Date Filters */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Due Date (From)</label>
                    <Input type="date" value={taskFromDate} onChange={(e) => setTaskFromDate(e.target.value)} className="w-full bg-white" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Task Due Date (To)</label>
                    <Input type="date" value={taskToDate} onChange={(e) => setTaskToDate(e.target.value)} className="w-full bg-white" />
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                <CardHeader className="px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center text-2xl"><CheckSquare className="h-6 w-6 mr-3 text-blue-600" />Task Management</CardTitle>
                            <CardDescription className="mt-1">Track individual tasks and assignments across all projects.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 bg-gray-50/30 pt-4">
                    
                    {/* --- DESKTOP FILTERS --- */}
                    <div className="hidden md:block">
                        {renderTaskFilters()}
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
                                    {filterCount > 0 && <Badge className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-200">{filterCount}</Badge>}
                                </span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : 'rotate-0'}`} />
                            </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="p-0 border-t">
                            <div className="p-4 bg-white">
                                {renderTaskFilters()}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                    
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                                <p className="mt-4 text-sm font-medium text-gray-500">Loading tasks...</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {filteredTasks.length === 0 ? (
                                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white">
                                    <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700">No Tasks Found</h3>
                                    <p className="text-gray-500 mt-1 max-w-md mx-auto">
                                        {hasActiveTaskFilters ? 'Try adjusting your filters or search terms.' : 'No tasks assigned yet.'}
                                    </p>
                                    {hasActiveTaskFilters && (
                                        <Button variant="outline" className="mt-6" onClick={clearTaskFilters}>
                                            Clear All Filters
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                filteredTasks.map((task) => {
                                    const associatedProject = projectLookup[task.order_id];
                                    const customerName = associatedProject?.customer_name || `Order PRJ-${task.order_id}`;
                                    const productName = associatedProject?.product_name || "Product Name N/A";
                                    const generatedOrderId = associatedProject?.generated_order_id;
                                    const projectCompletionDate = associatedProject?.completion_date;

                                    // --- Task Overdue Check ---
                                    const isCompleted = task.status === 'completed';
                                    let isOverdue = false;

                                    if (!isCompleted && task.completion_time) {
                                        const dueDate = new Date(task.completion_time);
                                        dueDate.setHours(23, 59, 59, 999);
                                        const now = new Date();

                                        if (now.getTime() > dueDate.getTime()) {
                                            isOverdue = true;
                                        }
                                    }

                                    // --- Project Target Styling ---
                                    const isTargetToday = isDateToday(projectCompletionDate);
                                    const targetClass = isTargetToday
                                        ? 'font-bold text-red-700 bg-red-100 p-1 rounded'
                                        : 'text-gray-600';

                                    // Conditional styling for the task card
                                    const cardClass = isOverdue
                                        ? "border-2 border-red-500 rounded-xl p-4 sm:p-5 bg-red-50/50 hover:shadow-md transition-shadow"
                                        : "border border-gray-200 rounded-xl p-4 sm:p-5 bg-white hover:shadow-md transition-shadow";

                                    return (
                                        <div key={task.id} className={cardClass}>
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">

                                                {/* Task Details (Left side, takes up space) */}
                                                <div className="flex-1 min-w-0 w-full">

                                                    {/* 1. Customer Name as Main Title */}
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b pb-3 border-gray-100">
                                                        <h2 className="font-bold text-lg text-blue-700 truncate max-w-full">
                                                            Customer: {customerName}
                                                        </h2>

                                                        <p className="text-sm text-gray-500 flex-shrink-0">
                                                            Task ID: <span className="font-semibold text-gray-800">#{task.id}</span>
                                                        </p>
                                                    </div>

                                                    {/* 2. Product Name / Order ID Block (Highlighted) */}
                                                    <div className="mb-4">
                                                        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5 flex items-center">
                                                            <Package className="h-3.5 w-3.5 mr-1 text-blue-600" /> Project Details
                                                        </h3>
                                                        <div className="text-sm text-gray-700 p-3 bg-blue-50/70 border border-blue-100 rounded-lg whitespace-pre-wrap max-h-24 overflow-y-auto shadow-sm">
                                                            <p className="font-bold text-base text-blue-800 mb-1">
                                                                {productName}
                                                            </p>
                                                            <p className="text-xs font-medium text-blue-600 flex items-center">
                                                                Order ID: {generatedOrderId ? <Badge variant="outline" className="ml-1.5 bg-white font-mono text-purple-700 border-purple-200">{generatedOrderId}</Badge> : `PRJ-${task.order_id}`}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* 3. Metadata block (Condensed) */}
                                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">

                                                        {/* Assigned To */}
                                                        <span className="flex items-center">
                                                            <User className="h-4 w-4 mr-1.5 text-gray-400" />
                                                            Assigned To: <span className="font-semibold text-gray-800 ml-1.5">{task.assigned_to?.staff_name || "Unassigned"}</span>
                                                            {task.assigned_to?.role && <span className="text-xs font-medium text-gray-500 ml-1 capitalize">({task.assigned_to.role})</span>}
                                                        </span>

                                                        {/* Task Completion Due (MODIFIED for Overdue styling) */}
                                                        {task.completion_time && (
                                                            <span className={`flex items-center font-medium ${isOverdue ? 'text-red-700 font-bold' : 'text-gray-600'}`}>
                                                                <Hourglass className={`h-4 w-4 mr-1.5 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`} />
                                                                Due: {new Date(task.completion_time).toLocaleDateString()}
                                                                {isOverdue && <Badge variant="destructive" className="ml-1.5 text-[10px] uppercase font-bold px-1.5 py-0">Overdue</Badge>}
                                                            </span>
                                                        )}

                                                        {/* Actual Completion Date */}
                                                        {task.status === 'completed' && task.completed_on && (
                                                            <span className="flex items-center text-green-700 font-medium">
                                                                <CheckSquare className="h-4 w-4 mr-1.5 text-green-500" />
                                                                Done: {new Date(task.completed_on).toLocaleDateString()}
                                                            </span>
                                                        )}

                                                        {/* Project Target Completion Date */}
                                                        {projectCompletionDate && (
                                                            <span className={`flex items-center ${targetClass}`}>
                                                                <Calendar className={`h-4 w-4 mr-1.5 ${isTargetToday ? 'text-red-600' : 'text-gray-400'}`} />
                                                                Project Due: {new Date(projectCompletionDate).toLocaleDateString()}
                                                                {isTargetToday && <Badge variant="destructive" className="ml-1.5 text-[10px] uppercase font-bold px-1.5 py-0">PRJ Due Today</Badge>}
                                                            </span>
                                                        )}

                                                        {/* Task Description Snippet */}
                                                        <div className="mt-3 w-full pt-3 border-t border-gray-100 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                            <span className="font-semibold text-gray-800 block mb-1">Task Description / Instructions:</span>
                                                            <span className="italic">{task.task_description || "No specific task note provided."}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status & Actions (Right side) */}
                                                <div className="w-full sm:w-auto flex flex-col items-start sm:items-end gap-3 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">

                                                    {/* Status Badge */}
                                                    <div className="flex sm:justify-end w-full">
                                                        <Badge className={`capitalize px-3 py-1 font-semibold text-xs border-2 ${getTaskStatusColor(task.status)}`}>
                                                            {task.status}
                                                        </Badge>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex justify-start sm:justify-end space-x-2 mt-auto">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="bg-white"
                                                            onClick={() => handleViewOrder(task.order_id)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1.5 text-gray-500" />View Order
                                                        </Button>

                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="bg-gray-900 hover:bg-gray-800"
                                                            onClick={() => handleOpenEditModal(task)}
                                                        >
                                                            <Edit className="h-4 w-4 mr-1.5" />Edit Task
                                                        </Button>
                                                    </div>
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
        
            {/* ============================================================= */}
            {/* TASK EDIT FORM MODAL */}
            {/* ============================================================= */}
            <EditTaskForm
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                task={selectedTaskForEdit}
                staffList={staff} 
            />

            {/* ============================================================= */}
            {/* ORDER DETAILS VIEW DIALOG */}
            {/* ============================================================= */}
            <Dialog open={!!viewingOrder} onOpenChange={(open) => { 
                if (!open) { 
                    setViewingOrder(null);
                    setIsOrderDetailsLoading(false);
                } 
            }}>
                <DialogContent className="sm:max-w-[425px] md:max-w-xl flex flex-col max-h-[90vh]">
                    
                    <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Order Details #{viewingOrder?.id}</DialogTitle>
                    <DialogDescription>
                        Comprehensive information about this customer order.
                    </DialogDescription>
                    </DialogHeader>
                    
                    {isOrderDetailsLoading ? (
                        <div className="py-10 flex flex-col items-center flex-grow">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        <p className="mt-2 text-sm text-gray-500">Loading order details...</p>
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
                                
                                {/* ORDER CORE DETAILS */}
                                <h4 className="font-bold text-gray-700 mt-2 border-t pt-3">Product & Order Details</h4>
                                
                                {/* Generated Order ID Display */}
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
                                    <span className="font-medium text-gray-500">Quantity</span>
                                    <span className="col-span-2">{viewingOrder.quantity || 0}</span>
                                </div>

                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Status</span>
                                    <Badge className={getProjectStatusColor(viewingOrder.status || 'pending')}>{viewingOrder.status || 'Pending'}</Badge>
                                </div>
                                
                                {/* FINANCIAL DETAILS */}
                                <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><IndianRupee className="h-4 w-4 mr-2" /> Financials</h4>
                                
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Total Billed Amount</span>
                                    <span className="col-span-2 flex items-center text-blue-700 font-bold">
                                        {/* Using viewingOrder.amount or total_amount based on API structure */}
                                        ₹ {(viewingOrder.total_amount || viewingOrder.amount)?.toLocaleString('en-IN') || '0.00'} 
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Additional Charges</span>
                                    <span className="col-span-2 flex items-center text-gray-700 font-medium">
                                        ₹ {viewingOrder.additional_amount ? viewingOrder.additional_amount.toLocaleString('en-IN') : '0.00'} 
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
                                
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500 flex items-center"><CreditCard className="h-4 w-4 mr-1" /> Payment Method</span>
                                    <span className="col-span-2 capitalize">{viewingOrder.payment_method?.replace(/_/g, ' ') || 'N/A'}</span>
                                </div>

                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Account Name</span>
                                    <span className="col-span-2">{viewingOrder.account_name || 'N/A'}</span>
                                </div>
                                
                                {/* DATE DETAILS */}
                                <h4 className="font-bold text-gray-700 mt-4 border-t pt-3">Timeline</h4>

                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Project Commitment</span>
                                    <span className="col-span-2">{viewingOrder.project_committed_on || 'N/A'}</span>
                                </div>

                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Start Date</span>
                                    <span className="col-span-2">{viewingOrder.start_on ? new Date(viewingOrder.start_on).toLocaleDateString() : 'N/A'}</span>
                                </div>

                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Completion Target</span>
                                    <span className="col-span-2 font-semibold text-red-500">{viewingOrder.completion_date ? new Date(viewingOrder.completion_date).toLocaleDateString() : 'N/A'}</span>
                                </div>

                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Completed On</span>
                                    <span className="col-span-2">{viewingOrder.completed_on ? new Date(viewingOrder.completed_on).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                
                                {/* DELIVERY DETAILS */}
                                <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><Truck className="h-4 w-4 mr-2" /> Delivery</h4>

                                <div className="grid grid-cols-3 items-center gap-4">
                                    <span className="font-medium text-gray-500">Delivery Type</span>
                                    <span className="col-span-2 capitalize">{viewingOrder.delivery_type?.replace(/_/g, ' ') || 'N/A'}</span>
                                </div>

                                {viewingOrder.delivery_type?.toLowerCase() !== 'pickup' && viewingOrder.delivery_address && (
                                    <div className="pt-2">
                                        <p className="font-medium text-gray-500 mb-2">Delivery Address</p>
                                        <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{viewingOrder.delivery_address}</p>
                                    </div>
                                )}
                                
                                {viewingOrder.delivery_type?.toLowerCase() === 'home_delivery' && !viewingOrder.delivery_address && (
                                    <div className="pt-2 text-red-500 italic">
                                        Delivery selected, but no address recorded.
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
                </DialogContent>
            </Dialog>
        </>
    );
};
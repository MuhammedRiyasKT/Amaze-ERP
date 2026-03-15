"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// Import the API client, types, and the form components
import {
    getOrders,
    getActiveStaffs,
    getAllTasks,
    getOrder,
    updateOrder,
    deleteOrder,
    getTasksByOrder,
    type Order,
    type Staff,
    type DetailedTask,
    type OrderById,
    type OrderImage,
    getOrderImages
} from "@/lib/project"
import { AssignTaskForm } from "@/components/assign-task-form"
import { EditTaskForm } from "@/components/edit-task-form"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"

import {
    FolderOpen,
    CheckSquare,
    Calendar,
    Users,
    Clock,
    TrendingUp,
    Search,
    Filter,
    Eye,
    Edit,
    AlertTriangle,
    CheckCircle,
    CheckCircle2,
    User,
    UserPlus,
    BarChart,
    IndianRupee,
    Package,
    Trash2,
    Phone,
    MessageSquare,
    CreditCard,
    Truck,
    Loader2,
    Repeat2,
    ChevronDown,
    Image as ImageIcon,
    Hourglass,
    SlidersHorizontal,
    XCircle,
    Sparkles,
    ArrowRight,
    Activity, // Added Activity here
    FileText,  // Added FileText here
    ChevronRight,
} from "lucide-react"

type OrderWithGeneratedId = Order & { generated_order_id?: string | null };

// =============================================================
// 1. IMAGE MANAGER DIALOG
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
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-500">Loading images...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <p className="text-center text-gray-500 p-8 border rounded-lg">No images found for this project.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((img, index) => (
                                <Card key={img.id} className="relative group overflow-hidden shadow-sm">
                                    <div className="aspect-square w-full bg-gray-200">
                                        <img
                                            src={img.image_url}
                                            alt={img.description || `Project Image ${img.id}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-x-2">
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


// --- Helper Functions and Constants ---

const isDateToday = (dateString?: string | null): boolean => {
    if (!dateString) return false;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false;

    const today = new Date();

    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return date.getTime() === today.getTime();
};

const getProjectStatusColor = (status?: string | null) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800 border-green-200'
        case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
        case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200'
        case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
}

const getTaskStatusColor = (status?: string | null) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800'
        case 'in_progress': case 'assigned': return 'bg-blue-100 text-blue-800'
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}

const ORDER_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const STATUS_COLORS = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    in_progress: "bg-purple-100 text-purple-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700"
};

const TASK_STATUSES = [, 'assigned', 'in_progress', 'completed'];

const TASK_STATUS_COLORS = {
    assigned: "bg-blue-100 text-blue-700",
    in_progress: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700"
};

const PROJECT_CATEGORIES = [
    { value: 'crystal_wall_art', label: 'Crystal Wall Art' },
    { value: 'amaze_ads', label: 'Amaze Ads' },
    { value: 'crystal_glass_art', label: 'Crystal Glass Art' },
    { value: 'sign_board_amaze', label: 'Sign Board Amaze' },
];

export function ProjectDashboard() {
    const { toast } = useToast()

    // --- State Management ---
    const [projects, setProjects] = useState<OrderWithGeneratedId[]>([])
    const [staff, setStaff] = useState<Staff[]>([])
    const [tasks, setTasks] = useState<DetailedTask[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // --- Filter States (Orders) ---
    const [orderSearchTerm, setOrderSearchTerm] = useState("")
    const [orderRoleFilter, setOrderRoleFilter] = useState<string>("all")
    const [staffFilter, setStaffFilter] = useState("all")
    const [openDepartment, setOpenDepartment] = useState<string | null>(null)
    const [orderStatusFilter, setOrderStatusFilter] = useState("all")
    const [orderCategoryFilter, setOrderCategoryFilter] = useState("all")
    const [taskAssignmentFilter, setTaskAssignmentFilter] = useState("all")
    const [orderFromDate, setOrderFromDate] = useState("")
    const [orderToDate, setOrderToDate] = useState("")
    const [showOrderAdvancedFilters, setShowOrderAdvancedFilters] = useState(false);

    // --- Filter States (Tasks) ---
    const [taskSearchTerm, setTaskSearchTerm] = useState("");
    const [taskRoleFilter, setTaskRoleFilter] = useState("all");
    const [taskStatusFilter, setTaskStatusFilter] = useState("all");
    const [taskFromDate, setTaskFromDate] = useState("");
    const [taskToDate, setTaskToDate] = useState("");
    const [showTaskAdvancedFilters, setShowTaskAdvancedFilters] = useState(false);

    // --- Task/Assignment Modals ---
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedProject, setSelectedProject] = useState<Order | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<DetailedTask | null>(null)

    // --- View Detail States ---
    const [viewingOrder, setViewingOrder] = useState<OrderById | null>(null)
    const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false)
    const [viewingOrderTasks, setViewingOrderTasks] = useState<DetailedTask[]>([]);
    const [isViewingOrderTasksLoading, setIsViewingOrderTasksLoading] = useState(false);

    // NEW STATE for Image Management
    const [selectedProjectForImages, setSelectedProjectForImages] = useState<OrderWithGeneratedId | null>(null);

    // --- Status Update States ---
    const [isStatusUpdateModalOpen, setIsStatusUpdateModalOpen] = useState(false)
    const [selectedProjectForStatusUpdate, setSelectedProjectForStatusUpdate] = useState<OrderWithGeneratedId | null>(null)
    const [newStatus, setNewStatus] = useState<string>('')
    const [isStatusUpdating, setIsStatusUpdating] = useState(false)
    const [generatedOrderIdInput, setGeneratedOrderIdInput] = useState<string>('')

    // --- PROJECT LOOKUP MAP ---
    const projectLookup = useMemo(() => {
        return projects.reduce((acc, project) => {
            if (project.id) {
                acc[project.id] = project;
            }
            return acc;
        }, {} as Record<number, OrderWithGeneratedId>);
    }, [projects]);

    // --- Data Fetching Effect ---
    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        setIsLoading(true)
        setError(null)
        const [projectResponse, staffResponse, tasksResponse] = await Promise.all([
            getOrders(),
            getActiveStaffs(),
            getAllTasks()
        ])

        let errors: string[] = [];

        if (projectResponse.error) errors.push(projectResponse.error);
        else if (projectResponse.data) setProjects(projectResponse.data as OrderWithGeneratedId[]);

        if (staffResponse.error) errors.push(staffResponse.error);
        else if (staffResponse.data) setStaff(staffResponse.data.staffs);

        if (tasksResponse.error) errors.push(tasksResponse.error);
        else if (tasksResponse.data) setTasks(tasksResponse.data);

        if (errors.length > 0) setError(errors.join(', '));
        setIsLoading(false)
    }

    const reloadData = async () => {
        const [projectResponse, tasksResponse] = await Promise.all([
            getOrders(), getAllTasks()
        ]);
        if (projectResponse.data) setProjects(projectResponse.data as OrderWithGeneratedId[]);
        if (tasksResponse.data) setTasks(tasksResponse.data);
    }

    // --- Modal Handlers ---
    const handleOpenAssignModal = (project: Order) => {
        setSelectedProject(project)
        setIsAssignModalOpen(true)
    }

    const handleAssignSuccess = () => {
        setIsAssignModalOpen(false)
        setSelectedProject(null)
        reloadData()
    }

    const handleOpenEditModal = (task: DetailedTask) => {
        setSelectedTaskForEdit(task)
        setIsEditModalOpen(true)
    }

    const handleEditSuccess = () => {
        setIsEditModalOpen(false)
        setSelectedTaskForEdit(null)
        reloadData()
        if (viewingOrder?.id) {
            handleViewProject({ id: viewingOrder.id } as Order);
        }
    }

    const handleOpenImageModal = (project: OrderWithGeneratedId) => {
        setSelectedProjectForImages(project);
    };

    const handleViewProject = async (project: Order) => {
        setViewingOrder(null);
        setViewingOrderTasks([]);
        setIsOrderDetailsLoading(true);
        setIsViewingOrderTasksLoading(true);

        const orderId = project.id;

        const [orderResponse, tasksResponse] = await Promise.all([
            getOrder(orderId),
            getTasksByOrder(orderId)
        ]);

        if (orderResponse.data) {
            setViewingOrder(orderResponse.data as OrderById);
        } else {
            toast({
                title: "Error",
                description: "Failed to load detailed project information.",
                variant: "destructive",
            });
        }

        if (tasksResponse.data) {
            setViewingOrderTasks(tasksResponse.data);
        }

        setIsOrderDetailsLoading(false);
        setIsViewingOrderTasksLoading(false);
    }

    const handleDeleteProject = async (id: number) => {
        const response = await deleteOrder(id);

        if (response.error) {
            toast({
                title: "Delete Failed",
                description: response.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Project Deleted",
                description: `Project PRJ-${id} has been successfully deleted.`,
            });
            reloadData();
        }
    }

    const handleOpenStatusUpdateModal = (project: OrderWithGeneratedId) => {
        setSelectedProjectForStatusUpdate(project);
        setNewStatus(project.status || 'pending');
        setGeneratedOrderIdInput(project.generated_order_id || '');
        setIsStatusUpdateModalOpen(true);
    }

    const handleStatusUpdate = async () => {
        if (!selectedProjectForStatusUpdate || !newStatus) return;

        const requiresGeneratedId =
            (newStatus === 'in_progress' || newStatus === 'completed') &&
            !selectedProjectForStatusUpdate.generated_order_id;

        if (requiresGeneratedId && !generatedOrderIdInput.trim()) {
            toast({
                title: "Validation Required",
                description: "Please provide the Generated Order ID before moving to this status.",
                variant: "destructive",
            });
            return;
        }

        setIsStatusUpdating(true);

        const projectId = selectedProjectForStatusUpdate.id;
        let payload: {
            status: string;
            completed_on?: string | null;
            generated_order_id?: string | null;
        } = { status: newStatus };

        if (newStatus === 'completed') {
            payload.completed_on = new Date().toISOString();
        } else {
            payload.completed_on = null;
        }

        if ((newStatus === 'in_progress' || newStatus === 'completed') && generatedOrderIdInput.trim()) {
            payload.generated_order_id = generatedOrderIdInput.trim();
        }

        const response = await updateOrder(projectId, payload);

        if (response.error) {
            toast({
                title: "Status Update Failed",
                description: response.error,
                variant: "destructive",
            });
        } else {
            toast({
                title: "Status Updated Successfully",
                description: `Project PRJ-${projectId} status is now: ${newStatus.toUpperCase()}`,
            });
            setIsStatusUpdateModalOpen(false);
            setSelectedProjectForStatusUpdate(null);
            setGeneratedOrderIdInput('');
            reloadData();
        }
        setIsStatusUpdating(false);
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


    // --- Filtering Logic (Projects) ---
    const filteredProjects = projects.filter(project => {
        const matchesSearch =
            (project.description?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                project.product_name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                project.customer_name?.toLowerCase().includes(orderSearchTerm.toLowerCase()) ||
                project.id?.toString().includes(orderSearchTerm) ||
                project.generated_order_id?.toLowerCase().includes(orderSearchTerm.toLowerCase()));

        const matchesStatus =
            orderStatusFilter === 'all' ||
            project.status?.toLowerCase() === orderStatusFilter.toLowerCase();

        const matchesRole =
            orderRoleFilter === 'all' ||
            (() => {
                const creator = staff.find(s => s.name === project.created_by_staff_name);
                return creator?.role?.toLowerCase() === orderRoleFilter.toLowerCase();
            })();

        const matchesStaff =
            staffFilter === "all" ||
            project.created_by_staff_name === staffFilter

        const matchesCategory =
            orderCategoryFilter === 'all' ||
            project.category?.toLowerCase() === orderCategoryFilter.toLowerCase();

        const projectTasks = tasks.filter(t => t.order_id === project.id);
        const totalTasks = projectTasks.length;
        const unassignedTasksCount = projectTasks.filter(t => !t.assigned_to?.staff_name).length;

        const matchesTaskAssignment =
            taskAssignmentFilter === "all" ||
            (taskAssignmentFilter === "assigned" && totalTasks > 0) ||
            (taskAssignmentFilter === "zero_tasks" && totalTasks === 0);


        let matchesDate = true;
        const projectCompletionDate = project.completion_date ? new Date(project.completion_date).getTime() : null;
        const hasDateFilters = orderFromDate || orderToDate;

        if (hasDateFilters) {
            if (projectCompletionDate === null) {
                matchesDate = false;
            } else {
                if (orderFromDate) {
                    const fromDate = new Date(orderFromDate);
                    fromDate.setHours(0, 0, 0, 0);
                    matchesDate = matchesDate && projectCompletionDate >= fromDate.getTime();
                }
                if (orderToDate) {
                    const toDate = new Date(orderToDate);
                    toDate.setDate(toDate.getDate() + 1);
                    const toDateTime = toDate.getTime();
                    matchesDate = matchesDate && projectCompletionDate < toDateTime;
                }
            }
        }

        return matchesSearch && matchesStatus && matchesRole && matchesStaff && matchesCategory && matchesTaskAssignment && matchesDate;
    })

    // --- Filtering Logic (Tasks) ---
    const filteredTasks = tasks.filter(task => {
        const matchesSearch =
            (task.task_description?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                task.assigned_to?.staff_name?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                projectLookup[task.order_id]?.customer_name?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                task.order_id?.toString().includes(taskSearchTerm));

        const matchesStatus =
            taskStatusFilter === 'all' ||
            task.status?.toLowerCase() === taskStatusFilter.toLowerCase();

        const matchesRole =
            taskRoleFilter === 'all' ||
            task.assigned_to?.role?.toLowerCase() === taskRoleFilter.toLowerCase();

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
                    toDate.setDate(toDate.getDate() + 1);
                    const toDateTime = toDate.getTime();
                    matchesDate = matchesDate && taskCompletionTime < toDateTime;
                }
            }
        }

        return matchesSearch && matchesStatus && matchesRole && matchesDate;
    });

    const activeProjects = projects.filter(p => p.status === 'in_progress').length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const projectMetrics = [
        { name: "Active Projects", value: activeProjects.toString(), change: "+2", icon: FolderOpen },
        { name: "Completed This Month", value: completedProjects.toString(), change: "+5", icon: CheckSquare },
        { name: "Total Projects", value: projects.length.toString(), change: "+10", icon: TrendingUp },
        { name: "Team Utilization", value: "87%", change: "+5%", icon: Users },
    ]


    // --- Clear Filter Handlers ---
    const hasActiveOrderFilters = orderSearchTerm !== '' || orderRoleFilter !== 'all' || taskAssignmentFilter !== 'all' || orderStatusFilter !== 'all' || orderCategoryFilter !== 'all' || orderFromDate !== '' || orderToDate !== '';
    const clearOrderFilters = () => {
        setOrderSearchTerm('')
        setOrderRoleFilter('all')
        setStaffFilter('all')
        setTaskAssignmentFilter('all')
        setOrderStatusFilter('all')
        setOrderCategoryFilter('all')
        setOrderFromDate('')
        setOrderToDate('')
    }

    const hasActiveTaskFilters = taskSearchTerm !== '' || taskRoleFilter !== 'all' || taskStatusFilter !== 'all' || taskFromDate !== '' || taskToDate !== '';
    const clearTaskFilters = () => {
        setTaskSearchTerm(''); setTaskRoleFilter('all'); setTaskStatusFilter('all'); setTaskFromDate(''); setTaskToDate('');
    };


    // --- Clean & Formatted UI Filter Components ---
    const renderOrderFilters = () => (
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
                            value={orderSearchTerm}
                            onChange={(e) => setOrderSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Status Filter */}
                <div className="lg:col-span-3 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Current Stage</label>

                    <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                        <SelectTrigger className="w-full h-11 bg-white">
                            <SelectValue placeholder="All Stages" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">Any Stage</SelectItem>

                            {ORDER_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[status]}`}
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

                        <Select value={orderCategoryFilter} onValueChange={setOrderCategoryFilter}>
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
                                    onClick={() =>
                                        setOpenDepartment(openDepartment === "crm" ? null : "crm")
                                    }
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
                                    onClick={() =>
                                        setOpenDepartment(openDepartment === "sales" ? null : "sales")
                                    }
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
                            value={orderFromDate}
                            onChange={(e) => setOrderFromDate(e.target.value)}
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
                            value={orderToDate}
                            onChange={(e) => setOrderToDate(e.target.value)}
                            className="w-full bg-white"
                        />
                    </div>

                </div>

            </div>
        </div>
    );

    const renderTaskFilters = () => (
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 mb-6">

            {/* Header Section explaining the use */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center">
                        <Filter className="h-5 w-5 mr-2 text-blue-600" />
                        Find & Track Tasks
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                        Use these tools to zero in on specific tasks. Quickly search by staff name or task details, and filter to see what is still pending or completed.
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

                {/* Main Search */}
                <div className="lg:col-span-6 space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Search Tasks & Staff</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <Input
                            placeholder="e.g., Design review, John Smith..."
                            className="pl-10 h-11 text-base bg-gray-50/50 focus:bg-white transition-colors"
                            value={taskSearchTerm}
                            onChange={(e) => setTaskSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Task Status */}
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
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium ${TASK_STATUS_COLORS[status]}`}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>

                    </Select>
                </div>

                {/* Department */}

            </div>

            {/* Collapsible Advanced Filters */}
            <div className="mt-4 pt-2">
                {/* <Button
                    variant="ghost"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0 h-auto font-medium flex items-center"
                    onClick={() => setShowTaskAdvancedFilters(!showTaskAdvancedFilters)}
                >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    {showTaskAdvancedFilters ? 'Hide Due Date Filters' : 'Filter by Due Date'}
                </Button> */}


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date (From)</label>
                        <Input type="date" value={taskFromDate} onChange={(e) => setTaskFromDate(e.target.value)} className="w-full bg-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date (To)</label>
                        <Input type="date" value={taskToDate} onChange={(e) => setTaskToDate(e.target.value)} className="w-full bg-white" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Assigned Department
                        </label>

                        <Select value={staffFilter} onValueChange={setStaffFilter}>
                            <SelectTrigger className="w-full bg-white">
                                <SelectValue placeholder="All Staff" />
                            </SelectTrigger>

                            <SelectContent>

                                <SelectItem value="all">All Staff</SelectItem>

                                {/* DESIGNER */}
                                <div
                                    className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() =>
                                        setOpenDepartment(openDepartment === "designer" ? null : "designer")
                                    }
                                >
                                    <span>Designer</span>

                                    {openDepartment === "designer" ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </div>

                                {openDepartment === "designer" &&
                                    staff
                                        .filter(s => s.role?.toLowerCase() === "designer")
                                        .map(s => (
                                            <SelectItem key={s.id} value={s.name}>
                                                {s.name}
                                            </SelectItem>
                                        ))}

                                {/* PRODUCTION */}
                                <div
                                    className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() =>
                                        setOpenDepartment(openDepartment === "production" ? null : "production")
                                    }
                                >
                                    <span>Production</span>

                                    {openDepartment === "production" ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </div>

                                {openDepartment === "production" &&
                                    staff
                                        .filter(s => s.role?.toLowerCase() === "production")
                                        .map(s => (
                                            <SelectItem key={s.id} value={s.name}>
                                                {s.name}
                                            </SelectItem>
                                        ))}

                                {/* LOGISTICS */}
                                <div
                                    className="flex items-center justify-between px-2 py-2 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-100"
                                    onClick={() =>
                                        setOpenDepartment(openDepartment === "logistics" ? null : "logistics")
                                    }
                                >
                                    <span>Logistics</span>

                                    {openDepartment === "logistics" ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronRight size={16} />
                                    )}
                                </div>

                                {openDepartment === "logistics" &&
                                    staff
                                        .filter(s => s.role?.toLowerCase() === "logistics")
                                        .map(s => (
                                            <SelectItem key={s.id} value={s.name}>
                                                {s.name}
                                            </SelectItem>
                                        ))}

                            </SelectContent>
                        </Select>
                    </div>

                    {/* Product Category */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Product Category
                        </label>

                        <Select value={orderCategoryFilter} onValueChange={setOrderCategoryFilter}>
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
                </div>

            </div>
        </div>
    );

    return (
        <DashboardLayout title="Project Dashboard" role="project">
            <main className="flex-1 space-y-6 p-4 md:p-6 overflow-y-auto">

                <Tabs defaultValue="projects" className="space-y-6">

                    <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 h-auto p-1 bg-gray-200 rounded-lg gap-1">
                        {[
                            { value: 'projects', label: 'Projects' },
                            { value: 'tasks', label: 'Tasks' },
                            { value: 'timeline', label: 'Timeline' },
                            { value: 'resources', label: 'Resources' },
                            { value: 'reports', label: 'Reports' },
                        ].map(tab => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="py-1 px-3 transition-all duration-200 
                            data-[state=active]:bg-black 
                            data-[state=active]:text-white
                            data-[state=active]:shadow-md
                            bg-white text-gray-700 rounded-md
                            hover:bg-gray-100 text-sm"
                            >
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {/* PROJECTS TAB (Order List) */}
                    <TabsContent value="projects" className="space-y-6">
                        <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                            <CardHeader className="px-4 sm:px-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div>
                                        <CardTitle className="flex items-center text-2xl">
                                            <FolderOpen className="h-6 w-6 mr-3 text-blue-600" />
                                            Project Management
                                        </CardTitle>
                                        <CardDescription className="mt-1">Track and manage all active projects, tasks, and deliverables</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 sm:px-6 bg-gray-50/30 pt-4">
                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                                        <p className="text-sm text-red-600">Error: {error}</p>
                                    </div>
                                )}

                                {/* --- RENDER THE NEW FRIENDLY FILTERS --- */}
                                {renderOrderFilters()}

                                {isLoading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <div className="text-center">
                                            <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                                            <p className="mt-4 text-sm font-medium text-gray-500">Loading your projects...</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {filteredProjects.length === 0 ? (
                                            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-white">
                                                <FolderOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold text-gray-700">No Projects Found</h3>
                                                <p className="text-gray-500 mt-1 max-w-md mx-auto">
                                                    {hasActiveOrderFilters ? 'Try adjusting your filters or search terms.' : 'No projects have been added yet.'}
                                                </p>
                                            </div>
                                        ) : (
                                            filteredProjects.map((project) => {

                                                const totalAmountDisplay = (project.total_amount || project.amount)?.toLocaleString('en-IN') || 'N/A';
                                                const completionDateDisplay = project.completion_date
                                                    ? new Date(project.completion_date).toLocaleDateString()
                                                    : 'Not Set';

                                                const isInProgress = project.status?.toLowerCase() === 'in_progress';

                                                const generatedIdDisplay = project.generated_order_id
                                                    ? <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold border-purple-200 border text-xs">{project.generated_order_id}</Badge>
                                                    : null;

                                                // --- Task Assignments Calculation ---
                                                const projectTasks = tasks.filter(t => t.order_id === project.id);
                                                const totalTasks = projectTasks.length;
                                                const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
                                                const unassignedTasksCount = projectTasks.filter(t => !t.assigned_to?.staff_name).length;

                                                let taskStatusDisplay;
                                                if (totalTasks === 0) {
                                                    taskStatusDisplay = <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200 border font-semibold hover:bg-red-100">0 Tasks</Badge>;
                                                } else if (unassignedTasksCount > 0) {
                                                    taskStatusDisplay = <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200 border font-semibold hover:bg-orange-100">{unassignedTasksCount} Pending Assign</Badge>;
                                                } else {
                                                    taskStatusDisplay = (
                                                        <div className="flex items-center space-x-1">
                                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 border font-medium hover:bg-blue-100">
                                                                {totalTasks} Assigned
                                                            </Badge>
                                                            {completedTasks === totalTasks && totalTasks > 0 ? (
                                                                <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 border font-bold hover:bg-green-100"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Done</Badge>
                                                            ) : null}
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div key={project.id} className="border border-gray-200 rounded-xl overflow-hidden transition-all hover:shadow-lg bg-white flex flex-col">

                                                        {/* --- CARD HEADER --- */}
                                                        <div className="bg-gray-50 border-b border-gray-100 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm">
                                                                    <FolderOpen className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-lg text-gray-900 leading-tight">
                                                                        {project.customer_name || `Customer N/A`}
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

                                                        {/* --- CARD BODY (Metrics Grid) --- */}
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

                                                        {/* --- CARD FOOTER (Buttons Brought Down) --- */}
                                                        <div className="bg-gray-50/50 border-t border-gray-100 px-4 sm:px-6 py-3 mt-auto flex flex-col xl:flex-row items-center justify-between gap-4">

                                                            {/* Created By Info */}
                                                            <div className="text-xs text-gray-500 w-full xl:w-auto text-center xl:text-left">
                                                                Created by <span className="font-medium text-gray-700">{project.created_by_staff_name || 'Staff'}</span>
                                                                {project.created_on && ` on ${new Date(project.created_on).toLocaleDateString()}`}
                                                            </div>

                                                            {/* All Buttons - Aligned Bottom Right */}
                                                            <div className="flex flex-wrap items-center justify-center xl:justify-end gap-2 w-full xl:w-auto">
                                                                <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50" onClick={() => handleViewProject(project)}>
                                                                    <Eye className="h-4 w-4 mr-1.5 text-gray-500" />View Details
                                                                </Button>

                                                                <Button variant="outline" size="sm" className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200" onClick={() => handleOpenImageModal(project)}>
                                                                    <ImageIcon className="h-4 w-4 mr-1.5" />Images
                                                                </Button>

                                                                <Button variant="outline" size="sm" className="bg-white hover:bg-gray-50" onClick={() => handleOpenStatusUpdateModal(project)}>
                                                                    <Repeat2 className="h-4 w-4 mr-1.5 text-blue-500" />Status Update
                                                                </Button>

                                                                {isInProgress && (
                                                                    <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={() => handleOpenAssignModal(project)}>
                                                                        <UserPlus className="h-4 w-4 mr-1.5" />Assign Task
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
                                            })
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ==================================================================== */}
                    {/* REFACTORED TASKS TAB                                                 */}
                    {/* ==================================================================== */}
                    <TabsContent value="tasks" className="space-y-6">
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

                                {/* --- RENDER THE NEW FRIENDLY FILTERS --- */}
                                {renderTaskFilters()}

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
                                                    : "border rounded-xl p-4 sm:p-5 bg-white hover:shadow-md transition-shadow";

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
                                                                        onClick={() => handleViewProject({ id: task.order_id } as Order)}
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
                    </TabsContent>


                    {/* TIMELINE, RESOURCES, REPORTS tabs (Unchanged) */}
                    <TabsContent value="timeline" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><Calendar className="h-5 w-5 mr-2" />Project Timeline & Milestones</CardTitle>
                                <CardDescription>Track important project milestones and deadlines</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {[
                                        { project: "PRJ-001", milestone: "Design Review", date: "2024-01-20", status: "upcoming" },
                                        { project: "PRJ-002", milestone: "Concept Presentation", date: "2024-01-24", status: "upcoming" },
                                    ].map((milestone, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0">{milestone.status === "completed" ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Clock className="h-6 w-6 text-blue-600" />}</div>
                                            <div className="flex-1"><h3 className="font-semibold">{milestone.milestone}</h3><p className="text-sm text-gray-600">Project: {milestone.project}</p><p className="text-sm text-gray-500">Date: {milestone.date}</p></div>
                                            <Badge variant={milestone.status === "completed" ? "default" : "secondary"} className={`capitalize ${milestone.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>{milestone.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="resources" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center"><Users className="h-5 w-5 mr-2" />Team Allocation</CardTitle>
                                    <CardDescription>Current team member assignments</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div><p className="font-medium">Lead Designer</p><p className="text-sm text-gray-500">3 active projects</p></div>
                                            <Badge className="bg-yellow-100 text-yellow-800">Busy</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div><p className="font-medium">Project Manager</p><p className="text-sm text-gray-500">2 active projects</p></div>
                                            <Badge className="bg-green-100 text-green-800">Available</Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center"><AlertTriangle className="h-5 w-5 mr-2" />Project Alerts</CardTitle>
                                    <CardDescription>Issues requiring attention</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                                            <AlertTriangle className="h-5 w-5 text-red-600" />
                                            <div><p className="font-medium text-red-800">Budget Overrun Alert</p><p className="text-sm text-red-600">PRJ-001 is 5% over budget</p></div>
                                        </div>
                                        <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                                            <Clock className="h-5 w-5 text-yellow-600" />
                                            <div><p className="font-medium text-yellow-800">Deadline Approaching</p><p className="text-sm text-yellow-600">TSK-003 due in 2 days</p></div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="reports" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center"><BarChart className="h-5 w-5 mr-2" />Project Reports & Metrics</CardTitle>
                                <CardDescription>Key performance indicators and detailed summaries.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {projectMetrics.map((metric) => {
                                        const Icon = metric.icon
                                        return (
                                            <Card key={metric.name}>
                                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-2xl font-bold">{metric.value}</div>
                                                    <p className="text-xs text-green-600 flex items-center">
                                                        <TrendingUp className="h-3 w-3 mr-1" /> {metric.change} this month
                                                    </p>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>

                                <h3 className="text-lg font-semibold border-t pt-4">Resource Breakdown</h3>
                                <p className="text-sm text-gray-600">Detailed reports on resource allocation would go here.</p>

                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </main>

            {/* MODALS & TOASTER */}
            <AssignTaskForm
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                onSuccess={handleAssignSuccess}
                project={selectedProject}
                staffList={staff}
            />

            <EditTaskForm
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                task={selectedTaskForEdit}
                staffList={staff}
            />

            {/* STATUS UPDATE DIALOG */}
            <Dialog open={isStatusUpdateModalOpen} onOpenChange={setIsStatusUpdateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Update Status for Project PRJ-{selectedProjectForStatusUpdate?.id}</DialogTitle>
                        <DialogDescription>
                            Change the current status of the project. If setting to 'Completed', the completion date will be recorded.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col space-y-2">
                            <label htmlFor="status" className="text-sm font-medium">New Status</label>
                            <Select value={newStatus} onValueChange={setNewStatus} disabled={isStatusUpdating}>
                                <SelectTrigger id="status" className="col-span-3">
                                    <SelectValue placeholder="Select new status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ORDER_STATUSES.map(status => (
                                        <SelectItem key={status} value={status}>
                                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* CONDITIONAL GENERATED ORDER ID INPUT */}
                        {(
                            (newStatus === 'in_progress' || newStatus === 'completed') &&
                            !selectedProjectForStatusUpdate?.generated_order_id
                        ) && (
                                <div className="flex flex-col space-y-2 mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                                    <label htmlFor="generated-id" className="text-sm font-medium text-red-700">
                                        <AlertTriangle className="h-4 w-4 inline mr-1" /> Generated Order ID (Required to process/complete project)
                                    </label>
                                    <Input
                                        id="generated-id"
                                        value={generatedOrderIdInput}
                                        onChange={(e) => setGeneratedOrderIdInput(e.target.value)}
                                        placeholder="Enter external system order ID (e.g., SO-1234)"
                                        disabled={isStatusUpdating}
                                    />
                                </div>
                            )}

                        {/* Show existing ID if status is 'in_progress' or 'completed' and it exists */}
                        {((newStatus === 'in_progress' || newStatus === 'completed') && selectedProjectForStatusUpdate?.generated_order_id) && (
                            <div className="text-sm text-gray-600 mt-4">
                                Current Generated ID: <span className="font-semibold text-blue-700">{selectedProjectForStatusUpdate.generated_order_id}</span>
                            </div>
                        )}

                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusUpdateModalOpen(false)} disabled={isStatusUpdating}>
                            Cancel
                        </Button>
                        <Button onClick={handleStatusUpdate} disabled={isStatusUpdating}>
                            {isStatusUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


            {/* ORDER DETAILS VIEW DIALOG */}
            <Dialog open={!!viewingOrder} onOpenChange={(open) => {
                if (!open) {
                    setViewingOrder(null);
                    setIsOrderDetailsLoading(false);
                    setViewingOrderTasks([]); // Clear tasks on close
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
                                    <span className="col-span-2">{viewingOrder.completion_date ? new Date(viewingOrder.completion_date).toLocaleDateString() : 'N/A'}</span>
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

                                {/* Conditionally show delivery address if it's NOT pickup AND an address exists */}
                                {viewingOrder.delivery_type?.toLowerCase() !== 'pickup' && viewingOrder.delivery_address && (
                                    <div className="pt-2">
                                        <p className="font-medium text-gray-500 mb-2">Delivery Address</p>
                                        <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{viewingOrder.delivery_address}</p>
                                    </div>
                                )}

                                {/* Optional warning if Home Delivery is selected but address is missing */}
                                {viewingOrder.delivery_type?.toLowerCase() === 'home_delivery' && !viewingOrder.delivery_address && (
                                    <div className="pt-2 text-red-500 italic">
                                        Delivery selected, but no address recorded.
                                    </div>
                                )}


                                {/* 4. NEW SECTION: Tasks for this Order */}
                                <h4 className="font-bold text-gray-700 mt-4 border-t pt-3 flex items-center"><CheckSquare className="h-4 w-4 mr-2" /> Assigned Tasks ({viewingOrderTasks.length})</h4>

                                {isViewingOrderTasksLoading ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        <span className="text-sm text-gray-500">Loading tasks...</span>
                                    </div>
                                ) : viewingOrderTasks.length === 0 ? (
                                    <p className="text-gray-500 italic">No tasks currently assigned to this order.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {viewingOrderTasks.map((task) => (
                                            <div key={task.id} className="p-3 border rounded-lg bg-white shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-semibold">{task.task_description || `Task #${task.id}`}</p>
                                                    <Badge variant="secondary" className={`capitalize flex-shrink-0 ${getTaskStatusColor(task.status)}`}>
                                                        {task.status}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-gray-600 mt-1 space-y-1">
                                                    <p className="flex items-center"><User className="h-3 w-3 mr-1" /> Assigned to: {task.assigned_to?.staff_name || 'N/A'}</p>
                                                    <p className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> Due: {task.completion_time ? new Date(task.completion_time).toLocaleDateString() : "TBD"}</p>
                                                </div>
                                                <div className="mt-2 text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => handleOpenEditModal(task)}
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
                </DialogContent>
            </Dialog>

            {/* RENDER THE NEW IMAGE MANAGER DIALOG */}
            {selectedProjectForImages && (
                <ProjectImageManagerDialog
                    order={selectedProjectForImages}
                    onClose={() => setSelectedProjectForImages(null)}
                />
            )}

            <Toaster />
        </DashboardLayout>
    )
}
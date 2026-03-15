"use client"
import { useState, useEffect, useMemo, useCallback } from "react"
// Core layout and UI imports
import { DashboardLayout } from "../dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { StaffForm } from "@/components/staff-form"
import { ApiClient, type StaffMember } from "@/lib/api" // Assuming ApiClient provides getStaff
// Mobile menu and task imports
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"
// Admin API and forms 
import { 
    getOrders, 
    getActiveStaffs, 
    getAllTasks,
    getOrder, 
    getTasksByOrder, 
    updateOrder,
    type Order, 
    type Staff,
    type DetailedTask,
    type OrderById, 
} from "@/lib/admin" 
import { Input } from "@/components/ui/input"
import { EditTaskForm } from "@/components/edit-task-form"
import { AssignTaskForm } from "@/components/assign-task-form-admin" 
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
// Separated tab components 
import { StaffManagementPage } from "./admin-tabs/user-tab-content"
import { TaskManagementPage } from "./admin-tabs/tasks-tab-content"
import { ProjectManagementPage, ProjectDetailsDialog } from "./admin-tabs/order-tab-content"
// NEW IMPORTS: Attendance and Expenses
import { AttendanceManagementPage } from "./admin-tabs/attendance-tab-content"
import { AdminFinancialsPage  } from "./admin-tabs/expenses-tab-content"


import {
    Users,
    BarChart3,
    Activity,
    TrendingUp,
    CheckCircle,
    Package,
    Edit,
    Trash2,
    Plus,
    Search,
    Filter,
    Eye,
    FolderOpen,
    CheckSquare,
    Calendar,
    User,
    UserPlus,
    AlertTriangle,
    Loader2,
    DollarSign, 
    ListChecks,
    IndianRupee, Phone, MessageSquare, CreditCard, Truck, Image as ImageIcon, Repeat2
} from "lucide-react"


// =============================================================
// --- MOCK API DEFINITIONS (FOR ADVANCED MODALS) ---
// =============================================================

interface OrderImage {
    id: number;
    image_url: string;
    description: string | null;
    created_at: string;
}

const MOCK_ORDER_IMAGES: OrderImage[] = [
    { id: 10, image_url: "https://via.placeholder.com/300?text=Design+Draft", description: "Initial Design Draft", created_at: "2024-05-01T00:00:00Z" },
    { id: 11, image_url: "https://via.placeholder.com/300?text=Production+Proof", description: "Final Production Proof", created_at: "2024-05-10T00:00:00Z" },
];

const getOrderImages = async (orderId: number): Promise<OrderImage[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (orderId % 2 !== 0) return MOCK_ORDER_IMAGES;
    return []; // Return empty for some orders
};



// --- TYPE EXTENSION FOR FRONTEND USE ---
type OrderWithGeneratedId = Order & { 
    generated_order_id?: string | null; 
    product_name?: string | null;
    total_amount?: number | null;
    amount?: number | null;
    completion_date?: string | null;
    created_by_staff_name?: string | null;
    created_on?: string; 
};


// --- UTILITY FUNCTIONS ---
const getOrderStatusColor = (status?: string | null) => {
    const s = status?.toLowerCase();
    switch (s) {
        case 'completed': return 'bg-green-100 text-green-800'
        case 'inprogress': case 'in_progress': return 'bg-blue-100 text-blue-800'
        case 'pending': return 'bg-yellow-100 text-yellow-800'
        case 'cancelled': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
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

// NOTE: formatINR removed as it's now in expenses-tab-content.tsx

// =============================================================
// MODALS (Kept here as they rely on AdminDashboard state)
// =============================================================

const ORDER_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled'];

interface StatusUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderWithGeneratedId | null;
    onSave: () => void;
    isUpdating: boolean;
    // States controlled by parent
    newStatus: string;
    setNewStatus: (status: string) => void;
    generatedOrderIdInput: string;
    setGeneratedOrderIdInput: (id: string) => void;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({ 
    isOpen, onClose, order, onSave, isUpdating, newStatus, setNewStatus, generatedOrderIdInput, setGeneratedOrderIdInput
}) => {
    
    if (!order) return null;

    const currentStatus = order.status === 'inprogress' ? 'in_progress' : order.status;
    
    const isGeneratedIdRequired = 
        newStatus === 'in_progress' && 
        !order.generated_order_id;
        
    const isDisabled = isUpdating || newStatus === currentStatus;
    

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center"><Repeat2 className="h-5 w-5 mr-2" /> Update Status for Project #{order.id}</DialogTitle>
                    <DialogDescription>
                        Customer: {order.customer_name || 'N/A'}. Product: {order.product_name || 'N/A'}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <p className="font-medium">
                        Current Status: <Badge className={getOrderStatusColor(order.status)}>
                            {order.status?.replace(/_/g, ' ') || 'Pending'}
                        </Badge>
                    </p>
                    
                    <Select value={newStatus} onValueChange={setNewStatus} disabled={isUpdating}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select New Status" />
                        </SelectTrigger>
                        <SelectContent>
                            {ORDER_STATUSES.map(status => (
                                <SelectItem key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    {/* CONDITIONAL GENERATED ORDER ID INPUT */}
                    {isGeneratedIdRequired && (
                        <div className="flex flex-col space-y-2 mt-4 p-3 bg-red-50 rounded-md border border-red-200">
                            <label htmlFor="generated-id" className="text-sm font-medium text-red-700">
                                <AlertTriangle className="h-4 w-4 inline mr-1" /> Generated Order ID (Required to start project)
                            </label>
                            <Input
                                id="generated-id"
                                value={generatedOrderIdInput}
                                onChange={(e) => setGeneratedOrderIdInput(e.target.value)}
                                placeholder="Enter external system order ID (e.g., SO-1234)"
                                disabled={isUpdating}
                            />
                        </div>
                    )}
                    
                    {/* Show existing ID if status is 'in_progress' and it exists */}
                    {(newStatus === 'in_progress' && order.generated_order_id && !isGeneratedIdRequired) && (
                        <div className="text-sm text-gray-600">
                            Existing Generated ID: <span className="font-semibold text-blue-700">{order.generated_order_id}</span>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isUpdating}>Cancel</Button>
                    <Button 
                        onClick={onSave} 
                        disabled={isDisabled || (isGeneratedIdRequired && !generatedOrderIdInput.trim())}
                    >
                        {isUpdating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Status"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


interface ImageUploadModalProps { 
    isOpen: boolean;
    onClose: () => void;
    order: OrderWithGeneratedId | null; 
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, order }) => {
    const [images, setImages] = useState<OrderImage[]>([]); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const orderId = order?.id;

    const fetchImages = useCallback(async () => {
        if (!orderId) return;
        setIsLoading(true);
        setError('');
        try {
            const fetchedImages = await getOrderImages(orderId); 
            setImages(fetchedImages);
        } catch (err) {
            setError(`Failed to load images: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchImages();
        } else {
            setImages([]);
            setError('');
        }
    }, [isOpen, orderId, fetchImages]);
    
    const handleDownload = (imageUrl: string, description: string | null, index: number) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const filename = `${order?.generated_order_id || `Project-${order?.id}`}-${(description || `Image-${index + 1}`).replace(/\s/g, '_')}.jpg`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!order || !isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
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
// DUMMY DATA AND ATTENDANCE/EXPENSE COMPONENTS (REMOVED/REPLACED)
// =============================================================

// System metrics calculation
const getSystemMetrics = (staff: StaffMember[], orders: Order[], tasks: DetailedTask[]) => {
    const activeStaffCount = staff.filter(s => s.status === 'active').length
    const activeOrders = orders.filter(o => o.status === 'inprogress' || o.status === 'pending').length
    const totalTasks = tasks.length


    return [
        { name: "Total Staff", value: staff.length.toString(), change: "+5%", icon: Users },
        { name: "Active Staff", value: activeStaffCount.toString(), change: "+2%", icon: CheckCircle },
        { name: "Active Orders", value: activeOrders.toString(), change: "+3", icon: Package },
        { name: "Total Tasks", value: totalTasks.toString(), change: "+8", icon: CheckSquare },
        { name: "System Status", value: "Online", change: "100%", icon: Activity },
    ]
}


// Navigation items
const navItems = [
    { value: "overview", label: "Overview", icon: BarChart3 },
    { value: "users", label: "User Management", icon: Users },
    { value: "orders", label: "Project Management", icon: FolderOpen }, // Renamed "Orders" to "Project Management"
    { value: "tasks", label: "Tasks", icon: CheckSquare },
    { value: "attendance", label: "Staff Attendance", icon: Calendar }, 
    { value: "expenses", label: "Daily Reports", icon: DollarSign }, 
    { value: "system", label: "System Health", icon: Activity },
    { value: "reports", label: "Reports", icon: TrendingUp },
]


// Task statuses
const TASK_STATUSES = ['pending', 'assigned', 'inprogress', 'completed'];


// =============================================================
// ADMIN DASHBOARD MAIN COMPONENT
// =============================================================

export function AdminDashboard() {
    // Core state
    const [activeTab, setActiveTab] = useState("overview")
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [isStaffFormOpen, setIsStaffFormOpen] = useState(false)
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create')


    // Orders and tasks state
    const [orders, setOrders] = useState<Order[]>([])
    const [tasks, setTasks] = useState<DetailedTask[]>([])
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [searchTerm, setSearchTerm] = useState("") // Search term for Orders/Projects


    // Task filter state
    const [taskSearchTerm, setTaskSearchTerm] = useState("")
    const [taskStaffFilterName, setTaskStaffFilterName] = useState("all")
    const [taskStatusFilter, setTaskStatusFilter] = useState("all")
    const [taskFromDate, setTaskFromDate] = useState("")
    const [taskToDate, setTaskToDate] = useState("")
    const [isTaskFilterOpen, setIsTaskFilterOpen] = useState(false)


    // Modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
    const [selectedProjectForAssign, setSelectedProjectForAssign] = useState<Order | null>(null)
    
    const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
    const [selectedTaskForEdit, setSelectedTaskForEdit] = useState<DetailedTask | null>(null)
    
    // Status/Image Modals
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedOrderForStatus, setSelectedOrderForStatus] = useState<OrderWithGeneratedId | null>(null);
    const [isStatusUpdating, setIsStatusUpdating] = useState(false); 
    const [newStatus, setNewStatus] = useState(''); 
    const [generatedOrderIdInput, setGeneratedOrderIdInput] = useState(''); 

    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedOrderForImages, setSelectedOrderForImages] = useState<OrderWithGeneratedId | null>(null);

    // Order Details State
    const [viewingOrder, setViewingOrder] = useState<OrderById | null>(null)
    const [viewingOrderTasks, setViewingOrderTasks] = useState<DetailedTask[]>([])
    const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false)
    const { toast } = useToast()


    // Data loading
    const loadData = async () => {
        try {
            setIsLoading(true)
            setError('')


            const [staffData, ordersData, tasksData, staffListData] = await Promise.all([
                ApiClient.getStaff(), 
                getOrders(),
                getAllTasks(),
                getActiveStaffs()
            ])


            setStaff(staffData || [])
            
            const resolvedOrders = Array.isArray(ordersData) 
                ? ordersData 
                : (ordersData && ordersData.data) ? ordersData.data : [];
            setOrders(resolvedOrders);


            const resolvedTasks = Array.isArray(tasksData) 
                ? tasksData 
                : (tasksData && tasksData.data) ? tasksData.data : [];
            setTasks(resolvedTasks);
            
            const resolvedStaffList = staffListData?.data?.staffs || (Array.isArray(staffListData) ? staffListData : []);
            setStaffList(resolvedStaffList as Staff[]);


        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load data')
            console.error('Admin dashboard load error:', err)
        } finally {
            setIsLoading(false)
        }
    }
    
    useEffect(() => {
        loadData()
    }, [])


    const reloadData = useCallback(async () => {
        await loadData()
    }, [])


    // Staff handlers (minimal inclusion)
    const handleAddStaff = () => {
        setEditingStaff(null)
        setFormMode('create')
        setIsStaffFormOpen(true)
    }


    const handleEditStaff = (staffMember: StaffMember) => {
        setEditingStaff(staffMember)
        setFormMode('edit')
        setIsStaffFormOpen(true)
    }

    const handleDeleteStaff = async (id: number) => {
        try {
            await reloadData()
            toast({ title: "Success", description: `Staff #${id} deleted (Simulated).`, variant: "default" });
        } catch (err) {
            toast({ title: "Error", description: 'Failed to delete staff member', variant: "destructive" });
        }
    }


    const handleStaffFormSuccess = () => {
        setIsStaffFormOpen(false)
        reloadData()
    }


    // Task handlers
    const handleOpenAssignModal = (order: Order) => {
        setSelectedProjectForAssign(order) 
        setIsAssignModalOpen(true) 
    }


    const handleAssignTaskSuccess = () => {
        setIsAssignModalOpen(false)
        setSelectedProjectForAssign(null) 
        reloadData()
    }


    const handleOpenEditTaskModal = (task: DetailedTask) => {
        setSelectedTaskForEdit(task)
        setIsEditTaskModalOpen(true)
    }


    const handleEditTaskSuccess = () => {
        setIsEditTaskModalOpen(false)
        setSelectedTaskForEdit(null)
        reloadData()
        // If viewing project details, re-fetch tasks for that project
        if (viewingOrder?.id) {
            handleViewProject({ id: viewingOrder.id } as Order)
        }
    }

    // Status Update Handlers
    const handleOpenStatusUpdateModal = (order: OrderWithGeneratedId) => {
        setSelectedOrderForStatus(order);
        setNewStatus(order.status === 'inprogress' ? 'in_progress' : order.status || 'pending');
        setGeneratedOrderIdInput(order.generated_order_id || '');
        setIsStatusModalOpen(true);
    };
    
    const handleStatusUpdate = async () => {
        if (!selectedOrderForStatus || !newStatus) return;

        const isStartingInProgress = 
            newStatus === 'in_progress' && 
            !selectedOrderForStatus.generated_order_id;
            
        if (isStartingInProgress && !generatedOrderIdInput.trim()) {
            toast({
                title: "Validation Required",
                description: "Please provide the Generated Order ID before starting the project ('in progress').",
                variant: "destructive",
            });
            return;
        }

        setIsStatusUpdating(true);
        
        const projectId = selectedOrderForStatus.id;
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
        
        if (isStartingInProgress && generatedOrderIdInput.trim()) {
            payload.generated_order_id = generatedOrderIdInput.trim();
        } else if (selectedOrderForStatus.generated_order_id) {
            payload.generated_order_id = selectedOrderForStatus.generated_order_id;
        }

        try {
            // Store the response from the actual API call
            const response = await updateOrder(projectId, payload); 
            
            // Handle error logic if returned
            if (response.error) {
                toast({ 
                    title: "Status Update Failed", 
                    description: response.error, 
                    variant: "destructive" 
                });
            } else {
                toast({ 
                    title: "Success", 
                    description: `Project #${projectId} status updated to ${newStatus}.`, 
                    variant: "default" 
                });
    
                setIsStatusModalOpen(false);
                setGeneratedOrderIdInput('');
                setSelectedOrderForStatus(null); // Clear the selection
                await reloadData(); 
            }
        } catch (e) {
            toast({ 
                title: "Error", 
                description: `Failed to update status: ${e instanceof Error ? e.message : 'Unknown error'}.`, 
                variant: "destructive" 
            });
        } finally {
            setIsStatusUpdating(false);
        }
    }


    // Image Modal Handler
    const handleOpenImageModal = (order: OrderWithGeneratedId) => {
        setSelectedOrderForImages(order);
        setIsImageModalOpen(true); 
    };


    // Project Details Handler
    const handleViewProject = async (order: Order) => {
        setViewingOrder(null);
        setViewingOrderTasks([]);
        setIsOrderDetailsLoading(true);
        
        try {
            const detailedOrderResult = await getOrder(order.id);
            const tasksResult = await getTasksByOrder(order.id); 
            
            setViewingOrder(detailedOrderResult.data || detailedOrderResult);
            setViewingOrderTasks(Array.isArray(tasksResult) ? tasksResult : tasksResult.data || []);
        } catch (e) {
            console.error("Failed to load project details:", e);
            toast({
                title: "Error",
                description: "Failed to load detailed project information.",
                variant: "destructive"
            });
            setViewingOrder(null);
        } finally {
            setIsOrderDetailsLoading(false);
        }
    };

    const onCloseViewProject = () => {
        setViewingOrder(null);
        setViewingOrderTasks([]);
    };


    const handleDeleteProject = async (id: number) => {
        try {
            // Implement API call here
            toast({ title: "Success", description: `Project #${id} deleted successfully (Simulation).`, variant: "default" });
            reloadData();
        } catch (e) {
            toast({ title: "Error", description: "Failed to delete project.", variant: "destructive" });
        }
    };
    
    // Filtering logic 
    // Note: This simple filtering remains in AdminDashboard
    const filteredOrders = orders.filter(order =>
        (order.description && order.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.product_name && order.product_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.id && order.id.toString().includes(searchTerm)) ||
        (order.generated_order_id && order.generated_order_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.status && order.status.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    // Task filtering remains simple here, full filtering logic is deferred to TaskManagementPage
    const filteredTasks = tasks.filter(task => { 
        const matchesSearch =
            (task.task_description?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
            task.assigned_to?.staff_name?.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
            task.order_id?.toString().includes(taskSearchTerm))
            
        const matchesStatus = taskStatusFilter === 'all' || task.status?.toLowerCase() === taskStatusFilter.toLowerCase()
        
        return matchesSearch && matchesStatus 
    })
    
    // Metrics
    const systemMetrics = getSystemMetrics(staff, orders, tasks)


    // Task filters renderer (Kept here as a function to be passed to TaskManagementPage)
    const renderTaskFilters = (isMobile: boolean) => (
        <>
            <div className="relative flex-1 min-w-[150px]">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                    placeholder="Search tasks, staff, or order ID..." 
                    className="pl-10" 
                    value={taskSearchTerm}
                    onChange={(e) => setTaskSearchTerm(e.target.value)}
                />
            </div>

            <Select value={taskStaffFilterName} onValueChange={setTaskStaffFilterName} disabled={isLoading}>
                <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                    <SelectValue placeholder="Assigned Staff" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {staff.map(s => (<SelectItem key={s.id} value={s.staff_name}>{s.staff_name}</SelectItem>))}
                </SelectContent>
            </Select>

            <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="w-full md:w-[150px] flex-shrink-0">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {TASK_STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Input
                type="date"
                placeholder="Due From Date"
                value={taskFromDate}
                onChange={(e) => setTaskFromDate(e.target.value)}
                className="w-full md:w-[150px] flex-shrink-0"
            />
            <Input
                type="date"
                placeholder="Due To Date"
                value={taskToDate}
                onChange={(e) => setTaskToDate(e.target.value)}
                className="w-full md:w-[150px] flex-shrink-0"
            />
        </>
    )


    return (
        <DashboardLayout title="Admin Dashboard" role="admin">
            <main className="flex-1 space-y-6 p-4 overflow-y-auto">
                
                {isLoading && activeTab !== 'tasks' && activeTab !== 'orders' ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-sm text-gray-500">Loading dashboard...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Error Display */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                                    <p className="text-sm text-red-600">{error}</p>
                                </div>
                            </div>
                        )}

                        
                        <Tabs 
                            value={activeTab} 
                            onValueChange={setActiveTab} 
                            className="flex flex-col md:flex-row gap-6"
                        >
                            
                            {/* Vertical Tabs List */}
                            <TabsList className="hidden md:flex flex-col p-2 h-auto space-y-1 bg-white border rounded-xl min-w-[200px] self-start shadow-xl">
                                {navItems.map((item) => {
                                    const Icon = item.icon
                                    return (
                                        <TabsTrigger 
                                            key={item.value} 
                                            value={item.value} 
                                            className="w-full justify-start data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-sm data-[state=active]:font-semibold rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                                        >
                                            <Icon className="h-4 w-4 mr-3" />
                                            {item.label}
                                        </TabsTrigger>
                                    )
                                })}
                            </TabsList>
                            
                            {/* Content Wrapper */}
                            <div className="flex-1 min-w-0 h-[calc(100vh-150px)] overflow-y-auto">
                                
                                {/* Overview Tab (Unchanged) */}
                                <TabsContent value="overview" className="mt-0 space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center"><BarChart3 className="h-5 w-5 mr-2" /> System Overview</CardTitle>
                                            <CardDescription>Key metrics for operations and staffing.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                                {systemMetrics.map((metric) => {
                                                    const Icon = metric.icon
                                                    return (
                                                        <Card key={metric.name} className="p-3">
                                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                                                                <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                            </CardHeader>
                                                            <CardContent className="p-0 pt-2">
                                                                <div className="text-2xl font-bold">{metric.value}</div>
                                                                <p className="text-xs text-green-600 flex items-center">
                                                                    <TrendingUp className="h-3 w-3 mr-1" /> {metric.change}
                                                                </p>
                                                            </CardContent>
                                                        </Card>
                                                    )
                                                })}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>


                                {/* User Management Tab */}
                                <TabsContent value="users" className="mt-0 space-y-6">
                                    <StaffManagementPage
                                        staff={staff}
                                        isLoading={isLoading}
                                        error={error}
                                        onAddStaff={handleAddStaff}
                                        onEditStaff={handleEditStaff}
                                        onDeleteStaff={handleDeleteStaff}
                                    />
                                </TabsContent>


                                {/* Project Management Tab (Refactored) */}
                                <TabsContent value="orders" className="mt-0 space-y-6">
                                    <ProjectManagementPage
                                        orders={filteredOrders as OrderWithGeneratedId[]}
                                        tasks={tasks} // Kept for prop matching, though not used in ProjectManagementPage's current logic
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        isLoading={isLoading}
                                        
                                        handleOpenAssignModal={handleOpenAssignModal}
                                        handleViewProject={handleViewProject}
                                        viewingOrder={viewingOrder}
                                        viewingOrderTasks={viewingOrderTasks}
                                        isOrderDetailsLoading={isOrderDetailsLoading}
                                        onCloseViewProject={onCloseViewProject}
                                        handleOpenEditTaskModal={handleOpenEditTaskModal} 

                                        handleOpenStatusUpdateModal={handleOpenStatusUpdateModal}
                                        handleOpenImageModal={handleOpenImageModal}
                                        handleDeleteProject={handleDeleteProject}
                                    />
                                </TabsContent>


                                {/* Tasks Tab */}
                                <TabsContent value="tasks" className="mt-0 space-y-6">
                                    <TaskManagementPage
                                        tasks={filteredTasks}
                                        taskSearchTerm={taskSearchTerm}
                                        setTaskSearchTerm={setTaskSearchTerm}
                                        taskStaffFilterName={taskStaffFilterName}
                                        taskStatusFilter={taskStatusFilter}
                                        taskFromDate={taskFromDate}
                                        taskToDate={taskToDate}
                                        setTaskStaffFilterName={setTaskStaffFilterName}
                                        setTaskStatusFilter={setTaskStatusFilter}
                                        setTaskFromDate={setTaskFromDate}
                                        setTaskToDate={setTaskToDate}
                                        isTaskFilterOpen={isTaskFilterOpen}
                                        setIsTaskFilterOpen={setIsTaskFilterOpen}
                                        staff={staff as Staff[]} 
                                        isLoading={isLoading}
                                        onOpenEditTaskModal={handleOpenEditTaskModal}
                                        onViewOrder={(orderId: number) => {
                                            setSearchTerm(orderId.toString())
                                            setActiveTab('orders')
                                        }}
                                        getTaskStatusColor={getTaskStatusColor}
                                        TASK_STATUSES={TASK_STATUSES}
                                        renderTaskFilters={renderTaskFilters}
                                    />
                                </TabsContent>


                                {/* Staff Attendance Tab (NOW IMPORTED) */}
                                <TabsContent value="attendance" className="mt-0 space-y-6">
                                    <AttendanceManagementPage />
                                </TabsContent>


                                {/* Daily Expenses Tab (NOW IMPORTED) */}
                                <TabsContent value="expenses" className="mt-0 space-y-6">
                                    <AdminFinancialsPage  />
                                </TabsContent>


                                {/* System Tab */}
                                <TabsContent value="system" className="mt-0 space-y-6">
                                    {/* Placeholder */}
                                    <Card><CardHeader><CardTitle>System Health</CardTitle></CardHeader><CardContent>System monitoring details.</CardContent></Card>
                                </TabsContent>


                                {/* Reports Tab */}
                                <TabsContent value="reports" className="mt-0 space-y-6">
                                    {/* Placeholder */}
                                    <Card><CardHeader><CardTitle>Reports</CardTitle></CardHeader><CardContent>Detailed business reports.</CardContent></Card>
                                </TabsContent>
                            </div>
                        </Tabs>
                    </>
                )}


                {/* Shared Modals */}
                <StaffForm
                    isOpen={isStaffFormOpen}
                    onClose={() => setIsStaffFormOpen(false)}
                    onSuccess={handleStaffFormSuccess}
                    staff={editingStaff}
                    mode={formMode}
                />


                {/* ASSIGN TASK MODAL */}
                <AssignTaskForm
                    isOpen={isAssignModalOpen}
                    onClose={() => setIsAssignModalOpen(false)}
                    onSuccess={handleAssignTaskSuccess}
                    project={selectedProjectForAssign} 
                    staffList={staffList}
                />


                <EditTaskForm
                    isOpen={isEditTaskModalOpen}
                    onClose={() => setIsEditTaskModalOpen(false)}
                    onSuccess={handleEditTaskSuccess}
                    task={selectedTaskForEdit}
                />
                
                {/* STATUS UPDATE MODAL (Defined in this file) */}
                <StatusUpdateModal
                    isOpen={isStatusModalOpen}
                    onClose={() => setIsStatusModalOpen(false)}
                    order={selectedOrderForStatus}
                    onSave={handleStatusUpdate}
                    isUpdating={isStatusUpdating}
                    newStatus={newStatus}
                    setNewStatus={setNewStatus}
                    generatedOrderIdInput={generatedOrderIdInput}
                    setGeneratedOrderIdInput={setGeneratedOrderIdInput}
                />
                
                {/* IMAGE MODAL (Defined in this file) */}
                <ImageUploadModal
                    isOpen={isImageModalOpen}
                    onClose={() => setIsImageModalOpen(false)}
                    order={selectedOrderForImages}
                />
                
                {/* PROJECT DETAILS DIALOG (Now imported from project-management-page) */}
                <ProjectDetailsDialog 
                    viewingOrder={viewingOrder}
                    viewingOrderTasks={viewingOrderTasks}
                    isOrderDetailsLoading={isOrderDetailsLoading}
                    onClose={onCloseViewProject}
                    onEditTask={handleOpenEditTaskModal} 
                />


                <Toaster />
            </main>
        </DashboardLayout>
    )
}
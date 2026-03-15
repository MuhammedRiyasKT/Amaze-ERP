"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog" 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// API client and types:
import { 
  getAllTasks, 
  editTask, 
  type DetailedTask, 
  type EditTaskPayload,
  
  // Imported from "@/lib/designer"
  getOrderById, 
  type OrderDetails,
  type ApiResponse,
  type OrderImage, 
  getOrderImages 
} from "@/lib/designer" 

import {
  Palette,
  ImageIcon,
  CheckCircle,
  Clock, 
  TrendingUp,
  MessageSquare,
  Calendar, 
  Loader2, 
  AlertCircle, 
  CheckSquare, 
  UserPlus, 
  FolderOpen, 
  IndianRupee, 
  Phone,       
  CreditCard,  
  Truck,       
  Package,     
  Eye, 
  Filter,      
  XCircle,     
  Hourglass, 
  Check as CheckIcon, 
  Lightbulb,
  ArrowRight,
  Download,
  Image as ImageOutline
} from "lucide-react"

// =============================================================
// IMAGE MANAGER DIALOG (Beginner Friendly)
// =============================================================

interface ProjectImageManagerProps {
    order: OrderDetails; 
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl">
                <DialogHeader className="bg-blue-50 -mx-6 -mt-6 p-6 border-b border-blue-100 mb-4 rounded-t-xl">
                    <DialogTitle className="flex items-center text-blue-900 text-xl">
                        <ImageOutline className="w-6 h-6 mr-3 text-blue-600" /> 
                        Reference Images for this Project
                    </DialogTitle>
                    <DialogDescription className="text-blue-700 mt-2">
                        Review these images to understand what the customer wants. You can download them to use in your design software.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200 flex items-center mb-4">
                        <AlertCircle className="w-5 h-5 mr-2" />
                        {error}
                    </div>
                )}
                
                <div>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <Loader2 className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">Fetching customer files...</p>
                        </div>
                    ) : images.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-gray-900">No Reference Images</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-1">The customer or sales team hasn't uploaded any reference images for this specific project yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {images.map((img, index) => (
                                <Card key={img.id} className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="aspect-square w-full bg-gray-100 relative">
                                        <img 
                                            src={img.image_url} 
                                            alt={img.description || `Project Image ${img.id}`} 
                                            className="w-full h-full object-cover" 
                                        />
                                        <div className="absolute inset-0 bg-gray-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-4 gap-3 backdrop-blur-sm">
                                            <a href={img.image_url} target="_blank" rel="noopener noreferrer" className="w-full">
                                                <Button variant="secondary" className="w-full bg-white hover:bg-gray-100 text-gray-900">
                                                    <Eye className="h-4 w-4 mr-2" /> View Full Size
                                                </Button>
                                            </a>
                                            <Button 
                                                variant="default" 
                                                className="w-full bg-blue-600 hover:bg-blue-500"
                                                onClick={() => handleDownload(img.image_url, img.description, index)}
                                            >
                                                <Download className="h-4 w-4 mr-2" /> Download File
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white">
                                        <p className="font-medium text-gray-800 line-clamp-1" title={img.description || `Attachment ${img.id}`}>
                                            {img.description || `Attachment ${img.id}`}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            Added {new Date(img.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-6 mt-6 border-t border-gray-100">
                    <Button variant="outline" className="px-8" onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Helper Functions ---

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
    case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'assigned': return 'bg-amber-100 text-amber-800 border-amber-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getTaskFriendlyStatus = (status?: string | null) => {
    switch (status) {
      case 'completed': return 'Done'
      case 'in_progress': return 'Working on it'
      case 'assigned': return 'New Task'
      default: return 'Unknown'
    }
  }

const getPaymentStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    let color = 'bg-gray-100 text-gray-800';
    let label = status;

    if (lowerStatus === 'paid' || lowerStatus === 'completed') {
        color = 'bg-green-100 text-green-800 border-green-200';
    } else if (lowerStatus === 'pending' || lowerStatus === 'unpaid') {
        color = 'bg-red-100 text-red-800 border-red-200';
    } else if (lowerStatus === 'partial') {
        color = 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }

    return <Badge variant="outline" className={`capitalize ${color}`}>{label.replace(/_/g, ' ')}</Badge>;
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


// --- Reusable Filter Controls Component ---
interface FilterControlsProps {
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    filterAssignedDateFrom: string;
    setFilterAssignedDateFrom: (date: string) => void;
    filterCompletionDateTo: string;
    setFilterCompletionDateTo: (date: string) => void;
    filterProjectTargetDateTo: string;
    setFilterProjectTargetDateTo: (date: string) => void;
    
    handleClearFilters: () => void;
    isFilterActive: boolean;
    isMobile?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    filterStatus, setFilterStatus,
    filterAssignedDateFrom, setFilterAssignedDateFrom,
    filterCompletionDateTo, setFilterCompletionDateTo,
    filterProjectTargetDateTo, setFilterProjectTargetDateTo,
    handleClearFilters, isFilterActive, isMobile = false
}) => (
    <div className={`flex flex-wrap items-end gap-4 ${isMobile ? 'flex-col items-stretch' : ''}`}>
        
        <div className={`flex flex-col gap-1.5 ${isMobile ? 'w-full' : 'w-[160px] flex-shrink-0'}`}>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Task Status</label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-10">
                    <SelectValue placeholder="All Tasks" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Tasks</SelectItem>
                    <SelectItem value="assigned">New (Assigned)</SelectItem>
                    <SelectItem value="in_progress">Working on it</SelectItem>
                    <SelectItem value="completed">Done</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className={`flex flex-col gap-1.5 ${isMobile ? 'w-full' : 'w-[180px] flex-shrink-0'}`}>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Given to me after</label>
            <Input type="date" className="h-10" value={filterAssignedDateFrom} onChange={(e) => setFilterAssignedDateFrom(e.target.value)} />
        </div>

        <div className={`flex flex-col gap-1.5 ${isMobile ? 'w-full' : 'w-[180px] flex-shrink-0'}`}>
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">I finished before</label>
            <Input type="date" className="h-10" value={filterCompletionDateTo} onChange={(e) => setFilterCompletionDateTo(e.target.value)} />
        </div>
        
        {/* Clear Button */}
        {(isFilterActive || isMobile) && (
            <Button 
                variant="ghost" 
                onClick={handleClearFilters} 
                className={`${isMobile ? 'w-full mt-4' : 'mt-auto h-10'} text-red-600 hover:text-red-700 hover:bg-red-50`}
            >
                <XCircle className="h-4 w-4 mr-2" />
                Clear Filters
            </Button>
        )}
    </div>
);


export function DesignerDashboard() {
  const { toast } = useToast()

  const [tasks, setTasks] = useState<DetailedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const[updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)
  
  const[viewingOrder, setViewingOrder] = useState<OrderDetails | null>(null)
  const[isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false)
  const [selectedOrderForImages, setSelectedOrderForImages] = useState<OrderDetails | null>(null);
  
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignedDateFrom, setFilterAssignedDateFrom] = useState<string>(''); 
  const [filterCompletionDateTo, setFilterCompletionDateTo] = useState<string>(''); 
  const [filterProjectTargetDateTo, setFilterProjectTargetDateTo] = useState<string>(''); 
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); 


  useEffect(() => {
    loadTasks()
  },[])

  const loadTasks = async () => {
    setIsLoading(true)
    setError(null)
    const response = await getAllTasks()

    if (response.error) {
      setError(response.error)
    } else if (response.data) {
      setTasks(response.data)
    }
    setIsLoading(false)
  }
  
  const handleViewOrder = async (orderId: number) => {
    setViewingOrder(null);
    setIsOrderDetailsLoading(true);
    const response = await getOrderById(orderId);
    
    if (response.data) {
        setViewingOrder(response.data);
    } else {
        toast({ title: "Error", description: "Could not open order details.", variant: "destructive" });
    }
    setIsOrderDetailsLoading(false);
  }

  const handleOpenImageModal = (order: OrderDetails) => {
    setSelectedOrderForImages(order);
  };
  
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId)
    const payload: EditTaskPayload = { status: newStatus }
    const response = await editTask(taskId, payload)

    if (response.error) {
      toast({ variant: "destructive", title: "Oops!", description: "Something went wrong saving that." })
    } else {
      toast({ title: "Great job!", description: `Task has been updated to "${getTaskFriendlyStatus(newStatus)}".` })
      loadTasks() 
    }
    setUpdatingTaskId(null)
  }

  const getFilteredTasks = useMemo(() => {
    if (!tasks) return[];
    let filtered = tasks;

    if (filterStatus !== 'all') {
        filtered = filtered.filter(task => task.status === filterStatus);
    }

    if (filterAssignedDateFrom) {
        const filterDate = new Date(filterAssignedDateFrom);
        filterDate.setHours(0, 0, 0, 0); 
        filtered = filtered.filter(task => {
            if (!task.assigned_on) return false;
            return new Date(task.assigned_on).getTime() >= filterDate.getTime();
        });
    }
    
    if (filterCompletionDateTo) {
        const filterDate = new Date(filterCompletionDateTo);
        filterDate.setHours(23, 59, 59, 999); 
        filtered = filtered.filter(task => {
            const completionDateStr = task.completion_time || task.completed_on; 
            if (task.status !== 'completed' || !completionDateStr) return false;
            return new Date(completionDateStr).getTime() <= filterDate.getTime();
        });
    }

    if (filterProjectTargetDateTo) {
        const filterDate = new Date(filterProjectTargetDateTo);
        filterDate.setHours(23, 59, 59, 999); 
        filtered = filtered.filter(task => {
            if (!task.order_completion_date) return false;
            return new Date(task.order_completion_date).getTime() <= filterDate.getTime();
        });
    }

    return filtered;
  }, [tasks, filterStatus, filterAssignedDateFrom, filterCompletionDateTo, filterProjectTargetDateTo]);

  const handleClearFilters = () => {
      setFilterStatus('all');
      setFilterAssignedDateFrom('');
      setFilterCompletionDateTo('');
      setFilterProjectTargetDateTo(''); 
      toast({ description: "Viewing all tasks again." });
  }

  const isFilterActive = filterStatus !== 'all' || filterAssignedDateFrom || filterCompletionDateTo || filterProjectTargetDateTo;

  return (
    <DashboardLayout title="My Workboard" role="designer">

      {/* Beginner-Friendly Onboarding Banner */}
      <Alert className="mb-6 bg-blue-50 border-blue-200 shadow-sm rounded-xl">
          <Lightbulb className="h-6 w-6 text-blue-600" />
          <AlertTitle className="text-blue-900 font-bold text-lg mb-1">Welcome to your Design Workboard!</AlertTitle>
          <AlertDescription className="text-blue-800 text-sm">
              This is where you'll find all your assigned design projects. <br className="hidden md:block"/>
              <strong>The flow is simple:</strong> Find a <Badge variant="outline" className="bg-amber-100 text-amber-800 mx-1 border-amber-200">New Task</Badge>, 
              click <strong>"Accept & Start Work"</strong> when you begin, and click <strong>"Mark as Done"</strong> when you finish.
          </AlertDescription>
      </Alert>

      <Tabs defaultValue="tasks" className="space-y-6"> 
        
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2">
            <Palette className="w-4 h-4 mr-2" /> My Tasks
          </TabsTrigger> 
          <TabsTrigger value="reports" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2">
            <TrendingUp className="w-4 h-4 mr-2" /> My Stats
          </TabsTrigger>
        </TabsList>

        {/* ==================================================================== */}
        {/* STATS SECTION */}
        {/* ==================================================================== */}
        <TabsContent value="reports" className="space-y-6 animate-in fade-in-50">
            <h3 className="text-xl font-bold text-gray-800 mt-4 mb-2">How you're doing this month</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  { name: "Active Projects", value: "8", change: "+2", icon: Palette },
                  { name: "Designs Created", value: "47", "change": "+12", icon: ImageIcon },
                  { name: "Approval Rate", value: "92%", change: "+5%", icon: CheckCircle },
                  { name: "Avg. Turnaround", value: "2.3 days", change: "-0.5", icon: Clock },
                ].map((metric) => {
                    const Icon = metric.icon
                    return (
                        <Card key={metric.name} className="border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 mb-4">
                                    <p className="text-sm font-medium text-gray-500">{metric.name}</p>
                                    <div className="p-2 bg-blue-50 rounded-lg"><Icon className="h-5 w-5 text-blue-600" /></div>
                                </div>
                                <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
                                <p className="text-sm text-green-600 flex items-center font-medium">
                                    <TrendingUp className="h-4 w-4 mr-1" /> {metric.change} this month
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </TabsContent>


        {/* ==================================================================== */}
        {/* LIVE TASK SECTION */}
        {/* ==================================================================== */}
        <TabsContent value="tasks" className="space-y-6 animate-in fade-in-50">
            
            {/* Filter Bar */}
            <div className="hidden md:flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                <div className="flex items-center gap-2 text-gray-700 font-medium whitespace-nowrap mr-6">
                    <Filter className="h-5 w-5 text-gray-400" /> Sort & Filter
                </div>
                <div className="flex-1">
                    <FilterControls 
                        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        filterAssignedDateFrom={filterAssignedDateFrom} setFilterAssignedDateFrom={setFilterAssignedDateFrom}
                        filterCompletionDateTo={filterCompletionDateTo} setFilterCompletionDateTo={setFilterCompletionDateTo}
                        filterProjectTargetDateTo={filterProjectTargetDateTo} setFilterProjectTargetDateTo={setFilterProjectTargetDateTo} 
                        handleClearFilters={handleClearFilters} isFilterActive={isFilterActive} isMobile={false}
                    />
                </div>
            </div>

            <div className="md:hidden">
                <Button variant="outline" onClick={() => setIsMobileFilterOpen(true)} className="w-full bg-white h-12 rounded-xl text-base">
                    <Filter className="h-5 w-5 mr-2 text-blue-600" />
                    {isFilterActive ? `Filters Active - Tap to change` : "Filter Tasks"}
                </Button>
            </div>

            {/* Task Area */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Gathering your tasks...</h3>
                    <p className="text-gray-500">Just a moment</p>
                </div>
            ) : error ? (
                <div className="text-center py-24 bg-red-50 rounded-xl border border-red-100">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-bold text-red-900 mb-2">We couldn't load your tasks</h3>
                    <p className="text-red-700">{error}</p>
                    <Button onClick={loadTasks} className="mt-6 bg-red-600 hover:bg-red-700">Try Again</Button>
                </div>
            ) : tasks.length === 0 ? (
                <div className="text-center py-32 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckSquare className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">You're all caught up!</h3>
                    <p className="text-gray-500 text-lg">You have no tasks assigned to you right now. Take a breather.</p>
                </div>
            ) : getFilteredTasks.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <Filter className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-500 mb-6">None of your tasks match the filters you've applied.</p>
                    <Button variant="outline" onClick={handleClearFilters}>Clear all filters</Button>
                </div>
            ) : (
                <div className="grid gap-6">
                  {getFilteredTasks.map((task) => {
                    const isCompleted = task.status === 'completed';
                    let isOverdue = false;
                    
                    if (!isCompleted && task.completion_time) {
                        const dueDate = new Date(task.completion_time);
                        dueDate.setHours(23, 59, 59, 999); 
                        if (new Date().getTime() > dueDate.getTime()) isOverdue = true;
                    }

                    // Card Styling based on status
                    let borderLeftColor = 'border-l-gray-300';
                    if (task.status === 'assigned') borderLeftColor = 'border-l-amber-400';
                    if (task.status === 'in_progress') borderLeftColor = 'border-l-blue-500';
                    if (task.status === 'completed') borderLeftColor = 'border-l-green-500';
                    
                    if (isOverdue) borderLeftColor = 'border-l-red-500';

                    return (
                        <Card key={task.id} className={`overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-all duration-200 ${borderLeftColor}`}>
                            
                            {/* Card Header: Customer & Due Dates */}
                            <div className="bg-gray-50/80 px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <Badge variant="outline" className={`px-2.5 py-0.5 text-xs font-semibold ${getTaskStatusColor(task.status)}`}>
                                            {getTaskFriendlyStatus(task.status)}
                                        </Badge>
                                        <span className="text-xs font-bold text-gray-400">TASK #{task.id}</span>
                                    </div>
                                    <h2 className="font-bold text-xl text-gray-900 flex items-center">
                                        <UserPlus className="h-5 w-5 mr-2 text-gray-400" />
                                        {task.customer?.name || "Unknown Customer"}
                                    </h2>
                                </div>
                                
                                <div className="flex flex-col sm:items-end gap-1 text-sm bg-white p-2.5 rounded-lg border border-gray-200 shadow-sm">
                                    {task.completion_time && (
                                        <span className={`flex items-center font-medium ${isOverdue ? 'text-red-700' : 'text-gray-700'}`}>
                                            <Hourglass className={`h-4 w-4 mr-1.5 ${isOverdue ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                                            Task Due: {new Date(task.completion_time).toLocaleDateString()}
                                            {isOverdue && <Badge variant="destructive" className="ml-2 h-5 text-[10px] uppercase">Overdue</Badge>}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Card Body: The actual WORK to be done */}
                            <CardContent className="p-0">
                                <div className="grid md:grid-cols-3 gap-0">
                                    
                                    {/* Left: Product & Description */}
                                    <div className="md:col-span-2 p-5 border-b md:border-b-0 md:border-r border-gray-100">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">What you need to design</p>
                                        <h3 className="text-xl font-bold text-blue-900 mb-3 flex items-start gap-2">
                                            <Package className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
                                            {task.order?.product_name || "N/A"}
                                        </h3>
                                        
                                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 text-gray-800 leading-relaxed">
                                            <p className="font-medium mb-1 text-blue-900 flex items-center">
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                Instructions for this task:
                                            </p>
                                            <p className="text-sm">
                                                {task.task_description || "No specific instructions provided. Please check order details or images."}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Actions & Tools */}
                                    <div className="p-5 bg-gray-50/30 flex flex-col justify-center space-y-4">
                                        
                                        <Button 
                                            variant="outline" 
                                            className="w-full justify-start h-12 bg-white hover:bg-purple-50 hover:text-purple-700 border-gray-200 shadow-sm text-base"
                                            onClick={() => {
                                                if(task.order) handleOpenImageModal(task.order as OrderDetails)
                                            }}
                                        >
                                            <ImageIcon className="h-5 w-5 mr-3 text-purple-500" />
                                            See Reference Images
                                        </Button>

                                        <Button 
                                            variant="outline" 
                                            className="w-full justify-start h-12 bg-white hover:bg-gray-100 border-gray-200 shadow-sm text-base text-gray-700"
                                            onClick={() => handleViewOrder(task.order_id)}
                                            disabled={isOrderDetailsLoading}
                                        >
                                            <FolderOpen className="h-5 w-5 mr-3 text-gray-400" />
                                            Read Full Order Info
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>

                            {/* Card Footer: Status Update Button (The Big Action) */}
                            <div className="bg-white p-4 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-sm text-gray-500 flex items-center hidden sm:flex">
                                    <Clock className="w-4 h-4 mr-2" /> Given to you on {new Date(task.assigned_on).toLocaleDateString()}
                                </span>
                                
                                <div className="w-full sm:w-auto">
                                    {task.status === 'assigned' && (
                                        <Button 
                                            onClick={() => handleStatusChange(task.id, 'in_progress')}
                                            disabled={updatingTaskId === task.id}
                                            className="w-full sm:min-w-[200px] h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-md transition-all"
                                        >
                                            {updatingTaskId === task.id ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                                            Accept & Start Work
                                        </Button>
                                    )}

                                    {task.status === 'in_progress' && (
                                        <Button 
                                            onClick={() => handleStatusChange(task.id, 'completed')}
                                            disabled={updatingTaskId === task.id}
                                            className="w-full sm:min-w-[200px] h-12 text-base font-bold bg-green-600 hover:bg-green-700 shadow-md transition-all"
                                        >
                                            {updatingTaskId === task.id ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle className="h-5 w-5 mr-2" />}
                                            I'm Done! Mark as Completed
                                        </Button>
                                    )}

                                    {task.status === 'completed' && (
                                        <div className="w-full sm:min-w-[200px] h-12 flex items-center justify-center bg-gray-100 text-gray-600 rounded-lg border border-gray-200 font-medium">
                                            <CheckIcon className="w-5 h-5 mr-2 text-green-500" /> Task Finished
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    )
                  })}
                </div>
              )}
        </TabsContent>
      </Tabs>
      
      {/* ==================================================================== */}
      {/* MOBILE FILTER DIALOG */}
      {/* ==================================================================== */}
      <Dialog open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <DialogContent className="w-[90vw] max-w-[400px] rounded-2xl">
              <DialogHeader>
                  <DialogTitle className="flex items-center text-xl">
                      <Filter className="h-5 w-5 mr-2 text-blue-600" /> Filter My Tasks
                  </DialogTitle>
                  <DialogDescription>
                      Find specific tasks by changing the options below.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="py-2">
                  <FilterControls 
                      filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                      filterAssignedDateFrom={filterAssignedDateFrom} setFilterAssignedDateFrom={setFilterAssignedDateFrom}
                      filterCompletionDateTo={filterCompletionDateTo} setFilterCompletionDateTo={setFilterCompletionDateTo}
                      filterProjectTargetDateTo={filterProjectTargetDateTo} setFilterProjectTargetDateTo={setFilterProjectTargetDateTo} 
                      handleClearFilters={handleClearFilters} isFilterActive={isFilterActive} isMobile={true} 
                  />
              </div>

              <DialogFooter className="mt-4">
                  <DialogClose asChild>
                      <Button type="button" className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700">
                          Apply Filters & Close
                      </Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>


      {/* ==================================================================== */}
      {/* BEGINNER-FRIENDLY ORDER DETAILS DIALOG */}
      {/* ==================================================================== */}
      <Dialog open={!!viewingOrder || isOrderDetailsLoading} onOpenChange={(open) => { 
          if (!open) { setViewingOrder(null); setIsOrderDetailsLoading(false); } 
      }}>
          <DialogContent className="w-[95vw] max-w-2xl rounded-2xl flex flex-col max-h-[90vh] p-0 overflow-hidden bg-gray-50">
              
              <div className="bg-white p-6 border-b border-gray-200 flex-shrink-0">
                  <DialogTitle className="text-xl flex items-center">
                      <FolderOpen className="w-5 h-5 mr-2 text-gray-400"/> 
                      Order Details {viewingOrder?.generated_order_id ? `(${viewingOrder.generated_order_id})` : ''}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                      Everything you need to know about this specific customer request.
                  </DialogDescription>
              </div>
              
              {isOrderDetailsLoading && !viewingOrder ? (
                  <div className="p-12 flex flex-col items-center flex-grow bg-white">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      <p className="mt-4 text-gray-500 font-medium">Opening order details...</p>
                  </div>
              ) : viewingOrder && (
                  <div className="overflow-y-auto flex-grow p-6 space-y-6">
                      
                      {/* TOP/MOST IMPORTANT: What to build */}
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-5 shadow-sm">
                          <h4 className="font-bold text-blue-900 text-lg mb-4 flex items-center border-b border-blue-100 pb-3">
                              <Package className="w-5 h-5 mr-2 text-blue-600"/> Product & Design Info
                          </h4>
                          
                          <div className="grid sm:grid-cols-2 gap-y-4 gap-x-6">
                              <div>
                                  <span className="text-xs font-bold text-gray-500 uppercase">Product Name</span>
                                  <p className="font-semibold text-gray-900 text-lg leading-tight mt-1">{viewingOrder.product_name || 'N/A'}</p>
                              </div>
                              <div>
                                  <span className="text-xs font-bold text-gray-500 uppercase">Category</span>
                                  <p className="font-medium text-gray-800 mt-1">{viewingOrder.category || 'N/A'}</p>
                              </div>
                              <div>
                                  <span className="text-xs font-bold text-gray-500 uppercase">Order Type</span>
                                  <p className="font-medium text-purple-700 mt-1 capitalize">{viewingOrder.order_type?.replace(/_/g, ' ') || 'N/A'}</p>
                              </div>
                              <div>
                                  <span className="text-xs font-bold text-gray-500 uppercase">Quantity</span>
                                  <p className="font-bold text-gray-900 mt-1">{viewingOrder.quantity || 1} units</p>
                              </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-blue-100">
                              <span className="text-xs font-bold text-gray-500 uppercase">Sales Notes / Description</span>
                              <p className="text-sm mt-1 text-gray-700 bg-white p-3 rounded-lg border border-gray-200 mt-2">
                                  {viewingOrder.description || 'No special instructions from sales.'}
                              </p>
                          </div>
                          
                          {/* BIG BUTTON FOR IMAGES */}
                          <Button 
                              className="w-full mt-4 h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base shadow-sm"
                              onClick={() => handleOpenImageModal(viewingOrder)}
                          >
                              <ImageIcon className="h-5 w-5 mr-2" /> Open Customer Reference Images
                          </Button>
                      </div>

                      {/* SECONDARY: Customer Info */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                          <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                              <UserPlus className="w-4 h-4 mr-2 text-gray-400"/> Customer Details
                          </h4>
                          <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                  <span className="text-xs font-bold text-gray-500 uppercase">Name</span>
                                  <p className="font-semibold text-gray-900 mt-1">{viewingOrder.customer_name || 'N/A'}</p>
                              </div>
                              <div className="flex flex-col gap-2">
                                  {viewingOrder.mobile_number && (
                                      <a href={`tel:${viewingOrder.mobile_number}`} className="flex items-center text-sm font-medium text-blue-600 hover:underline bg-blue-50 w-max px-3 py-1.5 rounded-md">
                                          <Phone className="h-3.5 w-3.5 mr-2" /> Call {viewingOrder.mobile_number}
                                      </a>
                                  )}
                                  {viewingOrder.whatsapp_number && (
                                      <a href={`https://wa.me/91${viewingOrder.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm font-medium text-green-700 hover:underline bg-green-50 w-max px-3 py-1.5 rounded-md">
                                          <MessageSquare className="h-3.5 w-3.5 mr-2" /> WhatsApp {viewingOrder.whatsapp_number}
                                      </a>
                                  )}
                              </div>
                          </div>
                      </div>

                      {/* ADMIN/FINANCIAL INFO: Pushed to bottom as designers rarely need this */}
                      <details className="group bg-white border border-gray-200 rounded-xl shadow-sm">
                          <summary className="font-bold text-gray-700 p-5 cursor-pointer flex justify-between items-center outline-none">
                              <span className="flex items-center"><IndianRupee className="h-4 w-4 mr-2 text-gray-400" /> Billing & Delivery Info (Admin)</span>
                              <span className="text-blue-600 text-sm group-open:hidden">Show</span>
                              <span className="text-gray-500 text-sm hidden group-open:block">Hide</span>
                          </summary>
                          <div className="p-5 pt-0 border-t border-gray-100 mt-1">
                              <div className="grid grid-cols-2 gap-y-4 mt-4 text-sm">
                                  <div><span className="text-gray-500 block">Total Amount</span><span className="font-medium text-gray-900">₹ {(viewingOrder.total_amount || viewingOrder.amount)?.toLocaleString('en-IN') || '0.00'}</span></div>
                                  <div><span className="text-gray-500 block">Payment Status</span>{getPaymentStatusBadge(viewingOrder.payment_status || 'pending')}</div>
                                  <div><span className="text-gray-500 block">Delivery Type</span><span className="capitalize text-gray-900 font-medium">{viewingOrder.delivery_type?.replace(/_/g, ' ') || 'N/A'}</span></div>
                                  {viewingOrder.delivery_type?.toLowerCase() !== 'pickup' && viewingOrder.delivery_address && (
                                      <div className="col-span-2 mt-2"><span className="text-gray-500 block mb-1">Delivery Address</span><p className="bg-gray-50 p-2 rounded border">{viewingOrder.delivery_address}</p></div>
                                  )}
                              </div>
                          </div>
                      </details>

                  </div>
              )}
              <div className="bg-white p-4 border-t border-gray-200 flex justify-end flex-shrink-0">
                  <DialogClose asChild>
                      <Button variant="outline" className="px-6">Close Window</Button>
                  </DialogClose>
              </div>
          </DialogContent>
      </Dialog>
      
      {/* RENDER THE IMAGE MANAGER DIALOG */}
      {selectedOrderForImages && (
          <ProjectImageManagerDialog 
              order={selectedOrderForImages} 
              onClose={() => setSelectedOrderForImages(null)} 
          />
      )}

      <Toaster />
    </DashboardLayout>
  )
}

// Just a quick icon helper for the new Play button
function Play(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  )
}
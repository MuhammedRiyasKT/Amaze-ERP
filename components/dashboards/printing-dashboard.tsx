// components/dashboards/printing/PrintingDashboard.tsx (or appropriate path)
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "../dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog" 

// API client and types (Assumed to be correctly exported from "@/lib/printing"):
import { 
  getAllTasks, 
  editTask, 
  getOrderById,
  type DetailedTask, 
  type EditTaskPayload,
  type OrderDetails
} from "@/lib/printing"

import {
  Printer,       
  Package,       
  CheckCircle,   
  Clock,         
  TrendingUp,
  Filter,        
  Eye,           
  Settings,
  Zap,           
  UserPlus,      
  Calendar,      
  FolderOpen,    
  Loader2,       
  AlertCircle,   
  CheckSquare,   
  MessageSquare, 
  IndianRupee, 
  Phone,       
  CreditCard,  
  Truck,       
  FilterX,     
  Hourglass,     
  Check as CheckIcon, 
  Inbox,
  PlayCircle,
  AlertTriangle,
  User,
  ClipboardList
} from "lucide-react"


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
    case "completed": return "bg-green-100 text-green-800 border-green-200"
    case "printing":
    case "in_progress": return "bg-blue-100 text-blue-800 border-blue-200"
    case "queued":
    case "pending":
    case "assigned": return "bg-amber-100 text-amber-800 border-amber-200"
    default: return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getTaskStatusIcon = (status?: string | null) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-3.5 w-3.5 mr-1" />
      case "printing":
      case "in_progress": return <Zap className="h-3.5 w-3.5 mr-1" />
      case "queued":
      case "pending":
      case "assigned": return <Inbox className="h-3.5 w-3.5 mr-1" />
      default: return <Clock className="h-3.5 w-3.5 mr-1" />
    }
}

const getPaymentStatusBadge = (status: string) => {
    const lowerStatus = status.toLowerCase();
    let color = 'bg-gray-100 text-gray-800';
    if (lowerStatus === 'paid' || lowerStatus === 'completed') color = 'bg-green-100 text-green-800';
    else if (lowerStatus === 'pending' || lowerStatus === 'unpaid') color = 'bg-red-100 text-red-800';
    else if (lowerStatus === 'partial') color = 'bg-yellow-100 text-yellow-800';
    return <Badge className={`capitalize ${color}`}>{status.replace(/_/g, ' ')}</Badge>;
};

const getProjectStatusColor = (status?: string | null) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-orange-100 text-orange-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
}

// --- PRINTING METRICS ---
const printingMetrics =[
    { name: "Active Print Jobs", value: "8", change: "+2", icon: Printer },
    { name: "Daily Output", value: "24", change: "+6", icon: Package },
    { name: "Quality Rate", value: "96%", change: "+2%", icon: CheckCircle },
    { name: "Equipment Uptime", value: "94%", change: "+1%", icon: Settings },
]

// --- Reusable Filter Controls Component ---
interface FilterControlsProps {
    filterAssignedDateFrom: string;
    setFilterAssignedDateFrom: (date: string) => void;
    filterCompletionDateTo: string;
    setFilterCompletionDateTo: (date: string) => void;
    filterProjectTargetDateTo: string;
    setFilterProjectTargetDateTo: (date: string) => void;
    isMobile?: boolean;
}

const FilterControls: React.FC<FilterControlsProps> = ({
    filterAssignedDateFrom, setFilterAssignedDateFrom,
    filterCompletionDateTo, setFilterCompletionDateTo,
    filterProjectTargetDateTo, setFilterProjectTargetDateTo,
    isMobile = false
}) => (
    <div className={`flex flex-wrap items-end gap-4 ${isMobile ? 'flex-col items-stretch' : ''}`}>
        <div className={`flex flex-col gap-1.5 ${isMobile ? 'w-full' : 'w-[160px] flex-shrink-0'}`}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigned After</label>
            <Input type="date" className="bg-white" value={filterAssignedDateFrom} onChange={(e) => setFilterAssignedDateFrom(e.target.value)} />
        </div>
        <div className={`flex flex-col gap-1.5 ${isMobile ? 'w-full' : 'w-[160px] flex-shrink-0'}`}>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed Before</label>
            <Input type="date" className="bg-white" value={filterCompletionDateTo} onChange={(e) => setFilterCompletionDateTo(e.target.value)} />
        </div>
        <div className={`flex flex-col gap-1.5 ${isMobile ? 'w-full' : 'w-[160px] flex-shrink-0'}`}>
            <label className="text-xs font-semibold text-red-600 uppercase tracking-wider">Project Due Before</label>
            <Input type="date" className="bg-white border-red-100 focus-visible:ring-red-500" value={filterProjectTargetDateTo} onChange={(e) => setFilterProjectTargetDateTo(e.target.value)} />
        </div>
    </div>
);


// --- MAIN COMPONENT ---
export function PrintingDashboard() {
  const { toast } = useToast()

  // --- STATE MANAGEMENT ---
  const[tasks, setTasks] = useState<DetailedTask[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const[updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)
  
  const [viewingOrder, setViewingOrder] = useState<OrderDetails | null>(null)
  const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false)
  
  // --- STATE MANAGEMENT FOR FILTERS ---
  const[filterStatus, setFilterStatus] = useState<string>('all');
  const[filterAssignedDateFrom, setFilterAssignedDateFrom] = useState<string>(''); 
  const[filterCompletionDateTo, setFilterCompletionDateTo] = useState<string>(''); 
  const[filterProjectTargetDateTo, setFilterProjectTargetDateTo] = useState<string>(''); 
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false); 


  // --- DATA FETCHING FOR TASKS ---
  useEffect(() => {
    loadTasks()
  },[])

  const loadTasks = async () => {
    setIsLoading(true)
    setError(null)
    const response = await getAllTasks()

    if (response.error) {
      setError(response.error)
      toast({ variant: "destructive", title: "Failed to load tasks", description: response.error })
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
        toast({ title: "Error", description: response.error || "Failed to load detailed order information.", variant: "destructive" });
    }
    setIsOrderDetailsLoading(false);
  }

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    setUpdatingTaskId(taskId)
    const payload: EditTaskPayload = { status: newStatus }
    if (newStatus === "completed") payload.completion_time = new Date().toISOString(); 
    
    const response = await editTask(taskId, payload)

    if (response.error) {
      toast({ variant: "destructive", title: "Update Failed", description: response.error })
    } else {
      toast({ title: "Status Updated", description: `Task moved to ${newStatus.replace(/_/g, ' ')}.` })
      loadTasks() 
    }
    setUpdatingTaskId(null)
  }

  // --- FILTERING LOGIC ---
  const getFilteredTasks = useMemo(() => {
    if (!tasks) return[];
    let filtered = tasks;

    if (filterStatus !== 'all') filtered = filtered.filter(task => task.status === filterStatus);

    if (filterAssignedDateFrom) {
        const filterDate = new Date(filterAssignedDateFrom);
        filterDate.setHours(0, 0, 0, 0); 
        filtered = filtered.filter(task => {
            if (!task.assigned_on) return false;
            const taskDate = new Date(task.assigned_on);
            taskDate.setHours(0, 0, 0, 0);
            return taskDate.getTime() >= filterDate.getTime();
        });
    }
    
    if (filterCompletionDateTo) {
        const filterDate = new Date(filterCompletionDateTo);
        filterDate.setHours(23, 59, 59, 999); 
        filtered = filtered.filter(task => {
            const completionDateStr = task.completion_time || task.completed_on; 
            if (task.status !== 'completed' || !completionDateStr) return false;
            const taskCompletionDate = new Date(completionDateStr);
            return taskCompletionDate.getTime() <= filterDate.getTime();
        });
    }

    if (filterProjectTargetDateTo) {
        const filterDate = new Date(filterProjectTargetDateTo);
        filterDate.setHours(23, 59, 59, 999); 
        filtered = filtered.filter(task => {
            if (!task.order_completion_date) return false;
            const projectTargetDate = new Date(task.order_completion_date);
            return projectTargetDate.getTime() <= filterDate.getTime();
        });
    }

    return filtered;
  },[tasks, filterStatus, filterAssignedDateFrom, filterCompletionDateTo, filterProjectTargetDateTo]);

  const handleClearFilters = () => {
      setFilterStatus('all');
      setFilterAssignedDateFrom('');
      setFilterCompletionDateTo('');
      setFilterProjectTargetDateTo(''); 
      toast({ description: "Filters cleared." });
  }

  const isFilterActive = filterAssignedDateFrom !== '' || filterCompletionDateTo !== '' || filterProjectTargetDateTo !== '';

  return (
    <DashboardLayout title="Printing Dashboard" role="printing">

      <Tabs defaultValue="tasks" className="space-y-6"> 
        
        <div className="flex justify-center sm:justify-start mb-2">
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
            <TabsTrigger value="tasks" className="px-8">Print Queue</TabsTrigger>
            <TabsTrigger value="reports" className="px-8">Reports</TabsTrigger>
            </TabsList>
        </div>

        {/* ==================================================================== */}
        {/* REPORTS SECTION */}
        {/* ==================================================================== */}
        <TabsContent value="reports" className="space-y-6">
            <h3 className="text-xl font-semibold mb-4">Performance Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {printingMetrics.map((metric) => {
                    const Icon = metric.icon
                    return (
                        <Card key={metric.name} className="shadow-sm border-gray-100">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500 uppercase">{metric.name}</CardTitle>
                                <Icon className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                                <p className="text-xs font-medium text-green-600 flex items-center mt-1">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {metric.change} this month
                                </p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
            
            <Card className="shadow-sm border-gray-100">
                <CardHeader><CardTitle>Detailed Analytics</CardTitle></CardHeader>
                <CardContent>
                    <div className="py-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <Settings className="h-8 w-8 mb-2" />
                        <p className="text-sm">Further charts and analytical reports will be displayed here.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>


        {/* ==================================================================== */}
        {/* LIVE TASK SECTION (Print Queue) */}
        {/* ==================================================================== */}
        <TabsContent value="tasks" className="space-y-6">
          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="pb-4 px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center text-2xl">
                      <Printer className="h-6 w-6 mr-3 text-blue-600" />Print Queue
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm text-gray-500">
                      Manage your upcoming and active print jobs.
                    </CardDescription>
                  </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">

              {/* --- QUICK PIPELINE STATUS TABS --- */}
              <div className="mb-6 flex overflow-x-auto pb-2 scrollbar-hide gap-2">
                  <Button 
                      variant={filterStatus === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterStatus('all')}
                      className={`rounded-full px-5 flex-shrink-0 ${filterStatus === 'all' ? 'bg-gray-800 hover:bg-gray-900' : 'bg-white'}`}
                  >
                      All Tasks
                  </Button>
                  
                  {['assigned', 'in_progress', 'completed'].map(status => {
                      const displayStatus = status === 'assigned' ? 'Queued' : status === 'in_progress' ? 'Printing' : 'Completed';
                      return (
                          <Button
                              key={status}
                              variant={filterStatus === status ? 'default' : 'outline'}
                              onClick={() => setFilterStatus(status)}
                              className={`rounded-full px-5 flex-shrink-0 capitalize ${filterStatus === status ? getTaskStatusColor(status).replace('text-', 'bg-').replace('100', '600').replace('800', 'white') : 'bg-white text-gray-600'}`}
                          >
                              {getTaskStatusIcon(status)}
                              {displayStatus}
                          </Button>
                      )
                  })}
              </div>

              {/* --- DESKTOP FILTER BAR --- */}
              <div className="bg-gray-50/70 border rounded-xl p-4 mb-6 hidden md:block">
                  <div className="flex flex-col lg:flex-row gap-4 items-end">
                      <FilterControls 
                          filterAssignedDateFrom={filterAssignedDateFrom}
                          setFilterAssignedDateFrom={setFilterAssignedDateFrom}
                          filterCompletionDateTo={filterCompletionDateTo}
                          setFilterCompletionDateTo={setFilterCompletionDateTo}
                          filterProjectTargetDateTo={filterProjectTargetDateTo} 
                          setFilterProjectTargetDateTo={setFilterProjectTargetDateTo} 
                          isMobile={false}
                      />
                      {isFilterActive && (
                          <Button variant="ghost" onClick={handleClearFilters} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <FilterX className="h-4 w-4 mr-2" /> Clear Filters
                          </Button>
                      )}
                  </div>
              </div>

              {/* --- MOBILE FILTER BUTTON --- */}
              <div className="md:hidden mb-6">
                  <Button variant="outline" onClick={() => setIsMobileFilterOpen(true)} className="w-full bg-white">
                      <Filter className="h-4 w-4 mr-2" />
                      More Filters {isFilterActive && "(Active)"}
                  </Button>
              </div>


              {/* --- TASK LIST --- */}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                    <p className="text-sm font-medium text-gray-500">Loading print queue...</p>
                </div>
              ) : error ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-red-50 border-red-100">
                    <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <p className="font-bold text-red-700 text-lg">Failed to load print queue</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
                    <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">Queue is empty</h3>
                    <p className="text-gray-500 text-sm mt-1">There are currently no printing tasks assigned.</p>
                </div>
              ) : getFilteredTasks.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
                    <FilterX className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900">No matches found</h3>
                    <p className="text-gray-500 text-sm mt-1">No tasks match your current filters.</p>
                    <Button variant="outline" onClick={handleClearFilters} className="mt-4">Clear Filters</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {getFilteredTasks.map((task) => {
                    
                    const isTargetToday = isDateToday(task.order_completion_date);
                    const isCompleted = task.status === 'completed';
                    let isOverdue = false;
                    
                    if (!isCompleted && task.completion_time) {
                        const dueDate = new Date(task.completion_time);
                        dueDate.setHours(23, 59, 59, 999); 
                        if (new Date().getTime() > dueDate.getTime()) isOverdue = true;
                    }

                    // Card styling based on urgency
                    const cardBorder = isOverdue ? "border-l-4 border-l-red-500 border-red-200" : isTargetToday ? "border-l-4 border-l-amber-500 border-amber-200" : "border-gray-200";
                    const displayStatus = task.status === 'assigned' ? 'Queued' : task.status === 'in_progress' ? 'Printing' : 'Completed';
                        
                    return (
                        <div key={task.id} className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col ${cardBorder}`}>
                            
                            {/* Alert Banner (Overdue / Today) */}
                            {isOverdue && !isCompleted && (
                                <div className="bg-red-50 text-red-700 px-4 py-1.5 text-xs font-bold flex items-center tracking-wider uppercase">
                                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Overdue Print Job
                                </div>
                            )}
                            {!isOverdue && isTargetToday && !isCompleted && (
                                <div className="bg-amber-50 text-amber-700 px-4 py-1.5 text-xs font-bold flex items-center tracking-wider uppercase">
                                    <AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Project Due Today
                                </div>
                            )}

                            {/* Top Bar: Status & IDs */}
                            <div className="bg-gray-50/50 border-b px-4 py-3 flex justify-between items-center">
                                <Badge variant="outline" className={`capitalize border ${getTaskStatusColor(task.status)} font-semibold tracking-wide`}>
                                    <span className="flex items-center">{getTaskStatusIcon(task.status)}{displayStatus}</span>
                                </Badge>
                                <div className="flex items-center space-x-3 text-xs text-gray-500 font-medium">
                                    <span className="bg-white border px-2 py-0.5 rounded shadow-sm">Task #{task.id}</span>
                                    <span>Ord #{task.order?.generated_order_id || task.order_id}</span>
                                </div>
                            </div>

                            {/* Main Body */}
                            <div className="p-4 flex-grow flex flex-col">
                                
                                {/* Product Title */}
                                <div className="flex items-start mb-3">
                                    <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 border border-blue-100">
                                        <Package className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg leading-tight">
                                            {task.order?.product_name || "Unknown Product"}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-0.5 flex items-center">
                                            <User className="h-3.5 w-3.5 mr-1" /> Customer: <span className="font-semibold text-gray-700 ml-1">{task.customer?.name || "N/A"}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Task Instructions (Prominent block) */}
                                <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-3 mb-4 flex-grow">
                                    <p className="text-xs font-bold text-yellow-800 uppercase tracking-wider mb-1 flex items-center">
                                        <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> Print Instructions
                                    </p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {task.task_description || <span className="italic text-gray-400">No specific instructions provided.</span>}
                                    </p>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mt-auto pt-3 border-t">
                                    <div className="flex items-center text-gray-600">
                                        <UserPlus className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                        <span className="truncate">By: {task.assigned_by?.staff_name || "N/A"}</span>
                                    </div>
                                    <div className="flex items-center text-gray-600">
                                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                        <span>On: {new Date(task.assigned_on).toLocaleDateString()}</span>
                                    </div>
                                    
                                    {task.completion_time && !isCompleted && (
                                        <div className={`flex items-center font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                                            <Hourglass className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                                            <span>Target: {new Date(task.completion_time).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                    
                                    {isCompleted && task.completed_on && (
                                        <div className="flex items-center font-medium text-green-600">
                                            <CheckIcon className="h-3.5 w-3.5 mr-1.5" />
                                            <span>Done: {new Date(task.completed_on).toLocaleDateString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="bg-gray-50 px-4 py-3 border-t flex items-center justify-between gap-3">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-white flex-1 sm:flex-none"
                                    onClick={() => handleViewOrder(task.order_id)}
                                    disabled={isOrderDetailsLoading}
                                >
                                    <Eye className="h-4 w-4 mr-1.5 text-gray-500" /> View Order Details
                                </Button>
                                
                                {task.status === 'assigned' && (
                                    <Button 
                                        onClick={() => handleStatusChange(task.id, 'in_progress')}
                                        disabled={updatingTaskId === task.id}
                                        className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                    >
                                        {updatingTaskId === task.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                                        Start Printing
                                    </Button>
                                )}

                                {task.status === 'in_progress' && (
                                    <Button 
                                        onClick={() => handleStatusChange(task.id, 'completed')}
                                        disabled={updatingTaskId === task.id}
                                        className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                    >
                                        {updatingTaskId === task.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                        Finish Printing
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
      </Tabs>
      
      {/* ==================================================================== */}
      {/* MOBILE FILTER DIALOG */}
      {/* ==================================================================== */}
      <Dialog open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle className="flex items-center">
                      <Filter className="h-5 w-5 mr-2 text-blue-600" /> Filter Print Queue
                  </DialogTitle>
                  <DialogDescription>
                      Narrow down your tasks by date parameters.
                  </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                  <FilterControls 
                      filterAssignedDateFrom={filterAssignedDateFrom}
                      setFilterAssignedDateFrom={setFilterAssignedDateFrom}
                      filterCompletionDateTo={filterCompletionDateTo}
                      setFilterCompletionDateTo={setFilterCompletionDateTo}
                      filterProjectTargetDateTo={filterProjectTargetDateTo} 
                      setFilterProjectTargetDateTo={setFilterProjectTargetDateTo} 
                      isMobile={true} 
                  />
                  {isFilterActive && (
                      <Button variant="outline" onClick={handleClearFilters} className="w-full mt-4 text-red-600 border-red-200 bg-red-50">
                          <FilterX className="h-4 w-4 mr-2" /> Clear All Filters
                      </Button>
                  )}
              </div>

              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="default" className="w-full bg-gray-900 text-white">
                          Apply & Close
                      </Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>


      {/* ==================================================================== */}
      {/* ORDER DETAILS VIEW DIALOG */}
      {/* ==================================================================== */}
      <Dialog open={!!viewingOrder || isOrderDetailsLoading} onOpenChange={(open) => { 
          if (!open) { 
              setViewingOrder(null);
              setIsOrderDetailsLoading(false);
          } 
      }}>
          <DialogContent className="sm:max-w-[425px] md:max-w-xl flex flex-col max-h-[90vh]">
              
              <DialogHeader className="flex-shrink-0 border-b pb-4">
                  <DialogTitle className="text-xl flex items-center">
                      <FolderOpen className="h-5 w-5 mr-2 text-blue-600" />
                      Order Details {viewingOrder?.generated_order_id ? `#${viewingOrder.generated_order_id}` : ''}
                  </DialogTitle>
                  <DialogDescription>
                      Comprehensive information about the parent project.
                  </DialogDescription>
              </DialogHeader>
              
              {isOrderDetailsLoading && !viewingOrder ? (
                  <div className="py-16 flex flex-col items-center flex-grow">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                      <p className="text-sm font-medium text-gray-500">Retrieving order specifications...</p>
                  </div>
              ) : viewingOrder && (
                  <div className="overflow-y-auto flex-grow pr-2">
                      <div className="grid gap-6 py-4 text-sm">
                          
                          {/* CUSTOMER INFO SECTION */}
                          <div className="p-4 bg-gray-50 rounded-xl border">
                              <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-xs">Customer Information</h4>
                              
                              <div className="grid grid-cols-3 items-center gap-4 mb-2">
                                  <span className="font-medium text-gray-500">Name</span>
                                  <span className="col-span-2 font-semibold text-gray-900">{viewingOrder.customer_name || 'N/A'}</span>
                              </div>
                              <div className="grid grid-cols-3 items-center gap-4 mb-2">
                                  <span className="font-medium text-gray-500">Mobile</span>
                                  {viewingOrder.mobile_number ? (
                                      <a href={`tel:${viewingOrder.mobile_number}`} className="col-span-2 flex items-center text-blue-600 hover:underline">
                                          <Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                          {viewingOrder.mobile_number}
                                      </a>
                                  ) : (<span className="col-span-2 text-gray-500">N/A</span>)}
                              </div>
                              <div className="grid grid-cols-3 items-center gap-4">
                                  <span className="font-medium text-gray-500">WhatsApp</span>
                                  {viewingOrder.whatsapp_number ? (
                                      <a href={`https://wa.me/91${viewingOrder.whatsapp_number}`} target="_blank" rel="noopener noreferrer" className="col-span-2 flex items-center text-green-600 hover:underline">
                                          <MessageSquare className="h-3.5 w-3.5 mr-2 text-gray-400" />
                                          {viewingOrder.whatsapp_number}
                                      </a>
                                  ) : (<span className="col-span-2 text-gray-500">N/A</span>)}
                              </div>
                          </div>

                          {/* ORDER CORE DETAILS */}
                          <div>
                              <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-xs border-b pb-2 flex items-center">
                                  <Package className="h-4 w-4 mr-2" /> Product Specs
                              </h4>

                              <div className="space-y-3">
                                  <div className="grid grid-cols-3 gap-4">
                                      <span className="font-medium text-gray-500">Product Name</span>
                                      <span className="col-span-2 font-semibold text-gray-900">{viewingOrder.product_name || 'N/A'}</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-3 gap-4">
                                      <span className="font-medium text-gray-500">Order Type</span>
                                      <span className="col-span-2 font-medium capitalize">{viewingOrder.order_type?.replace(/_/g, ' ') || 'N/A'}</span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                      <span className="font-medium text-gray-500">Quantity</span>
                                      <span className="col-span-2 font-bold bg-gray-100 px-2 py-0.5 rounded w-fit">{viewingOrder.quantity || 0}</span>
                                  </div>

                                  <div className="grid grid-cols-3 items-center gap-4">
                                      <span className="font-medium text-gray-500">Project Status</span>
                                      <Badge className={`w-fit uppercase text-[10px] tracking-wider ${getProjectStatusColor(viewingOrder.status || 'pending')}`}>
                                          {viewingOrder.status || 'Pending'}
                                      </Badge>
                                  </div>
                              </div>
                          </div>
                          
                          {/* TIMELINE DETAILS */}
                          <div>
                              <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-xs border-b pb-2 flex items-center">
                                  <Calendar className="h-4 w-4 mr-2" /> Project Timeline
                              </h4>

                              <div className="space-y-3">
                                  <div className="grid grid-cols-3 gap-4">
                                      <span className="font-medium text-gray-500">Start Date</span>
                                      <span className="col-span-2">{viewingOrder.start_on ? new Date(viewingOrder.start_on).toLocaleDateString() : 'N/A'}</span>
                                  </div>

                                  <div className="grid grid-cols-3 gap-4">
                                      <span className="font-medium text-gray-500">Project Deadline</span>
                                      <span className="col-span-2 font-bold text-red-600 flex items-center">
                                          {viewingOrder.completion_date ? new Date(viewingOrder.completion_date).toLocaleDateString() : 'N/A'}
                                      </span>
                                  </div>
                              </div>
                          </div>
                          
                          {/* DELIVERY DETAILS */}
                          <div>
                              <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-xs border-b pb-2 flex items-center">
                                  <Truck className="h-4 w-4 mr-2" /> Delivery Info
                              </h4>

                              <div className="space-y-3">
                                  <div className="grid grid-cols-3 gap-4">
                                      <span className="font-medium text-gray-500">Delivery Type</span>
                                      <span className="col-span-2 font-medium capitalize">{viewingOrder.delivery_type?.replace(/_/g, ' ') || 'N/A'}</span>
                                  </div>

                                  {viewingOrder.delivery_type?.toLowerCase() !== 'pickup' && viewingOrder.delivery_address && (
                                      <div className="grid grid-cols-3 gap-4">
                                          <span className="font-medium text-gray-500">Address</span>
                                          <span className="col-span-2 whitespace-pre-wrap">{viewingOrder.delivery_address}</span>
                                      </div>
                                  )}
                              </div>
                          </div>

                          {/* FINANCIALS */}
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                              <h4 className="font-bold text-emerald-800 mb-3 uppercase tracking-wider text-xs flex items-center">
                                  <IndianRupee className="h-4 w-4 mr-2" /> Financial Summary
                              </h4>
                              
                              <div className="space-y-2">
                                  <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                                      <span className="font-medium text-gray-600">Total Billed</span>
                                      <span className="font-bold text-gray-900">₹ {(viewingOrder.total_amount || viewingOrder.amount)?.toLocaleString('en-IN') || '0.00'}</span>
                                  </div>
                                  <div className="flex justify-between items-center bg-white p-2 rounded shadow-sm">
                                      <span className="font-medium text-gray-600">Amount Paid</span>
                                      <span className="font-bold text-emerald-600">₹ {viewingOrder.amount_payed ? viewingOrder.amount_payed.toLocaleString('en-IN') : '0.00'}</span>
                                  </div>
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-emerald-200">
                                      <span className="font-medium text-gray-600">Payment Status</span>
                                      <span>{getPaymentStatusBadge(viewingOrder.payment_status || 'pending')}</span>
                                  </div>
                              </div>
                          </div>
                          
                          {/* DESCRIPTION */}
                          {viewingOrder.description && (
                              <div>
                                  <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-xs border-b pb-2">Description / Notes</h4>
                                  <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 text-gray-700 whitespace-pre-wrap leading-relaxed">
                                      {viewingOrder.description}
                                  </div>
                              </div>
                          )}
                          
                      </div>
                  </div>
              )}

              <DialogFooter className="mt-2 pt-4 border-t flex items-center justify-between sm:justify-between w-full">
                  <div className="text-xs text-gray-400">
                      Created by: {viewingOrder?.created_by_staff_name || 'Staff'} 
                  </div>
                  <DialogClose asChild>
                      <Button variant="outline">Close Details</Button>
                  </DialogClose>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      
      <Toaster />
    </DashboardLayout>
  )
}
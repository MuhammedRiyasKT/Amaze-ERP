// admin-tabs/attendance-tab-content.tsx
"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

// --- ICONS ---
import {
  Clock, Calendar, CheckCircle, XCircle, AlertTriangle, User, Loader2, CalendarOff, Filter, X as ClearFilterIcon, Clock10, AlertCircle, Users
} from "lucide-react";

// --- API & TYPE IMPORTS ---
import { 
    getActiveStaffs, 
    getAllAttendance, 
    ActiveStaff, 
    Attendance, 
    ApiResponse 
} from "@/lib/admin"; 

// --- TYPE DEFINITIONS ---
type ComprehensiveAttendance = Attendance & {
    id: number | string;
};

// --- CONSTANTS ---
const STATUS_PRIORITY: Record<string, number> = {
    'present': 1,
    'absent': 2,
    'late': 3,
    'half_day': 4,
    'leave': 5,
    'unknown': 99,
};

// --- HELPER FUNCTIONS ---
const formatTimeFromISO = (isoString: string | null | undefined): string => {
    if (!isoString) return 'N/A';
    try {
        const date = new Date(isoString);
        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
        return 'N/A';
    }
};

// Generates local timezone date string to ensure the "today" matches the user's view correctly
const getTodayDateString = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Kept legacy cases so old records don't break, but they are removed from filters/metrics
const getAttendanceStatusBadge = (status: string | null) => {
    const safeStatus = status?.toLowerCase() || 'unknown';
    let color: string, Icon: React.ElementType, label: string = safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1);

    switch (safeStatus) {
        case 'present': color = 'bg-green-100 text-green-800'; Icon = CheckCircle; break;
        case 'absent': color = 'bg-red-100 text-red-800'; Icon = XCircle; break;
        case 'late': color = 'bg-yellow-100 text-yellow-800'; Icon = AlertTriangle; break;
        case 'leave': color = 'bg-blue-100 text-blue-800'; Icon = CalendarOff; break;
        case 'half_day': color = 'bg-indigo-100 text-indigo-800'; Icon = Clock10; label = 'Half Day'; break;
        default: color = 'bg-gray-100 text-gray-800'; Icon = Clock; label = status || 'N/A';
    }

    return (
        <Badge className={`capitalize ${color} font-medium`}>
            <Icon className="h-3 w-3 mr-1" /> {label}
        </Badge>
    );
};

// =============================================================
// SUB-COMPONENT: Attendance Register Display Section
// =============================================================
interface AttendanceRegisterSectionProps {
    data: ComprehensiveAttendance[];
    isFiltered: boolean;
}

const AttendanceRegisterSection: React.FC<AttendanceRegisterSectionProps> = ({ data, isFiltered }) => {
    const groupedData = useMemo(() => {
        const groups = data.reduce((acc, record) => {
            if (!record.date) return acc;
            const dateStr = new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            if (!acc[dateStr]) acc[dateStr] =[];
            acc[dateStr].push(record);
            return acc;
        }, {} as Record<string, ComprehensiveAttendance[]>);

        Object.values(groups).forEach(records => {
            records.sort((a, b) => {
                const priorityA = STATUS_PRIORITY[a.status?.toLowerCase() || 'unknown'] || 99;
                const priorityB = STATUS_PRIORITY[b.status?.toLowerCase() || 'unknown'] || 99;
                if (priorityA !== priorityB) return priorityA - priorityB;
                return (a.staff_name || '').localeCompare(b.staff_name || '');
            });
        });
        return groups;
    },[data]);
    
    const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (data.length === 0) {
        return (
             <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-semibold text-gray-700">No Records Found</p>
                <p className="text-sm text-gray-500">
                    {isFiltered ? "No records match the current filter criteria." : "There are no attendance records to display yet."}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {sortedDates.map((dateStr) => (
                <Card key={dateStr} className="shadow-sm">
                    <CardHeader className="bg-gray-50 border-b py-3">
                        <CardTitle className="flex items-center text-base font-bold text-gray-700">
                            <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                            Attendance for {dateStr}
                            <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-700 hover:bg-blue-100">
                                {groupedData[dateStr].length} Records
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="hidden sm:grid grid-cols-8 text-xs font-semibold uppercase text-gray-500 bg-gray-100 py-3 px-6 border-b">
                            <div className="col-span-2">Staff Member</div>
                            <div>Role</div>
                            <div>Clock In</div>
                            <div>Clock Out</div>
                            <div className="text-center">Status</div>
                            <div className="col-span-2">Updated By</div>
                        </div>
                        
                        {groupedData[dateStr].map((record) => (
                            <div key={record.id} className="grid grid-cols-2 sm:grid-cols-8 items-center gap-2 sm:gap-4 p-4 border-b last:border-b-0 transition hover:bg-gray-50">
                                <div className="col-span-2 flex items-center">
                                    <User className="h-4 w-4 mr-2 text-gray-400 hidden sm:inline" />
                                    <span className="font-medium text-gray-900">{record.staff_name || 'Unknown'}</span>
                                </div>
                                <div className="hidden sm:block text-sm text-gray-600">{record.staff_role || 'N/A'}</div>
                                <div className="hidden sm:block text-sm">{formatTimeFromISO(record.checkin_time)}</div>
                                <div className="hidden sm:block text-sm">{formatTimeFromISO(record.checkout_time)}</div>
                                <div className="text-center hidden sm:block">{getAttendanceStatusBadge(record.status)}</div>
                                <div className="hidden sm:block col-span-2 text-sm text-gray-600">
                                    {record.updated_by_name 
                                        ? `${record.updated_by_name} (${record.updated_by_role || 'N/A'})`
                                        : 'System/Auto'}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};


// =============================================================
// MAIN COMPONENT: Attendance Management Page
// =============================================================
export const AttendanceManagementPage = () => {
    const { toast } = useToast();

    // --- STATE MANAGEMENT ---
    const[staffs, setStaffs] = useState<ActiveStaff[]>([]);
    const[attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filters
    const [filterDate, setFilterDate] = useState<string>('');
    const[filterMonth, setFilterMonth] = useState<string>('');
    const[filterStaffId, setFilterStaffId] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // --- DATA FETCHING ---
    const fetchAttendance = useCallback(async () => {
        const result = await getAllAttendance();
        if (result.data && Array.isArray(result.data)) {
            setAttendanceRecords(result.data);
        } else if (result.error) {
            toast({ title: "Error Fetching Attendance", description: result.error, variant: "destructive" });
        }
    },[toast]);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const staffResult = await getActiveStaffs();
            
            if (staffResult.data && Array.isArray(staffResult.data.staffs)) {
                setStaffs(staffResult.data.staffs);
            } else if(staffResult.error) {
                toast({ title: "Error Fetching Staff", description: staffResult.error, variant: "destructive" });
                setStaffs([]); 
            }

            await fetchAttendance();
            setIsLoading(false);
        };
        fetchData();
    }, [fetchAttendance, toast]);

    // --- EVENT HANDLERS ---
    const clearFilters = () => {
        setFilterDate('');
        setFilterMonth('');
        setFilterStaffId('all');
        setFilterStatus('all');
        toast({ description: "Filters cleared." });
    };

    // --- FILTERING LOGIC ---
    const filteredAttendance = useMemo((): ComprehensiveAttendance[] => {
        let records = Array.isArray(attendanceRecords) ? [...attendanceRecords] :[];
        if (filterStaffId !== 'all') {
            records = records.filter(r => r.staff_id === parseInt(filterStaffId));
        }
        if (filterStatus !== 'all') {
            records = records.filter(r => r.status?.toLowerCase() === filterStatus);
        }
        if (filterMonth) {
            records = records.filter(r => r.date && r.date.startsWith(filterMonth));
        } else if (filterDate) {
            records = records.filter(r => r.date === filterDate);
        }
        return records;
    },[filterDate, filterMonth, filterStaffId, filterStatus, attendanceRecords]);

    const isFilterActive = filterDate !== '' || filterMonth !== '' || filterStaffId !== 'all' || filterStatus !== 'all';

    // --- TODAY'S METRICS CALCULATION ---
    const todayMetrics = useMemo(() => {
        const todayStr = getTodayDateString();
        const counts = { total: 0, present: 0, absent: 0 };
        const staffIdsToday = new Set();
        
        if (Array.isArray(attendanceRecords)) {
            attendanceRecords.forEach(record => {
                if (record.date === todayStr) {
                    if (record.staff_id) staffIdsToday.add(record.staff_id);
                    const status = record.status?.toLowerCase();
                    if (status === 'present') counts.present++;
                    if (status === 'absent') counts.absent++;
                }
            });
        }
        
        counts.total = staffIdsToday.size;
        return counts;
    }, [attendanceRecords]);

    return (
        <>
            <Card className="border-0 shadow-none sm:border sm:shadow-sm">
                <CardHeader className="px-2 sm:px-6">
                    <CardTitle className="flex items-center text-2xl">
                        <Calendar className="w-6 h-6 mr-3 text-blue-600" /> Staff Attendance Register
                        {isLoading && <Loader2 className="ml-3 h-5 w-5 animate-spin text-blue-600" />}
                    </CardTitle>
                    <CardDescription className="mt-1">
                        Review, filter, and track all staff attendance records.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                    
                    {/* --- SUMMARY METRICS SECTION --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Card className="bg-blue-50 border-blue-100 shadow-sm">
                            <CardContent className="p-4 text-center">
                                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-blue-800 uppercase tracking-wider">Total Staff Today</p>
                                <p className="text-3xl font-bold text-blue-900 mt-1">{todayMetrics.total}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-100 shadow-sm">
                            <CardContent className="p-4 text-center">
                                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-green-800 uppercase tracking-wider">Present Today</p>
                                <p className="text-3xl font-bold text-green-900 mt-1">{todayMetrics.present}</p>
                            </CardContent>
                        </Card>
                        <Card className="bg-red-50 border-red-100 shadow-sm">
                            <CardContent className="p-4 text-center">
                                <XCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-red-800 uppercase tracking-wider">Absent Today</p>
                                <p className="text-3xl font-bold text-red-900 mt-1">{todayMetrics.absent}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- FILTERS SECTION --- */}
                    <div className="mb-6 p-5 border rounded-xl bg-gray-50/70 shadow-sm flex flex-col xl:flex-row xl:items-end gap-4">
                        <div className="flex items-center xl:hidden border-b pb-2 mb-2">
                            <Filter className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="font-semibold text-gray-700 text-sm">Filter Records</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                            {/* Filter by Status */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</label>
                                <Select value={filterStatus} onValueChange={setFilterStatus} disabled={isLoading}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="present">Present</SelectItem>
                                        <SelectItem value="absent">Absent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filter by Staff */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Staff Member</label>
                                <Select value={filterStaffId} onValueChange={setFilterStaffId} disabled={isLoading || !Array.isArray(staffs) || staffs.length === 0}>
                                    <SelectTrigger className="bg-white"><SelectValue placeholder="All Staff" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Staff</SelectItem>
                                        {Array.isArray(staffs) && staffs.map((staff) => (
                                            <SelectItem key={staff.id} value={staff.id.toString()}>
                                                {`${staff.name} (${staff.role})`}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Filter by Date */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Specific Date</label>
                                <Input type="date" className="bg-white" value={filterDate} onChange={(e) => { setFilterDate(e.target.value); if (e.target.value) setFilterMonth(''); }} disabled={isLoading} />
                            </div>

                            {/* Filter by Month */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Or By Month</label>
                                <Input type="month" className="bg-white" value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); if (e.target.value) setFilterDate(''); }} disabled={isLoading} />
                            </div>
                        </div>

                        {/* Clear Filters Button */}
                        {isFilterActive && (
                            <Button variant="outline" onClick={clearFilters} className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 flex-shrink-0 w-full xl:w-auto mt-2 xl:mt-0">
                                <ClearFilterIcon className="h-4 w-4 mr-2" /> Clear Filters
                            </Button>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="text-center py-16 text-gray-500">
                            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-blue-600" />
                            <p className="font-medium text-sm">Loading attendance data...</p>
                        </div>
                    ) : (
                        <AttendanceRegisterSection
                            data={filteredAttendance}
                            isFiltered={isFilterActive}
                        />
                    )}
                </CardContent>
            </Card>

            <Toaster />
        </>
    );
};
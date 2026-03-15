// src/components/admin/staff-management-page.tsx
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Users, Edit, Trash2, Plus, Eye, Search, Filter } from "lucide-react"

// Shadcn imports for the form and dialogs
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// API types and client
import { ApiClient, type StaffMember, type CreateStaffRequest, type UpdateStaffRequest } from "@/lib/api"


// =================================================================
// SHARED UTILITIES & CONSTANTS
// =================================================================

// Admin is removed from the options
const ROLE_OPTIONS = [
    { value: 'crm', label: 'CRM' },
    { value: 'sales', label: 'Sales' },
    { value: 'project', label: 'Project' },
    { value: 'designer', label: 'Designer' },
    { value: 'production', label: 'Production' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'hr', label: 'HR' },
    { value: 'accounts', label: 'Accounts' },
]

// Safely evaluate status accounting for uppercase/lowercase or boolean responses from API
const checkIsActive = (status: any) => {
  if (!status) return false

  const s = String(status).toLowerCase().trim()

  return ["active", "1", "true", "yes"].includes(s)
}


// =================================================================
// STAFF DETAILS DIALOG
// =================================================================

interface StaffDetailsDialogProps {
    isOpen: boolean
    onClose: () => void
    staff: StaffMember | null
    isLoading: boolean
}

function StaffDetailsDialog({ isOpen, onClose, staff, isLoading }: StaffDetailsDialogProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const DetailItem = ({ label, value }: { label: string; value?: string | React.ReactNode }) => (
        <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <div className="font-medium">{value || 'N/A'}</div>
        </div>
    );

    const isActive = checkIsActive(staff?.status);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Staff Member Details</DialogTitle>
                    <DialogDescription>
                        Full details for {staff?.staff_name || '...'}
                    </DialogDescription>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : staff ? (
                    <div className="space-y-5 py-4">
                        <DetailItem label="Full Name" value={<span className="text-lg font-bold">{staff.staff_name}</span>} />
                        <DetailItem label="Username / Email" value={staff.username} />
                        <DetailItem label="Role" value={
                            <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-transparent uppercase text-xs tracking-wider">
                                {staff.role}
                            </Badge>
                        } />
                        <DetailItem label="Status" value={
                            <Badge variant="outline" className={`px-2.5 py-0.5 ${isActive ? 'border-green-500 text-green-700 bg-green-50' : 'border-red-500 text-red-700 bg-red-50'}`}>
                                <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                {isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        } />
                        <DetailItem label="Address" value={staff.address} />
                        <DetailItem label="Image URL" value={staff.image ? <a href={staff.image} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline break-all">{staff.image}</a> : 'No Image'} />
                        <DetailItem label="Created On" value={formatDate(staff.created_at)} />
                        <DetailItem label="Last Updated" value={formatDate(staff.updated_at)} />
                    </div>
                ) : (
                    <p className="text-center py-8 text-gray-500">Could not load staff details.</p>
                )}
            </DialogContent>
        </Dialog>
    );
}


// =================================================================
// STAFF FORM COMPONENT
// =================================================================

interface StaffFormProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    staff?: StaffMember | null
    mode: 'create' | 'edit'
}

function StaffForm({ isOpen, onClose, onSuccess, staff, mode }: StaffFormProps) {
    const [formData, setFormData] = useState<CreateStaffRequest>({
        staff_name: '',
        username: '',
        password: '',
        role: '',
        address: '',
        status: 'active',
        image: '',
    })

    const [isFormLoading, setIsFormLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && staff) {
                setFormData({
                    staff_name: staff.staff_name,
                    username: staff.username,
                    password: '',
                    role: staff.role,
                    address: staff.address,
                    status: checkIsActive(staff.status) ? 'active' : 'inactive',
                    image: staff.image || '',
                } as CreateStaffRequest)
            } else {
                setFormData({
                    staff_name: '',
                    username: '',
                    password: '',
                    role: '',
                    address: '',
                    status: 'active',
                    image: '',
                })
            }
            setError('')
        }
    }, [isOpen, mode, staff])

    const handleInputChange = (field: keyof CreateStaffRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsFormLoading(true)
        setError('')

        try {
            if (!formData.role) {
                throw new Error('Please select a valid role before saving.');
            }

            if (mode === 'create') {
                if (!formData.password) throw new Error('Password is required for new staff members.');
                await ApiClient.createStaff(formData)
            } else if (mode === 'edit' && staff) {
                const updateData: UpdateStaffRequest = { ...formData } as UpdateStaffRequest
                if (!updateData.password) {
                    delete updateData.password
                }
                await ApiClient.updateStaff(staff.id, updateData)
            }

            onSuccess()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred')
        } finally {
            setIsFormLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === 'create' ? 'Add New Staff Member' : 'Edit Staff Member'}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === 'create'
                            ? 'Fill in the details to add a new staff member to the system.'
                            : `Editing details for ${staff?.staff_name || 'staff member'}. Leave password blank to keep current.`
                        }
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                    <div className="space-y-2">
                        <Label htmlFor="staff_name">Full Name</Label>
                        <Input id="staff_name" value={formData.staff_name} onChange={(e) => handleInputChange('staff_name', e.target.value)} placeholder="Enter full name" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">Username/Email</Label>
                        <Input id="username" type="email" value={formData.username} onChange={(e) => handleInputChange('username', e.target.value)} placeholder="Enter username or email" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password {mode === 'edit' && '(leave blank to keep current)'}</Label>
                        <Input id="password" type="password" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} placeholder="Enter password" required={mode === 'create'} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)} required>
                            <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                            <SelectContent>
                                {ROLE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="Enter address" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value: string) => handleInputChange('status', value as 'active' | 'inactive')}>
                            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">🟢 Active</SelectItem>
                                <SelectItem value="inactive">🔴 Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="image">Image URL (Optional)</Label>
                        <Input id="image" type="url" value={formData.image} onChange={(e) => handleInputChange('image', e.target.value)} placeholder="Enter image URL" />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background border-t">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isFormLoading}>Cancel</Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isFormLoading}>
                            {isFormLoading ? 'Saving...' : mode === 'create' ? 'Add Staff' : 'Update Staff'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}


// =================================================================
// STAFF MANAGEMENT PAGE (Main Export)
// =================================================================

export const StaffManagementPage: React.FC = () => {
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Search and Filter State (roleFilter initially empty)
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Form state
    const [isStaffFormOpen, setIsStaffFormOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');

    // View details state
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);

    const handleCloseForm = () => {
        setIsStaffFormOpen(false);
        setEditingStaff(null);
    }

    const reloadData = useCallback(async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await ApiClient.getStaff();
           console.log("All Staff:", data);
            setStaff(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load staff data.');
            setStaff([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        reloadData();
    }, [reloadData]);

    // Check if the user has triggered a search or selected a role filter
   const hasActiveFilter = roleFilter !== '' || searchQuery.trim() !== '';

    // Only map matching staff if a filter/search is active. Otherwise, empty list.
    const filteredStaff = !hasActiveFilter ? [] : staff.filter((member) => {
        const matchesSearch =
            member.staff_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.username?.toLowerCase().includes(searchQuery.toLowerCase());

        // If roleFilter is empty/undefined but they are searching, apply match unconditionally
        const matchesRole = roleFilter === '' || roleFilter === 'all' || member.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const handleAddStaff = () => {
        setEditingStaff(null);
        setFormMode('create');
        setIsStaffFormOpen(true);
    }

    const handleEditStaff = async (id: number) => {
        setFormMode('edit');
        setIsStaffFormOpen(true);
        setIsLoading(true);
        setEditingStaff(null);

        try {
            const staffMember = await ApiClient.getStaffById(id);
            setEditingStaff(staffMember);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch staff details for editing.');
            handleCloseForm();
        } finally {
            setIsLoading(false);
        }
    }

    const handleViewStaff = async (id: number) => {
        setIsViewModalOpen(true);
        setIsDetailsLoading(true);
        setViewingStaff(null);
        setError('');

        try {
            const staffDetails = await ApiClient.getStaffById(id);
            console.log("Staff Details API:", staffDetails);
            setViewingStaff(staffDetails);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch staff details.');
            setIsViewModalOpen(false);
        } finally {
            setIsDetailsLoading(false);
        }
    };

    const handleDeleteStaff = async (id: number) => {
        try {
            await ApiClient.deleteStaff(id)
            await reloadData()
            setError('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete staff member')
        }
    }

    const handleFormSuccess = () => {
        reloadData();
    }

    return (
        <>
            <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
                <CardHeader className="px-6 py-5 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-50 rounded-lg mr-3">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Staff Management</CardTitle>
                                <CardDescription className="mt-1">Manage system staff members and their permissions</CardDescription>
                            </div>
                        </div>
                        <Button type="button" onClick={handleAddStaff} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all font-medium">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Staff
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">

                    {/* Filter and Search Layout */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-8 justify-between items-start">

                        {/* Visible Role Chips (Left) */}
                        <div className="flex-1 w-full">
                            <Label className="text-lg font-extrabold text-gray-800 uppercase tracking-wider mb-3 block">
                                All Staffs
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant={roleFilter === 'all' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setRoleFilter('all')}
                                    className={`rounded-full px-4 transition-colors ${roleFilter === 'all' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-gray-200 shadow-sm'}`}
                                >
                                    All Staffs
                                </Button>
                                {ROLE_OPTIONS.map(role => (
                                    <Button
                                        key={role.value}
                                        type="button"
                                        variant={roleFilter === role.value ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setRoleFilter(role.value)}
                                        className={`rounded-full px-4 transition-colors ${roleFilter === role.value ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-gray-200 shadow-sm'}`}
                                    >
                                        {role.label}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Search Bar (Right) */}
                        <div className="w-full lg:w-80 flex-shrink-0">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Search Data</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search staff by name or email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 border-gray-200 bg-white rounded-lg shadow-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-center">
                            <p className="text-sm text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {isLoading && !isStaffFormOpen ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="text-sm text-gray-500 font-medium">Loading staff data...</p>
                        </div>
                    ) : !hasActiveFilter ? (
                        /* Initial State: Hides data until a user searches or selects a filter */
                        <div className="text-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Select a role or search</h3>
                            <p className="text-sm text-gray-500 mb-4">Please click on a role above or type in the search bar to view staff members.</p>
                        </div>
                    ) : (
                        /* Results Grid (Shows only if search or filter is active) */
                        <div className="grid gap-4">
                            {filteredStaff.length === 0 ? (
                                <div className="text-center py-16 px-4 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500 font-medium mb-1">No staff members found</p>
                                    <p className="text-sm text-gray-400 mb-4">Try adjusting your search or role selection.</p>
                                    <Button type="button" variant="outline" size="sm" onClick={() => { setSearchQuery(''); setRoleFilter(''); }}>
                                        Clear Selection
                                    </Button>
                                </div>
                            ) : (
                                filteredStaff.map((staffMember) => {
                                    const isActive = staffMember.is_active ?? checkIsActive(staffMember.status);

                                    return (
                                        <div
                                            key={staffMember.id}
                                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-200 group"
                                        >
                                            <div className="flex flex-col gap-1.5 w-full sm:w-auto flex-1">
                                                <div className="flex flex-wrap items-center gap-2.5">
                                                    <h3 className="text-lg font-bold text-gray-900 leading-none">{staffMember.staff_name}</h3>
                                                    <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-100 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 shadow-none">
                                                        {staffMember.role}
                                                    </Badge>
                                                    <Badge variant="outline" className={`px-2 py-0.5 border text-xs font-medium shadow-none ${isActive ? 'border-green-200 text-green-700 bg-green-50' : 'border-red-200 text-red-700 bg-red-50'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                        {isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium">{staffMember.username}</p>
                                            </div>

                                            <div className="w-full sm:w-auto flex flex-wrap items-center justify-start sm:justify-end gap-2 pt-2 sm:pt-0">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleViewStaff(staffMember.id)}
                                                    className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 bg-white"
                                                >
                                                    <Eye className="h-4 w-4 mr-1.5" /> View
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEditStaff(staffMember.id)}
                                                    disabled={isLoading}
                                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 bg-white"
                                                >
                                                    <Edit className="h-4 w-4 mr-1.5" /> Edit
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button type="button" variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 bg-white">
                                                            <Trash2 className="h-4 w-4 mr-1.5" /> Delete
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to permanently delete staff member <span className="font-semibold text-gray-900">{staffMember.staff_name}</span>?
                                                                This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() => handleDeleteStaff(staffMember.id)}
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                            >
                                                                Yes, Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Staff Form Modal */}
            <StaffForm
                isOpen={isStaffFormOpen}
                onClose={handleCloseForm}
                onSuccess={handleFormSuccess}
                staff={editingStaff}
                mode={formMode}
            />

            {/* Staff Details Modal */}
            <StaffDetailsDialog
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                staff={viewingStaff}
                isLoading={isDetailsLoading}
            />
        </>
    );
};
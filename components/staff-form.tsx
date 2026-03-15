"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { type StaffMember, type CreateStaffRequest, type UpdateStaffRequest } from "@/lib/api"

interface StaffFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staff?: StaffMember | null
  mode: 'create' | 'edit'
}

export function StaffForm({ isOpen, onClose, onSuccess, staff, mode }: StaffFormProps) {
  const [formData, setFormData] = useState<CreateStaffRequest>({
    staff_name: '',
    username: '',
    password: '',
    role: '',
    address: '',
    status: 'active',
    image: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset form when dialog opens/closes or staff changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && staff) {
        setFormData({
          staff_name: staff.staff_name,
          username: staff.username,
          password: '', // Don't pre-fill password
          role: staff.role,
          address: staff.address,
          status: staff.status,
          image: staff.image || '',
        })
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
    setIsLoading(true)
    setError('')

    try {
      const { ApiClient } = await import('@/lib/api')
      
      if (mode === 'create') {
        await ApiClient.createStaff(formData)
      } else if (mode === 'edit' && staff) {
        // Remove password if empty for update
        const updateData: UpdateStaffRequest = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        await ApiClient.updateStaff(staff.id, updateData)
      }
      
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // --- UPDATED ROLE OPTIONS ---
  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'crm', label: 'CRM' },
    { value: 'sales', label: 'Sales' },
    { value: 'project', label: 'Project' },
    { value: 'designer', label: 'Designer' },
    { value: 'production', label: 'Production' },
    { value: 'logistics', label: 'Logistics' },
    { value: 'hr', label: 'HR' },                 // <-- Added this line
    { value: 'accounts', label: 'Accountant' }, // <-- Added this line
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Staff Member' : 'Edit Staff Member'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Fill in the details to add a new staff member to the system.'
              : 'Update the staff member information below.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff_name">Full Name</Label>
            <Input
              id="staff_name"
              value={formData.staff_name}
              onChange={(e) => handleInputChange('staff_name', e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Username/Email</Label>
            <Input
              id="username"
              type="email"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="Enter username or email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password {mode === 'edit' && '(leave blank to keep current)'}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Enter password"
              required={mode === 'create'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value: 'active' | 'inactive') => handleInputChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL (Optional)</Label>
            <Input
              id="image"
              type="url"
              value={formData.image}
              onChange={(e) => handleInputChange('image', e.target.value)}
              placeholder="Enter image URL"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'create' ? 'Add Staff' : 'Update Staff'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthCheck } from '@/lib/auth';
import { 
  ChevronRight, 
  Search, 
  UserPlus, 
  Loader2, 
  UserCog, 
  AlertCircle,
  Mail,
  Calendar,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'sales';
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuthCheck();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form states
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const [addUserForm, setAddUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'sales'
  });
  
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    role: ''
  });
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/users');
      setUsers(response.data.data);
      setFilteredUsers(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/auth/register', addUserForm);
      
      // Reset form and close dialog
      setAddUserForm({
        name: '',
        email: '',
        password: '',
        role: 'sales'
      });
      setIsAddUserDialogOpen(false);
      
      // Refresh users list
      fetchUsers();
      
      toast.success('User added successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add user');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      await api.put(`/users/${selectedUser._id}`, editUserForm);
      
      setIsEditUserDialogOpen(false);
      
      // Refresh users list
      fetchUsers();
      
      toast.success('User updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      await api.delete(`/users/${selectedUser._id}`);
      
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      
      // Refresh users list
      fetchUsers();
      
      toast.success('User deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };
  
  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditUserDialogOpen(true);
  };
  
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold">Error Loading Users</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={fetchUsers}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">Users</h1>
        <Button onClick={() => setIsAddUserDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" /> Add New User
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-muted-foreground mb-4">No users found</p>
            <Button onClick={() => setIsAddUserDialogOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" /> Add New User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <Card key={user._id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.name}</span>
                      <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Don't allow deleting self or editing/deleting the only admin */}
                    {user._id !== currentUser?.id && (
                      <>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <UserCog className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                          disabled={user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Add User Dialog */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account. The user will be able to log in with these credentials.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={addUserForm.name} 
                  onChange={(e) => setAddUserForm({...addUserForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={addUserForm.email} 
                  onChange={(e) => setAddUserForm({...addUserForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={addUserForm.password} 
                  onChange={(e) => setAddUserForm({...addUserForm, password: e.target.value})}
                  required
                  minLength={6}
                />
                <p className="text-sm text-muted-foreground">
                  Must be at least 6 characters.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={addUserForm.role} 
                  onValueChange={(value) => setAddUserForm({...addUserForm, role: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales">Sales Rep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Add User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update the user's information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input 
                  id="edit-name" 
                  value={editUserForm.name} 
                  onChange={(e) => setEditUserForm({...editUserForm, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={editUserForm.email} 
                  onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select 
                  value={editUserForm.role} 
                  onValueChange={(value) => setEditUserForm({...editUserForm, role: value})}
                  disabled={
                    selectedUser?.role === 'admin' && 
                    users.filter(u => u.role === 'admin').length <= 1
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sales">Sales Rep</SelectItem>
                  </SelectContent>
                </Select>
                {selectedUser?.role === 'admin' && 
                users.filter(u => u.role === 'admin').length <= 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Cannot change role (system requires at least one admin)
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
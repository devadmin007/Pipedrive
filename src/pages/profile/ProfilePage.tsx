import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuthCheck, useAuthStore } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle, Loader2, Mail, UserCog, Check } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ProfilePage() {
  const { user } = useAuthCheck();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [notificationPreferences, setNotificationPreferences] = useState({
    email: {
      leadUpdates: true,
      leadAssignments: true,
      followUps: true
    },
    inApp: {
      leadUpdates: true,
      leadAssignments: true,
      followUps: true
    }
  });
  
  useEffect(() => {
    fetchUserDetails();
  }, []);
  
  const fetchUserDetails = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/users/${user.id}`);
      setUserDetails(response.data.data);
      
      // Set form values from user details
      setProfileForm({
        name: response.data.data.name,
        email: response.data.data.email,
      });
      
      // Set notification preferences from user details
      if (response.data.data.notificationPreferences) {
        setNotificationPreferences(response.data.data.notificationPreferences);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };
  
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await api.put(`/users/${user?.id}`, profileForm);
      
      // Update auth store with new name
      useAuthStore.setState(state => ({
        user: {
          ...state.user!,
          name: profileForm.name
        }
      }));
      
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      await api.put(`/auth/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      toast.success('Password changed successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNotificationPreferencesChange = async () => {
    try {
      setLoading(true);
      await api.put(`/users/${user?.id}/notification-preferences`, notificationPreferences);
      
      toast.success('Notification preferences updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update notification preferences');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleNotificationPreference = (channel: 'email' | 'inApp', type: 'leadUpdates' | 'leadAssignments' | 'followUps') => {
    setNotificationPreferences(prev => ({
      ...prev,
      [channel]: {
        ...prev[channel],
        [type]: !prev[channel][type]
      }
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Profile</h1>
      
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarFallback className="text-2xl">
            {user.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{user.email}</span>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <form onSubmit={handleProfileUpdate}>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    value={profileForm.name} 
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={profileForm.email} 
                    onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                    required
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    Email cannot be changed. Contact administrator for assistance.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>{user.role === 'admin' ? 'Administrator' : 'Sales Representative'}</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="password" className="space-y-4">
          <Card>
            <form onSubmit={handlePasswordChange}>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to ensure account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={passwordForm.currentPassword} 
                    onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                    required
                  />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={passwordForm.newPassword} 
                    onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={passwordForm.confirmPassword} 
                    onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                    required
                    minLength={6}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Change Password'
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how and when you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-lead-updates">Lead status updates</Label>
                    <Switch 
                      id="email-lead-updates" 
                      checked={notificationPreferences.email.leadUpdates}
                      onCheckedChange={() => toggleNotificationPreference('email', 'leadUpdates')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-lead-assignments">Lead assignments</Label>
                    <Switch 
                      id="email-lead-assignments" 
                      checked={notificationPreferences.email.leadAssignments}
                      onCheckedChange={() => toggleNotificationPreference('email', 'leadAssignments')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-follow-ups">Follow-up reminders</Label>
                    <Switch 
                      id="email-follow-ups" 
                      checked={notificationPreferences.email.followUps}
                      onCheckedChange={() => toggleNotificationPreference('email', 'followUps')}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="text-lg font-medium mb-4">In-App Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inapp-lead-updates">Lead status updates</Label>
                    <Switch 
                      id="inapp-lead-updates" 
                      checked={notificationPreferences.inApp.leadUpdates}
                      onCheckedChange={() => toggleNotificationPreference('inApp', 'leadUpdates')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inapp-lead-assignments">Lead assignments</Label>
                    <Switch 
                      id="inapp-lead-assignments" 
                      checked={notificationPreferences.inApp.leadAssignments}
                      onCheckedChange={() => toggleNotificationPreference('inApp', 'leadAssignments')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inapp-follow-ups">Follow-up reminders</Label>
                    <Switch 
                      id="inapp-follow-ups" 
                      checked={notificationPreferences.inApp.followUps}
                      onCheckedChange={() => toggleNotificationPreference('inApp', 'followUps')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleNotificationPreferencesChange} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
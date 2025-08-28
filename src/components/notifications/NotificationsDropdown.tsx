import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/lib/socket';

interface Notification {
  _id: string;
  type: 'leadUpdate' | 'leadAssignment' | 'followUp';
  message: string;
  read: boolean;
  relatedLead?: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=10');
      setNotifications(response.data.data);
      
      const countResponse = await api.get('/notifications/unread');
      setUnreadCount(countResponse.data.count);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Listen for new notifications
    if (socket) {
      socket.on('notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
    };
  }, [socket]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await api.put(`/notifications/${notification._id}`);
        setNotifications(notifications.map(n => 
          n._id === notification._id ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(prev - 1, 0));
      }
      
      if (notification.relatedLead) {
        navigate(`/leads/${notification.relatedLead._id}`);
      }
    } catch (error) {
      console.error('Error marking notification as read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read', error);
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No notifications</div>
          ) : (
            <DropdownMenuGroup>
              {notifications.map((notification) => (
                <DropdownMenuItem 
                  key={notification._id}
                  className={`p-3 cursor-pointer ${!notification.read ? 'bg-accent/50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex items-start justify-between">
                      <span className="font-medium">{notification.type === 'leadUpdate' ? 'Lead Update' : 
                        notification.type === 'leadAssignment' ? 'Lead Assigned' : 'Follow-up'}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatNotificationDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
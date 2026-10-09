import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Megaphone, AlertTriangle, Calendar } from 'lucide-react';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from '@/services/notifications.service';

const typeIcon = {
  reminder: Calendar,
  alert: AlertTriangle,
  announcement: Megaphone,
};

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    try {
      const list = await fetchNotifications();
      setItems(list);
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const unread = items.filter((n) => !n.readAt).length;

  const handleClick = async (n: NotificationItem) => {
    await markNotificationRead(n.id);
    setOpen(false);
    if (n.linkPath) navigate(n.linkPath);
    load();
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-md text-gray-500 hover:text-gray-600 relative"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl ring-1 ring-black/5 z-50">
            <div className="p-3 border-b flex justify-between items-center">
              <span className="font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <button
                  type="button"
                  className="text-xs text-cyan-600"
                  onClick={async () => {
                    await markAllNotificationsRead();
                    load();
                  }}
                >
                  Mark all read
                </button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 text-center">No notifications</p>
            ) : (
              <ul>
                {items.map((n) => {
                  const Icon = typeIcon[n.type] ?? Bell;
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleClick(n)}
                        className={`w-full text-left px-3 py-3 hover:bg-gray-50 border-b flex gap-2 ${
                          !n.readAt ? 'bg-cyan-50/50' : ''
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 mt-0.5 ${
                            n.type === 'alert'
                              ? 'text-amber-500'
                              : n.type === 'announcement'
                                ? 'text-blue-500'
                                : 'text-cyan-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{n.title}</p>
                          {n.body && <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>}
                          <p className="text-[10px] text-gray-400 mt-1">
                            {new Date(n.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;

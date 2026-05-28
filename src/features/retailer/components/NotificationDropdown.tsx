import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  Check,
  CheckCheck,
  Package,
  AlertTriangle,
  CreditCard,
  Info,
  Trash2,
} from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
} from "../queries/notification.queries";
import type { Notification } from "../types/notification";

interface NotificationDropdownProps {
  retailerId: string;
}

const getNotificationIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes("order")) return <Package size={16} className="text-[#B6A092]" />;
  if (t.includes("stock") || t.includes("alert")) return <AlertTriangle size={16} className="text-[#E57A7A]" />;
  if (t.includes("payment") || t.includes("subscription")) return <CreditCard size={16} className="text-[#4E9F6E]" />;
  return <Info size={16} className="text-[#C9A390]" />;
};

export function NotificationDropdown({ retailerId }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useNotifications(retailerId, { pageNumber: 1, pageSize: 20 });
  const { mutate: markAsRead } = useMarkNotificationRead(retailerId);
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsRead(retailerId);
  const { mutate: deleteNotification } = useDeleteNotification(retailerId);

  const notifications = data?.data?.items || [];
  const unreadCount = data?.data?.unreadCount || 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (e: React.MouseEvent, id: string, isRead: boolean) => {
    e.stopPropagation();
    if (!isRead) {
      markAsRead(id);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#949E96] hover:bg-[#F5F1EF] hover:text-[#B6A092] transition-colors focus:outline-none"
      >
        <Bell size={22} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#E57A7A] border-2 border-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 rounded-[16px] border border-[#E4DCD1] bg-white shadow-xl animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#F0EDEB] px-4 py-3 bg-[#FAFAFA]">
            <h3 className="text-[15px] font-bold text-[#B6A092]" style={{ fontFamily: '"PT Serif", serif' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                disabled={isMarkingAll}
                className="flex items-center gap-1.5 text-[12px] font-medium text-[#949E96] hover:text-[#B6A092] transition-colors disabled:opacity-50"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-[#949E96]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#E4DCD1] border-t-[#B6A092]"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#BFC7DE]">
                <Bell size={32} className="mb-2 opacity-20" />
                <p className="text-[14px]">No notifications yet</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    onClick={(e) => handleMarkAsRead(e, notification.id, notification.isRead)}
                    className={`group relative flex items-start gap-3 rounded-[12px] p-3 transition-colors cursor-pointer ${
                      notification.isRead ? "bg-white hover:bg-[#FAFAFA]" : "bg-[#FDFCFB] hover:bg-[#F5F1EF]"
                    }`}
                  >
                    {!notification.isRead && (
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-[#E57A7A]"></span>
                    )}

                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ml-1 ${
                        notification.isRead ? "bg-[#F5F1EF]" : "bg-[#F0EDEB]"
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                      <p className={`text-[14px] leading-tight ${notification.isRead ? "text-[#8A8A8A]" : "text-[#555] font-semibold"}`}>
                        {notification.title}
                      </p>
                      <p className="text-[12px] text-[#949E96] mt-1 line-clamp-2 leading-relaxed">
                        {notification.body}
                      </p>
                      <p className="text-[11px] text-[#BFC7DE] mt-1.5 font-medium">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="p-1.5 text-[#BFC7DE] hover:bg-white rounded-md hover:text-[#E57A7A] hover:shadow-sm transition-all"
                        title="Delete notification"
                      >
                        <Trash2 size={14} />
                      </button>
                      {!notification.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(e, notification.id, false)}
                          className="p-1.5 text-[#BFC7DE] hover:bg-white rounded-md hover:text-[#4E9F6E] hover:shadow-sm transition-all"
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

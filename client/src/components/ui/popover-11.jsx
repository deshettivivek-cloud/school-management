'use client';

import { useState } from 'react';
import {
  BellIcon,
  CheckCheckIcon,
  Settings2Icon,
  ClockIcon,
  RocketIcon,
  ShieldAlertIcon,
  CloudCheckIcon,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const notifications = [
  {
    id: 1,
    icon: RocketIcon,
    message: 'Production deployment #842 successful',
    category: 'System',
    color: 'bg-[#5B3FD8]/10 text-[#5B3FD8] dark:text-[#FBBF24]',
    time: '12 min',
  },
  {
    id: 2,
    icon: ShieldAlertIcon,
    message: 'Unauthorized access attempt blocked',
    category: 'Security',
    color: 'bg-red-500/10 text-red-600 dark:text-red-400',
    time: '45 min',
  },
  {
    id: 3,
    icon: CloudCheckIcon,
    message: 'Architecture backup completed successfully',
    category: 'Backup',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    time: '2 hours',
  },
];

const Popover11 = () => {
  const [readMessages, setReadMessages] = useState([3]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative group rounded-xl border-slate-200 transition-all hover:bg-slate-100 active:scale-95 dark:border-white/10 dark:hover:bg-white/10">
          <BellIcon
            className="size-4 text-slate-700 dark:text-white transition-transform group-hover:scale-110" />
          {notifications.filter((i) => !readMessages.includes(i.id)).length > 0 && (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[#FBBF24]" />
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl dark:border-white/10 dark:bg-[#162B5B] dark:text-white">
        <div className="flex flex-col">
          <div
            className="flex items-center justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-white/10 dark:bg-[#162B5B]">
            <div className="flex items-center gap-2.5">
              <span
                className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
                Alerts
              </span>
              <div
                className="rounded-full border border-[#5B3FD8]/30 bg-[#5B3FD8]/10 px-2 py-0.5 text-[10px] font-bold text-[#5B3FD8] dark:text-[#FBBF24]">
                {
                  notifications.filter((i) => !readMessages.includes(i.id))
                    .length
                }{' '}
                new
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                className="size-7 rounded-lg p-0 text-slate-400 transition-colors hover:bg-slate-100 hover:text-[#5B3FD8] dark:hover:bg-white/10 dark:hover:text-[#FBBF24]"
                onClick={() =>
                  setReadMessages(notifications.map((item) => item.id))
                }
                title="Mark all as read">
                <CheckCheckIcon className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                className="size-7 rounded-lg p-0 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                title="Settings">
                <Settings2Icon className="size-3.5" />
              </Button>
            </div>
          </div>

          <ul className="flex flex-col gap-1.5 p-2">
            {notifications.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'group relative flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-all',
                  !readMessages.includes(item.id)
                    ? 'border-slate-100 bg-slate-50/50 dark:border-white/10 dark:bg-white/5'
                    : 'border-transparent bg-transparent hover:border-slate-100 hover:bg-slate-50 dark:hover:border-white/10 dark:hover:bg-white/5'
                )}
                onClick={() => setReadMessages([...readMessages, item.id])}>
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-xl border border-transparent transition-all group-hover:scale-105',
                    item.color
                  )}>
                  <item.icon className="size-4" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0">
                  <div
                    className="line-clamp-2 text-[12px] leading-tight font-semibold tracking-tight text-slate-900 dark:text-white">
                    {item.message}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p className="text-[9px] font-medium text-slate-500 dark:text-white/60">
                      {item.category}
                    </p>
                    <div className="flex items-center gap-1.5 opacity-60">
                      <ClockIcon className="size-2.5 text-slate-400 dark:text-white/60" />
                      <p
                        className="text-[9px] font-normal tracking-tight whitespace-nowrap text-slate-500 dark:text-white/60">
                        {item.time} ago
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="border-t border-slate-100 p-3 dark:border-white/10">
            <Button
              variant="outline"
              className="w-full rounded-xl border-slate-200 bg-white text-[11px] font-semibold text-slate-600 shadow-none transition-all hover:text-[#5B3FD8] active:scale-95 dark:border-white/10 dark:bg-[#162B5B] dark:text-white dark:hover:text-[#FBBF24]">
              View all alerts
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Popover11;

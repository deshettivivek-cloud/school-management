'use client';

import { useState } from 'react';
import { FunnelIcon, RotateCcwIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

const filters = ['Architectural', 'Structural', 'Electrical', 'Plumbing'];

const Popover9 = () => {
  const [selected, setSelected] = useState(['Architectural', 'Structural']);
  const [price, setPrice] = useState([450]);

  return (
    <Popover>
      <PopoverTrigger asChild backdrop-blur-sm>
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl transition-all border-slate-200 hover:bg-slate-100 active:scale-95 dark:border-white/10 dark:hover:bg-white/10">
          <FunnelIcon className="size-4 text-slate-700 dark:text-white" />
          <span className="sr-only">Filter</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-white/10 dark:bg-[#162B5B] dark:text-white">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4 pb-1">
            <div className="flex flex-col gap-0.5">
              <span
                className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Advanced Filters
              </span>
              <p className="text-[11px] font-medium text-slate-500 dark:text-white/60">
                Filter by attributes
              </p>
            </div>
            <Button
              variant="outline"
              className="h-8 gap-1.5 rounded-xl border-slate-200 px-3 py-1 text-[11px] font-bold text-slate-500 hover:text-[#5B3FD8] dark:border-white/10 dark:text-white/70 dark:hover:text-[#FBBF24]"
              onClick={() => {
                setSelected(['Architectural', 'Structural']);
                setPrice([450]);
              }}>
              <RotateCcwIcon className="size-3.5" />
              Reset all
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm text-slate-400 dark:text-white/60">Filter category</Label>
            <div className="flex flex-col gap-1.5">
              {filters.map((label, index) => (
                <div
                  key={index}
                  className="group flex cursor-pointer items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
                  onClick={() => {
                    setSelected(selected.includes(label)
                      ? selected.filter((item) => item !== label)
                      : [...selected, label]);
                  }}>
                  <Checkbox
                    id={`filter-${index + 1}`}
                    checked={selected.includes(label)}
                    onCheckedChange={(checked) =>
                      setSelected(checked
                        ? [...selected, label]
                        : selected.filter((item) => item !== label))
                    }
                    className="size-4.5 rounded-md border-slate-300 data-[state=checked]:border-[#5B3FD8] data-[state=checked]:bg-[#5B3FD8]" />
                  <Label
                    htmlFor={`filter-${index + 1}`}
                    className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-white">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-400 dark:text-white/60">Budget range</Label>
              <span className="text-xs font-bold text-[#5B3FD8] dark:text-[#FBBF24]">
                $0 - ${price[0]}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <Slider
                value={price}
                onValueChange={setPrice}
                step={50}
                max={1000}
                className="[&>[data-slot=slider-range]]:bg-[#5B3FD8] [&>[data-slot=slider-thumb]]:border-[#5B3FD8]"
                aria-label="Price range" />
              <div
                className="flex w-full items-center justify-between gap-1 px-0.5 text-[10px] font-medium text-slate-400 dark:text-white/50 opacity-60">
                <span>0</span>
                <span>500</span>
                <span>1000+</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Popover9;

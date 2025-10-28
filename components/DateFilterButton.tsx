"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, X } from "lucide-react";

export default function DateFilterButton() {
  const router = useRouter();
  const pathname = usePathname(); // Auto-detect current path
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Initialize from URL params
  useEffect(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      setSelectedDate(new Date(dateParam));
    }
  }, [searchParams]);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);

    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      // Use current pathname, just add date param
      router.push(`${pathname}?date=${formattedDate}`);
    } else {
      // Clear filter - go back to current pathname without params
      router.push(pathname);
    }

    setIsOpen(false);
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
    // Clear filter - go back to current pathname without params
    router.push(pathname);
  };

  const formatDisplayDate = () => {
    if (selectedDate) {
      return selectedDate.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      {/* Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-purple-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-purple-400 hover:shadow-md"
      >
        <Calendar className="h-5 w-5 text-purple-600" />
        <span className="hidden sm:inline">{formatDisplayDate()}</span>
        <span className="sm:hidden">
          {selectedDate
            ? selectedDate.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })
            : new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              })}
        </span>
        {selectedDate && (
          <X
            className="h-4 w-4 text-gray-400 hover:text-red-600 transition-colors"
            onClick={clearFilter}
          />
        )}
      </button>

      {/* DatePicker Popup - Fixed Position */}
      {isOpen && (
        <div
          ref={wrapperRef}
          className="fixed z-[9999]"
          style={{
            top: `${position.top}px`,
            right: `${position.right}px`,
          }}
        >
          <div className="rounded-xl border border-gray-200 bg-white shadow-2xl">
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Pilih Tanggal
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => handleDateChange(null)}
                    className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              <DatePicker
                selected={selectedDate}
                onChange={handleDateChange}
                inline
                maxDate={new Date()}
                dateFormat="dd/MM/yyyy"
                calendarClassName="custom-calendar"
              />
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx global>{`
        .react-datepicker__month-container {
          background-color: white;
        }

        .custom-calendar {
          font-family: inherit;
          border: none;
        }

        .react-datepicker {
          border: none;
          box-shadow: none;
          font-family: inherit;
        }

        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          padding-top: 0.75rem;
          border-radius: 0;
        }

        .react-datepicker__current-month {
          font-weight: 600;
          color: #111827;
          font-size: 0.95rem;
          padding-bottom: 0.5rem;
        }

        .react-datepicker__day-names {
          display: flex;
          justify-content: space-around;
          padding: 0.5rem 0;
        }

        .react-datepicker__day-name {
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 600;
          width: 2.5rem;
          line-height: 2rem;
        }

        .react-datepicker__month {
          margin: 0.5rem;
        }

        .react-datepicker__week {
          display: flex;
          justify-content: space-around;
        }

        .react-datepicker__day {
          color: #374151;
          border-radius: 0.5rem;
          transition: all 0.15s;
          width: 2.5rem;
          line-height: 2.5rem;
          margin: 0.1rem;
          font-size: 0.875rem;
        }

        .react-datepicker__day:hover {
          background-color: #f3e8ff;
          color: #7c3aed;
        }

        .react-datepicker__day--selected {
          background-color: #9333ea !important;
          color: white !important;
          font-weight: 600;
        }

        .react-datepicker__day--keyboard-selected {
          background-color: #e9d5ff;
          color: #6b21a8;
        }

        .react-datepicker__day--today {
          font-weight: 600;
          color: #9333ea;
          background-color: #faf5ff;
          border: 2px solid #9333ea;
        }

        .react-datepicker__day--today:hover {
          background-color: #f3e8ff;
        }

        .react-datepicker__day--disabled {
          color: #d1d5db;
          cursor: not-allowed;
        }

        .react-datepicker__day--disabled:hover {
          background-color: transparent;
        }

        .react-datepicker__navigation {
          top: 0.75rem;
        }

        .react-datepicker__navigation-icon::before {
          border-color: #6b7280;
          border-width: 2px 2px 0 0;
          height: 7px;
          width: 7px;
        }

        .react-datepicker__navigation:hover *::before {
          border-color: #111827;
        }

        .react-datepicker__navigation--previous {
          left: 1rem;
        }

        .react-datepicker__navigation--next {
          right: 1rem;
        }
      `}</style>
    </>
  );
}

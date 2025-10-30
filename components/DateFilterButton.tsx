"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, X } from "lucide-react";

export default function DateFilterButton() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);

  // Initialize portal container once
  useEffect(() => {
    if (!portalContainerRef.current) {
      const container = document.createElement("div");
      container.id = "date-picker-portal";
      document.body.appendChild(container);
      portalContainerRef.current = container;
    }
    setIsMounted(true);

    return () => {
      if (portalContainerRef.current) {
        document.body.removeChild(portalContainerRef.current);
        portalContainerRef.current = null;
      }
    };
  }, []);

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
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      const formattedDate = date.toISOString().split("T")[0];
      router.push(`${pathname}?date=${formattedDate}`);
    } else {
      router.push(pathname);
    }
    setIsOpen(false);
  };

  const clearFilter = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDate(null);
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
      <div
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border-2 border-purple-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-purple-400 hover:shadow-md cursor-pointer"
      >
        <Calendar className="h-5 w-5 text-purple-600" />
        <div className="flex flex-col items-start">
          <span className="text-xs text-gray-500">{formatDisplayDate()}</span>
          <span className="font-semibold text-purple-600">
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
        </div>
        {selectedDate && (
          <X
            className="h-4 w-4 text-gray-400 hover:text-red-500"
            onClick={clearFilter}
          />
        )}
      </div>

      {/* Portal Calendar */}
      {isMounted &&
        portalContainerRef.current &&
        isOpen &&
        createPortal(
          <div
            ref={wrapperRef}
            style={{
              position: "fixed",
              top: `${position.top}px`,
              right: `${position.right}px`,
              zIndex: 9999,
            }}
            className="rounded-lg border-2 border-purple-100 bg-white p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
              <h3 className="text-sm font-semibold text-gray-700">
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
              locale="id"
              dateFormat="dd/MM/yyyy"
            />
          </div>,
          portalContainerRef.current
        )}

      {/* Custom Styles */}
      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: none;
        }
        .react-datepicker__header {
          background-color: #f3f4f6;
          border-bottom: none;
          padding-top: 12px;
        }
        .react-datepicker__day--selected {
          background-color: #9333ea;
        }
        .react-datepicker__day--selected:hover {
          background-color: #7e22ce;
        }
        .react-datepicker__day:hover {
          background-color: #f3e8ff;
        }
      `}</style>
    </>
  );
}

import React from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
    existingAppointments?: Array<{ fecha: Date }>;
}

export default function Calendar({ 
    selectedDate, 
    onSelectDate, 
    minDate = new Date(), 
    maxDate,
    existingAppointments = []
}: CalendarProps) {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = React.useState(today);

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const isDateValid = (date: Date) => {
        // Check if date is not in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    };

    const isDateSelectable = (date: Date) => {
        if (!isDateValid(date)) return false;
        if (minDate && date < minDate) return false;
        if (maxDate && date > maxDate) return false;
        return true;
    };

    const hasAppointmentOnDate = (date: Date) => {
        return existingAppointments.some(appointment => 
            isSameDay(new Date(appointment.fecha), date)
        );
    };

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={prevMonth}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h2 className="text-lg font-semibold">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-full"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, dayIdx) => {
                    const isSelectable = isDateSelectable(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);
                    const isOtherMonth = !isSameMonth(day, currentMonth);
                    const hasAppointment = hasAppointmentOnDate(day);

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => isSelectable && onSelectDate(day)}
                            disabled={!isSelectable}
                            className={`
                                h-10 w-10 rounded-full flex items-center justify-center text-sm
                                ${isSelectable ? 'hover:bg-blue-50' : 'cursor-not-allowed opacity-50'}
                                ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                                ${isCurrentDay && !isSelected ? 'bg-gray-100' : ''}
                                ${isOtherMonth ? 'text-gray-400' : ''}
                                ${hasAppointment ? 'ring-2 ring-blue-300' : ''}
                            `}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
} 
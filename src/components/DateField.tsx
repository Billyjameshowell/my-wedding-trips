'use client';

import {
  CalendarDay,
  CalendarGrid,
  CalendarHeading,
  CalendarNext,
  CalendarPrevious,
  CalendarWeekday,
  CalendarWeekdays,
  CalendarWeeks,
  DatePicker,
  DatePickerContent,
  DatePickerInput,
  DatePickerTrigger,
  type DatePickerValue,
} from '@ui-sdk/react/date-picker';
import { Field, FieldError, FieldLabel } from '@ui-sdk/react/field';

interface DateFieldProps {
  label: string;
  name: string;
  value: string | null;
  onValueChange: (value: string | null) => void;
  required?: boolean;
  min?: string;
  calendarLabel: string;
  monthNoun: string;
}

export default function DateField({
  label,
  name,
  value,
  onValueChange,
  required,
  min,
  calendarLabel,
  monthNoun,
}: DateFieldProps) {
  return (
    <Field name={name}>
      <FieldLabel>{label}</FieldLabel>
      <DatePicker
        value={value}
        onValueChange={(next: DatePickerValue) => {
          onValueChange(typeof next === 'string' ? next : null);
        }}
        required={required}
        min={min}
      >
        <DatePickerInput placeholder="May 16, 2027" autoComplete="off" />
        <DatePickerTrigger>
          <span aria-hidden="true">📅</span>
          <span className="sr-only">{calendarLabel}</span>
        </DatePickerTrigger>
        <DatePickerContent>
          <div className="mb-2 flex items-center justify-between gap-2">
            <CalendarPrevious>
              <span aria-hidden="true">‹</span>
              <span className="sr-only">Previous {monthNoun} month</span>
            </CalendarPrevious>
            <CalendarHeading />
            <CalendarNext>
              <span aria-hidden="true">›</span>
              <span className="sr-only">Next {monthNoun} month</span>
            </CalendarNext>
          </div>
          <CalendarGrid>
            <CalendarWeekdays>
              {(index) => <CalendarWeekday index={index} />}
            </CalendarWeekdays>
            <CalendarWeeks>
              {(cell) => <CalendarDay key={cell.date} value={cell.date} />}
            </CalendarWeeks>
          </CalendarGrid>
        </DatePickerContent>
      </DatePicker>
      <FieldError match="valueMissing">Choose a date.</FieldError>
      <FieldError match="badInput">Enter a date like May 16, 2027.</FieldError>
    </Field>
  );
}

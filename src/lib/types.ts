export type TrackerStatus = 'not_started' | 'watching' | 'booked' | 'done';

export interface FlightInfo {
  origin: string; // airport code e.g. "LAX"
  destination: string; // airport code e.g. "JFK"
  departureDate: string; // ISO date
  returnDate: string; // ISO date
  pricePaid?: number;
  priceHistory: { date: string; price: number }[];
  priceThreshold?: number; // notify below this
}

export interface AddWeddingInput {
  coupleName: string;
  date: string;
  location: string;
  venue?: string;
  flight?: Pick<FlightInfo, 'origin' | 'destination' | 'departureDate' | 'returnDate'>;
}

export interface Wedding {
  id: string;
  coupleName: string; // e.g. "Sarah & Mike"
  date: string; // ISO date
  location: string; // e.g. "Austin, TX"
  venue?: string;
  flightStatus: TrackerStatus;
  hotelStatus: TrackerStatus;
  giftStatus: TrackerStatus;
  flight?: FlightInfo;
  hotelDetails?: string;
  giftDetails?: string;
  notes?: string;
  createdAt: string;
  color: string; // accent color for the card
}

export const STATUS_LABELS: Record<TrackerStatus, string> = {
  not_started: 'Not Started',
  watching: 'Watching',
  booked: 'Booked',
  done: 'Done',
};

export const STATUS_ORDER: TrackerStatus[] = ['not_started', 'watching', 'booked', 'done'];

export const CARD_COLORS = [
  '#E8917F', // warm coral
  '#7FB5E8', // sky blue
  '#9BE87F', // fresh green
  '#E8D47F', // golden
  '#C47FE8', // lavender
  '#7FE8D4', // teal
  '#E87FA8', // rose
  '#7F9BE8', // periwinkle
];

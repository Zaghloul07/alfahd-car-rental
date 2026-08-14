export type ListingType = "rent" | "sale";
export type RentTerm = "short_term" | "long_term";
export type ListingStatus = "draft" | "published" | "sold" | "rented";

// NOTE: these must stay `type` (not `interface`) — Supabase's generated
// types rely on structural checks against `Record<string, unknown>` that
// interfaces don't satisfy, which silently collapses query results to `never`.
export type CarRow = {
  id: string;
  created_at: string;
  listing_type: ListingType;
  status: ListingStatus;
  make: string;
  model: string;
  year: number;
  title: string;
  description: string | null;
  images: string[];
  mileage_km: number | null;
  transmission: "automatic" | "manual" | null;
  fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | null;
  category: string | null;
  location: string;
  // Sale-specific
  sale_price: number | null;
  price_negotiable: boolean;
  installment_available: boolean;
  inspected: boolean;
  // Rent-specific
  rent_term: RentTerm | null;
  daily_price: number | null;
  monthly_price: number | null;
};

export type ProfileRow = {
  id: string;
  email: string;
  is_admin: boolean;
  role: "admin" | "inspector" | null;
  created_at: string;
};

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  national_id_front_url: string | null;
  national_id_back_url: string | null;
  driving_license_url: string | null;
  documents_submitted_at: string | null;
  created_at: string;
};

export type ReservationStatus =
  | "pending"
  | "approved"
  | "confirmed"
  | "rejected"
  | "cancelled"
  | "delivered"
  | "completed";

export type ReservationRow = {
  id: string;
  car_id: string;
  customer_id: string;
  status: ReservationStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  amount_due: number | null;
  amount_paid: number;
  paid_at: string | null;
  paid_by: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
};

export type HandoverType = "delivery" | "return";
export type FuelLevel = "empty" | "quarter" | "half" | "three_quarter" | "full";
export type HandoverPhotoType = "odometer" | "fuel" | "body";

export type HandoverReportRow = {
  id: string;
  reservation_id: string;
  type: HandoverType;
  odometer_km: number;
  fuel_level: FuelLevel;
  notes: string | null;
  signature_path: string;
  created_by: string;
  created_at: string;
};

export type HandoverPhotoRow = {
  id: string;
  handover_id: string;
  photo_type: HandoverPhotoType;
  storage_path: string;
  created_at: string;
};

export type NotificationType =
  | "reservation_created"
  | "reservation_approved"
  | "reservation_rejected"
  | "reservation_cancelled"
  | "documents_submitted"
  | "payment_marked_paid"
  | "reservation_confirmed"
  | "handover_delivered"
  | "handover_returned"
  | "fine_added";

export type NotificationRow = {
  id: string;
  recipient_role: "admin" | "inspector";
  type: NotificationType;
  reservation_id: string | null;
  message: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type ReservationChargeRow = {
  id: string;
  reservation_id: string;
  amount: number;
  reason: string;
  created_by: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      cars: {
        Row: CarRow;
        Insert: Partial<CarRow> & {
          listing_type: ListingType;
          make: string;
          model: string;
          year: number;
          title: string;
          location: string;
        };
        Update: Partial<CarRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; email: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      customers: {
        Row: CustomerRow;
        Insert: Partial<CustomerRow> & { id: string; name: string; phone: string };
        Update: Partial<CustomerRow>;
        Relationships: [];
      };
      reservations: {
        Row: ReservationRow;
        Insert: Partial<ReservationRow> & { car_id: string; customer_id: string };
        Update: Partial<ReservationRow>;
        Relationships: [];
      };
      handover_reports: {
        Row: HandoverReportRow;
        Insert: Partial<HandoverReportRow> & {
          id: string;
          reservation_id: string;
          type: HandoverType;
          odometer_km: number;
          fuel_level: FuelLevel;
          signature_path: string;
          created_by: string;
        };
        Update: Partial<HandoverReportRow>;
        Relationships: [];
      };
      handover_photos: {
        Row: HandoverPhotoRow;
        Insert: Partial<HandoverPhotoRow> & {
          handover_id: string;
          photo_type: HandoverPhotoType;
          storage_path: string;
        };
        Update: Partial<HandoverPhotoRow>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow> & { recipient_role: "admin" | "inspector"; type: NotificationType; message: string };
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      reservation_charges: {
        Row: ReservationChargeRow;
        Insert: Partial<ReservationChargeRow> & {
          reservation_id: string;
          amount: number;
          reason: string;
          created_by: string;
        };
        Update: Partial<ReservationChargeRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_car_availability: {
        Args: Record<string, never>;
        Returns: { reservation_id: string; car_id: string; start_date: string; end_date: string }[];
      };
      create_notification: {
        Args: {
          p_recipient_role: string;
          p_type: string;
          p_reservation_id: string | null;
          p_message: string;
          p_link: string | null;
        };
        Returns: undefined;
      };
    };
  };
};

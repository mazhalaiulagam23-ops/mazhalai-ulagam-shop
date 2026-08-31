CREATE TYPE public.enquiry_type AS ENUM ('enquiry', 'complaint');
CREATE TYPE public.enquiry_status AS ENUM ('new', 'in_progress', 'resolved');

CREATE SEQUENCE public.enquiry_ref_seq START WITH 10025;

CREATE TABLE public.enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE DEFAULT ('MH' || nextval('public.enquiry_ref_seq')::text),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  mobile text NOT NULL,
  email text NOT NULL,
  order_number text NOT NULL DEFAULT '',
  product text NOT NULL,
  type public.enquiry_type NOT NULL DEFAULT 'enquiry',
  message text NOT NULL,
  status public.enquiry_status NOT NULL DEFAULT 'new',
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.enquiries TO authenticated;
GRANT UPDATE ON public.enquiries TO authenticated;
GRANT ALL ON public.enquiries TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.enquiry_ref_seq TO service_role;

ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enquiries"
ON public.enquiries FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all enquiries"
ON public.enquiries FOR SELECT TO authenticated
USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update enquiries"
ON public.enquiries FOR UPDATE TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE TRIGGER enquiries_updated_at
BEFORE UPDATE ON public.enquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX enquiries_created_at_idx ON public.enquiries (created_at DESC);
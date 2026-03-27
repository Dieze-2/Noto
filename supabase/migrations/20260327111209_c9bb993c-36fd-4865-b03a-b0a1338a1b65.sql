
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid());

-- Allow coaches to read profiles of their accepted athletes
CREATE POLICY "Coaches can read athlete profiles"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes
    WHERE coach_athletes.coach_id = auth.uid()
      AND coach_athletes.athlete_id = profiles.id
      AND coach_athletes.status = 'accepted'
  )
);

-- Allow athletes to read their coach's profile
CREATE POLICY "Athletes can read coach profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.coach_athletes
    WHERE coach_athletes.athlete_id = auth.uid()
      AND coach_athletes.coach_id = profiles.id
      AND coach_athletes.status = 'accepted'
  )
);

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

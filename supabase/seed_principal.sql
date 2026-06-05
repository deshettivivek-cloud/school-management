-- RUN THIS SCRIPT IN THE SUPABASE SQL EDITOR TO PROMOTE AN EXISTING USER TO PRINCIPAL
-- 
-- 1. First, sign up a new user via the app's login/signup page. 
--    (This creates the auth.users record and the profiles record automatically).
--
-- 2. Then, run this SQL script in the Supabase SQL editor, replacing the 
--    email address with the one you just used to sign up.

UPDATE profiles 
SET role = 'principal' 
WHERE email = 'admin@yourschool.com'; -- Replace with the actual email!

-- Verify the update
SELECT id, name, email, role FROM profiles WHERE email = 'admin@yourschool.com';

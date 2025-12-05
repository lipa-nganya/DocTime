-- Insert Team Members from Local Database to Cloud SQL
-- Database Credentials (hardcoded):
--   Username: doctime_user
--   Password: DoctimeCloud2024Secure
--   Database: doctime
--   Instance: doctime-db

-- Get the first user ID from Cloud SQL (or use a specific one)
-- This script will use the first available user ID if the original doesn't exist
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Try to get the original user ID, or use the first available user
  SELECT COALESCE(
    (SELECT id FROM users WHERE id = '42e4f107-f5c3-49dd-bbe4-f20872c1d84b' LIMIT 1),
    (SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1)
  ) INTO target_user_id;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in database. Please create a user first.';
  END IF;
  
  -- Insert team members using the target_user_id
  INSERT INTO team_members (id, "userId", role, "otherRole", name, "phoneNumber", "isSystemDefined", "createdAt", "updatedAt")
  VALUES
    ('ec56f0ac-e734-44d1-81c1-85b7e6f4bff4', target_user_id, 'Surgeon', NULL, 'Dr Muhinga', NULL, true, '2025-11-29T16:15:37.463Z', '2025-11-29T16:15:37.463Z'),
    ('cde0b2e8-646a-4ea2-b6c0-4a13070a54a4', target_user_id, 'Surgeon', NULL, 'Dr. Mutie', NULL, true, '2025-11-29T16:15:37.476Z', '2025-11-29T16:15:37.476Z'),
    ('51616584-f570-48bc-9aa8-bd56bdbd38d5', target_user_id, 'Other', 'Cath Lab', 'Cath Lab', NULL, true, '2025-11-29T16:15:37.479Z', '2025-11-29T16:15:37.479Z'),
    ('b6895c94-adfa-488b-9cd5-5b0915bb622e', target_user_id, 'Surgeon', NULL, 'Dr Oburu', NULL, true, '2025-11-29T16:15:37.484Z', '2025-11-29T16:15:37.484Z'),
    ('ff8fcce2-5741-4e96-b3be-dd862f6fe1c5', target_user_id, 'Surgeon', NULL, 'Dr John Bosco', NULL, true, '2025-11-29T16:15:37.488Z', '2025-11-29T16:15:37.488Z'),
    ('9c4e1607-ee16-4e70-ac06-82d998eb0b7e', target_user_id, 'Surgeon', NULL, 'Dr Ayo', NULL, true, '2025-11-29T16:15:37.493Z', '2025-11-29T16:15:37.493Z'),
    ('b53244bb-4e08-47de-810a-4a549f4550b2', target_user_id, 'Surgeon', NULL, 'Dr Dindi', NULL, true, '2025-11-29T16:15:37.496Z', '2025-11-29T16:15:37.496Z'),
    ('cd3bbacb-1405-4227-be89-ee5630fb40a5', target_user_id, 'Other', 'Cardiac Team', 'Mater Cardiac Team', NULL, true, '2025-11-29T16:15:37.506Z', '2025-11-29T16:15:37.506Z'),
    ('433d5a5b-6288-4695-9e8f-53bb7c3a7680', target_user_id, 'Surgeon', NULL, 'Dr Mwai', NULL, true, '2025-11-29T16:15:37.508Z', '2025-11-29T16:15:37.508Z'),
    ('63db073f-14d7-4ac7-b2d4-bcfc44dbf375', target_user_id, 'Surgeon', NULL, 'Dr Njihia', NULL, true, '2025-11-29T16:15:37.511Z', '2025-11-29T16:15:37.511Z'),
    ('abf1bacc-57b7-4dd2-a2dd-8801e355a9be', target_user_id, 'Surgeon', NULL, 'Dr Aketch', NULL, true, '2025-11-29T16:15:37.513Z', '2025-11-29T16:15:37.513Z'),
    ('72871760-8e98-4782-a9e8-e6d415fe6ac7', target_user_id, 'Surgeon', NULL, 'Prof Joey', NULL, true, '2025-11-29T16:15:37.517Z', '2025-11-29T16:15:37.517Z'),
    ('a58f0fb0-e93d-4859-99c4-06f000081cf4', target_user_id, 'Surgeon', NULL, 'Dr Makori', NULL, true, '2025-11-29T16:15:37.519Z', '2025-11-29T16:15:37.519Z'),
    ('2f357c94-8dee-4922-b0cd-22b983218165', target_user_id, 'Surgeon', NULL, 'Dr Kiptoon', NULL, true, '2025-11-29T16:15:37.521Z', '2025-11-29T16:15:37.521Z'),
    ('0f4ce95a-90c1-483d-aef9-3404b99ab1f4', target_user_id, 'Surgeon', NULL, 'Dr Nderitu', NULL, true, '2025-11-29T16:15:37.523Z', '2025-11-29T16:15:37.523Z'),
    ('f0ed817b-03b5-4153-981c-ef977090bfea', target_user_id, 'Surgeon', NULL, 'Dr Kipingor', NULL, true, '2025-11-29T16:15:37.525Z', '2025-11-29T16:15:37.525Z')
  ON CONFLICT (id) DO UPDATE SET
    "userId" = EXCLUDED."userId",
    role = EXCLUDED.role,
    "otherRole" = EXCLUDED."otherRole",
    name = EXCLUDED.name,
    "phoneNumber" = EXCLUDED."phoneNumber",
    "isSystemDefined" = EXCLUDED."isSystemDefined",
    "updatedAt" = EXCLUDED."updatedAt";
END $$;

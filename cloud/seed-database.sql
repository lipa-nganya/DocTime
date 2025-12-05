-- Doc Time Database Seed Data
-- Run this script to populate the Cloud SQL database with initial data
--
-- Database Credentials (hardcoded):
--   Username: doctime_user
--   Password: DoctimeCloud2024Secure
--   Database: doctime
--   Instance: doctime-db (IP: 34.27.171.24)
--
-- To run this file:
--   Option 1: Use run-migrations.sh script (recommended)
--     ./cloud/run-migrations.sh
--
--   Option 2: Direct psql command (replace HOST with actual IP):
--     psql "postgresql://doctime_user:DoctimeCloud2024Secure@34.27.171.24:5432/doctime?sslmode=require" -f seed-database.sql
--
--   Option 3: Using gcloud sql connect:
--     gcloud sql connect doctime-db --user=doctime_user --database=doctime
--     Then run: \i seed-database.sql
--
-- Note: Run create-tables.sql first before running this script

-- ============================================
-- FACILITIES
-- ============================================
INSERT INTO facilities (id, name, "isSystemDefined", "createdAt", "updatedAt") VALUES 
('5aa02b9e-66a5-4e51-9a3f-54f7ddb2d369', 'Coptic', true, NOW(), NOW()),
('1d9c1e81-00ca-491f-be17-06b097ee5d59', 'Nairobi Hospital', true, NOW(), NOW()),
('a6b88da1-12cd-49a4-8ab3-29b0199265f7', 'Mater', true, NOW(), NOW()),
('429e2ff2-7a67-4f59-9fe3-fdcc11637a06', 'Gertrudes', true, NOW(), NOW()),
('87579483-50a5-4c10-bc14-5640c17e20ac', 'Karen Hospital', true, NOW(), NOW()),
('94a90501-287a-4d0e-a31b-4aeb98fc8d1a', 'MP Shah', true, NOW(), NOW()),
('fd392c00-c64c-49f6-8071-0dec0e2c0a30', 'KNH', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PAYERS
-- ============================================
INSERT INTO payers (id, name, "isSystemDefined", "createdAt", "updatedAt") VALUES 
('108bf0af-68ea-4d6f-83f4-df94f57ebd53', 'Jubilee', true, NOW(), NOW()),
('c60513df-9da5-4865-9dda-5354b1b8446d', 'AoN', true, NOW(), NOW()),
('7a345a8d-ddf4-4c25-83e8-dc4d53240a52', 'KHA', true, NOW(), NOW()),
('b701aae2-c52b-4ec5-8e91-2b7af89f9588', 'Mater', true, NOW(), NOW()),
('73be6921-0fba-40b5-814a-a7bf47f3a201', 'Gertrudes', true, NOW(), NOW()),
('3a6edd31-d5d1-4fd9-9ae5-77e8acc5ebea', 'MP Shah', true, NOW(), NOW()),
('6a802efb-bae8-4e79-b6ce-bf322cd9c520', 'Karen', true, NOW(), NOW()),
('851e840e-402d-453f-b5e4-a79ccbf2c211', 'GA', true, NOW(), NOW()),
('5bc1cbb7-e7e7-464a-8c6c-9c7f2674df2a', 'Minet', true, NOW(), NOW()),
('d9b1ce70-d407-46fa-9f18-2819211a66f3', 'APA', true, NOW(), NOW()),
('e3d38f20-a57c-4a9d-a7f3-ac73b9824a60', 'CIC', true, NOW(), NOW()),
('dd4d3e78-d47d-41fe-a9f4-998c6b67a48d', 'KNH', true, NOW(), NOW()),
('d7bec1e3-fc2b-4753-a7ca-90c45cde01f9', 'Coptic', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- PROCEDURES
-- ============================================
INSERT INTO procedures (id, name, "isSystemDefined", "createdAt", "updatedAt") VALUES 
('a22b11aa-473c-4526-a52d-eaac6a91f425', 'ASD', true, NOW(), NOW()),
('7a858981-92bf-4440-ae85-d1e4eb1719e2', 'VSD', true, NOW(), NOW()),
('a4aa3f22-4d8b-4051-ad1e-8491c89ad1d1', 'MVR', true, NOW(), NOW()),
('8f457390-a95a-409c-84a9-732606fe5ce8', 'AVR', true, NOW(), NOW()),
('f43f1df2-94f0-48d8-98a2-0e12db75270e', 'DVR', true, NOW(), NOW()),
('9d6523c0-7922-49ce-8a54-b6d6cbf84a06', 'Oesophagectomy', true, NOW(), NOW()),
('60e6bb2d-bb86-46cc-9d80-9fa5df2a5a11', 'Gastrectomy', true, NOW(), NOW()),
('d621a4fb-57f6-40b5-8312-2548b2f544f9', 'CBT', true, NOW(), NOW()),
('abead2bf-5dd2-40c4-b853-2ab27a5828e6', 'Chemoport Insertion', true, NOW(), NOW()),
('d6dc5a82-1ce4-433f-b3a2-829e9132885a', 'Chemoport Removal', true, NOW(), NOW()),
('450155de-06e9-4b21-91c2-4140db85397b', 'AV Fistula', true, NOW(), NOW()),
('5bf3fb96-6809-4d2f-ac80-a08b0e63b0ca', 'Laser Varicose Veins', true, NOW(), NOW()),
('668984fb-899a-4fc4-8cfa-e0a77d408774', 'PDA', true, NOW(), NOW()),
('db587d06-6c12-4e9f-a034-775f3d0d8b37', 'Thoracotomy', true, NOW(), NOW()),
('0f41427e-a844-4fec-a2ec-6d164cb7c357', 'Thoracotomy + Decortication', true, NOW(), NOW()),
('3a549830-6454-4f2f-aab5-c7f6794d5571', 'Thoracotomy + Lobectomy', true, NOW(), NOW()),
('08b70894-abe2-41f6-9d66-c40837a186fb', 'Thoracotomy + Pneumonectomy', true, NOW(), NOW()),
('801fd12b-646a-4a9f-b4cd-10e33975aa3f', 'Diagnostic VATS', true, NOW(), NOW()),
('25bc7ca3-6466-4bca-9b6b-5536e83b46d0', 'Diaphragmatic Hernia Repair', true, NOW(), NOW()),
('df51d300-d3aa-4fc0-b305-795e8265e99e', 'Nissen''s Fundoplication', true, NOW(), NOW()),
('f674d263-8d66-402c-9362-ba3429f234ca', 'AAA repair', true, NOW(), NOW()),
('05c1959b-c283-4e2f-9867-58259deb3ac9', 'AKA', true, NOW(), NOW()),
('34afddb5-0074-4479-85a2-404346738282', 'BKA', true, NOW(), NOW()),
('637c1d87-0e84-44b7-a83f-4ffb72e4ee0f', 'Relook', true, NOW(), NOW()),
('88cce385-55d1-49ec-8bb1-1a7d310c65d0', 'Varicose Veins', true, NOW(), NOW()),
('b63d98e0-79bb-44c9-8337-9dca44f25719', 'Other', true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- ROLES
-- ============================================
INSERT INTO roles (id, name, "teamMemberNames", "createdAt", "updatedAt") VALUES 
('a1b2c3d4-e5f6-4789-a012-b3c4d5e6f789', 'Surgeon', '[]'::jsonb, NOW(), NOW()),
('b2c3d4e5-f6a7-4890-b123-c4d5e6f7a890', 'Assistant Surgeon', '[]'::jsonb, NOW(), NOW()),
('c3d4e5f6-a7b8-4901-c234-d5e6f7a8b901', 'Anaesthetist', '[]'::jsonb, NOW(), NOW()),
('d4e5f6a7-b8c9-4012-d345-e6f7a8b9c012', 'Assistant Anaesthetist', '[]'::jsonb, NOW(), NOW()),
('e5f6a7b8-c9d0-4123-e456-f7a8b9c0d123', 'Other', '[]'::jsonb, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SETTINGS
-- ============================================
INSERT INTO settings (id, key, value, description, "createdAt", "updatedAt") VALUES 
('f6a7b8c9-d0e1-4234-f567-a8b9c0d1e234', 'ENABLE_SMS', 'true', 'Enable/disable OTP SMS sending (cost savings during development)', NOW(), NOW()),
('a7b8c9d0-e1f2-4345-a678-b9c0d1e2f345', 'ENABLE_REFERRAL_SMS', 'true', 'Enable/disable Referral SMS sending (cost savings during development)', NOW(), NOW())
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- TEAM MEMBERS (Optional - only if you have a default user)
-- Note: These require a valid userId. Remove or update userId if needed.
-- ============================================
-- Uncomment and update userId if you have a default user:
/*
INSERT INTO team_members (id, "userId", role, "otherRole", name, "phoneNumber", "isSystemDefined", "createdAt", "updatedAt") VALUES 
('ec56f0ac-e734-44d1-81c1-85b7e6f4bff4', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Muhinga', NULL, true, NOW(), NOW()),
('cde0b2e8-646a-4ea2-b6c0-4a13070a54a4', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr. Mutie', NULL, true, NOW(), NOW()),
('51616584-f570-48bc-9aa8-bd56bdbd38d5', 'YOUR_USER_ID_HERE', 'Other', 'Cath Lab', 'Cath Lab', NULL, true, NOW(), NOW()),
('b6895c94-adfa-488b-9cd5-5b0915bb622e', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Oburu', NULL, true, NOW(), NOW()),
('ff8fcce2-5741-4e96-b3be-dd862f6fe1c5', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr John Bosco', NULL, true, NOW(), NOW()),
('9c4e1607-ee16-4e70-ac06-82d998eb0b7e', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Ayo', NULL, true, NOW(), NOW()),
('b53244bb-4e08-47de-810a-4a549f4550b2', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Dindi', NULL, true, NOW(), NOW()),
('cd3bbacb-1405-4227-be89-ee5630fb40a5', 'YOUR_USER_ID_HERE', 'Other', 'Cardiac Team', 'Mater Cardiac Team', NULL, true, NOW(), NOW()),
('433d5a5b-6288-4695-9e8f-53bb7c3a7680', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Mwai', NULL, true, NOW(), NOW()),
('63db073f-14d7-4ac7-b2d4-bcfc44dbf375', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Njihia', NULL, true, NOW(), NOW()),
('abf1bacc-57b7-4dd2-a2dd-8801e355a9be', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Aketch', NULL, true, NOW(), NOW()),
('72871760-8e98-4782-a9e8-e6d415fe6ac7', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Prof Joey', NULL, true, NOW(), NOW()),
('a58f0fb0-e93d-4859-99c4-06f000081cf4', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Makori', NULL, true, NOW(), NOW()),
('2f357c94-8dee-4922-b0cd-22b983218165', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Kiptoon', NULL, true, NOW(), NOW()),
('0f4ce95a-90c1-483d-aef9-3404b99ab1f4', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Nderitu', NULL, true, NOW(), NOW()),
('f0ed817b-03b5-4153-981c-ef977090bfea', 'YOUR_USER_ID_HERE', 'Surgeon', NULL, 'Dr Kipingor', NULL, true, NOW(), NOW())
ON CONFLICT DO NOTHING;
*/


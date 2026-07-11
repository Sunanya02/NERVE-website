-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS nerve_admin;
USE nerve_admin;

-- Drop tables in reverse order of dependencies to allow clean re-runs
DROP TABLE IF EXISTS recent_activities;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS gallery;
DROP TABLE IF EXISTS news;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS admins;

-- Create admins table
CREATE TABLE admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default super admin
-- Name: Super Admin
-- Email: admin@nerve.com
-- Password: Admin@123
INSERT INTO admins (name, email, password, role, created_at, updated_at) 
VALUES (
  'Super Admin', 
  'admin@nerve.com', 
  '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 
  'superadmin', 
  NOW(), 
  NOW()
);

-- Create events table
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  location VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) DEFAULT NULL,
  is_published TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed events
INSERT INTO events (title, description, event_date, location) VALUES
('AgriTech Hackathon 2026', 'A 48-hour hackathon focused on solving smart agriculture and IoT challenges.', '2026-07-15', 'NERVE CoE Seminar Hall, Pune'),
('Industrial IoT Workshop', 'Hands-on workshop on integrating industrial IoT sensors with cloud architectures.', '2026-07-22', 'NERVE IoT Prototyping Lab'),
('NERVE OCP Cohort 3 Launch', 'Official inauguration ceremony and orientation for the third batch of startups.', '2026-08-05', 'STPI Auditorium, Hinjawadi'),
('Healthcare AI Symposium', 'Symposium on artificial intelligence, deep learning applications in healthcare diagnostic devices.', '2026-08-20', 'Virtual / Hybrid Pune CoE'),
('Green Tech & Environment Meetup', 'Networking event and presentation session for green energy and waste management startups.', '2026-09-02', 'NERVE Cafeteria Deck');

-- Create news table
CREATE TABLE news (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  thumbnail_url VARCHAR(255) DEFAULT NULL,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed news
INSERT INTO news (title, content) VALUES
('NERVE STPI Pune Welcomes First Cohort of 15 Startups', 'The NextGen Intelligent Solutions CoE has officially onboarded 15 pioneering tech startups from agriculture and core industries to begin their 6-month intensive incubation cycle.'),
('MeitY Announces Additional Grant Schemes for AgriTech Innovations', 'The Ministry of Electronics and Information Technology (MeitY) has announced custom seed fund grants up to INR 5 Lakhs for early-stage AgriTech prototypes.'),
('NERVE CoE Partners with Lead Venture Capitalists for Seed Funding', 'A formal partnership has been signed with major VC partners including Celesta Capital and Seafund to expedite venture scaling for Nerve incubatees.'),
('STPI Director Inspects IoT Testing and Prototyping Lab Infrastructure', 'Dr. Arvind Prasad inspected the clean rooms and electronic validation hardware installed at Pune STPI to ensure world-class quality for startups.');

-- Create gallery table
CREATE TABLE gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed gallery
INSERT INTO gallery (title, image_url) VALUES
('Lab Inauguration Ceremony', 'https://placehold.co/400x300?text=Lab+Inauguration'),
('Mentorship Session with Celesta Capital', 'https://placehold.co/400x300?text=Mentorship+Session'),
('Electronic Validation Lab Demo', 'https://placehold.co/400x300?text=Electronic+Lab+Demo'),
('Signing Ceremony with MOIL Limited', 'https://placehold.co/400x300?text=Signing+Ceremony'),
('Hackathon Winners Presentation', 'https://placehold.co/400x300?text=Winners+Presentation'),
('Tech Expo Pune STPI Pavilion', 'https://placehold.co/400x300?text=Tech+Expo');

-- Create contact_messages table
CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed contact_messages
INSERT INTO contact_messages (name, email, subject, message, status) VALUES
('Rohan Sharma', 'rohan.sharma@example.com', 'Inquiry about OCP Batch 4', 'Hi, I would like to know when the applications for Open Challenge Program (OCP) Batch 4 will open, and what the core eligibility criteria are.', 'unread'),
('Meera Nair', 'meera.nair@vcpartners.com', 'Partnership Proposal', 'We are interested in exploring a potential investor partnership with STPI NERVE. We would love to schedule a brief call to discuss funding options for your AgriTech cohort.', 'unread'),
('Amit Patel', 'amit.patel@agrotech.in', 'Electronic Lab Booking Request', 'Dear NERVE team, we are an early-stage startup looking to lease the IoT validation labs for 3 days to calibrate our soil sensor nodes. Please let us know the booking process.', 'read');

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed users
-- All seeded users default password is 'Admin@123'
INSERT INTO users (name, email, password, role) VALUES
('Rajesh Kumar', 'rajesh.k@example.com', '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 'mentor'),
('Priya Sharma', 'priya.s@example.com', '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 'innovator'),
('Vikram Singh', 'vikram.s@example.com', '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 'startup_member'),
('Anjali Gupta', 'anjali.g@example.com', '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 'innovator'),
('Sunil Verma', 'sunil.v@example.com', '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 'mentor'),
('Neha Deshmukh', 'neha.d@example.com', '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 'innovator'),
('Karan Johar', 'karan.j@example.com', '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 'investor'),
('Pooja Hegde', 'pooja.h@example.com', '$2a$10$CeV6JkApha4QiK2yBS0WGuFB.OzQynCwMfWvZru11W0m7MpSRPN8K', 'startup_member');

-- Create applications table (Open Challenge Program applications)
CREATE TABLE applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  startup_name VARCHAR(255) NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  focus_area VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  pitch_deck_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed applications
INSERT INTO applications (startup_name, applicant_name, email, focus_area, status) VALUES
('FarmEase Tech', 'Rajesh Verma', 'rverma@farmease.com', 'Agriculture', 'Pending'),
('MineSafe IoT', 'Sandeep Patil', 'sandeep.p@minesafe.io', 'Mining', 'Approved'),
('CardioAI Diagnostics', 'Dr. Shalini Joshi', 's.joshi@cardioai.com', 'Healthcare', 'Pending'),
('EcoCycle Solutions', 'Vivek Mehta', 'vivek@ecocycle.in', 'Environment', 'Reviewed'),
('OptiWeave Automation', 'Nitin Gadkari', 'nitin@optiweave.com', 'Core Sector', 'Rejected');

-- Create recent_activities table
CREATE TABLE recent_activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed recent_activities
INSERT INTO recent_activities (activity_type, description) VALUES
('login', 'Admin logged in successfully from IP 192.168.1.45'),
('application_received', 'New OCP application received for "FarmEase Tech" (Agriculture Focus)'),
('database_seed', 'Seeded default database tables and user roles for NERVE dashboard'),
('contact_message', 'New contact inquiry received from Rohan Sharma regarding OCP Batch 4'),
('event_created', 'New event "AgriTech Hackathon 2026" registered on calendar by administrator');


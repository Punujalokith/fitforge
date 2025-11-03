# Changelog — FitForge Gym Management System

> A full-stack gym management platform built with Next.js 15 (web dashboard)
> and Flutter (mobile member/coach app), powered by Firebase.

## [Unreleased]


## [Oct 20] Payments — Pro-Rata Plan Change System
- Added pro-rata amount calculation when upgrading or downgrading plans
- Upgrade: charges the difference for remaining days in the month
- Downgrade: records a credit to member's account
- Plan prices pulled from Firestore settings with fallback defaults
- Duplicate payment detection: warns if member already paid this month

## [Oct 23] Sidebar — Gate Scanner Navigation
- Added Gate Scanner link to dashboard sidebar
- Uses ScanLine icon from lucide-react
- Positioned below Attendance in nav order

## [Oct 27] Members — ID System and Payment History
- Member ID badge (FF-XXXX) displayed on all member cards
- Payment history modal with total paid, pending, count summary
- Temp password yellow box shown on cards until member changes it
- Copy-to-clipboard for temp passwords and member IDs

## [Oct 30] Members — Temp Password & Credentials Modal
- After adding a member, a credentials modal shows FF-XXXX + temp password
- Fallback password generated locally if Firebase Admin API not configured
- Password format: FF-XXXX-YYYY-RAND for better security
- Modal always closes after Firestore save regardless of API result

## [Nov 3] Trainers — Coach Temp Password Flow
- Trainer cards now show temp password in yellow box (same as member cards)
- New coach credentials modal after adding a trainer (FC-XXXX + temp password)
- Reset Password and Delete buttons added to each trainer card
- addTrainer() now returns { docRef, coachId } for downstream use

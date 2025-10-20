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

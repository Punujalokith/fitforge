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

## [Nov 6] Mobile — Coach QR Code Card
- Coach home screen now shows a QR code card with FC-XXXX code
- Tap to enlarge: full-screen white dialog with 220x220 QR
- Purple theme for coach QR vs cyan for member QR
- Hint text: scan at gate to clock in/out

## [Nov 10] Gate Scanner — Coach QR Code Support
- Gate scanner now detects FC-XXXX prefix for coach codes
- Scanned coach QR: looks up trainer by coachId field
- If off-duty: calls startCoachShift() → green 'Shift Started' screen
- If on-duty: calls endCoachShift() → purple 'Shift Ended' screen
- Progress bar color matches result type (green/purple/red/yellow)
- Added getTrainerByCoachId() to Firestore service

## [Nov 13] Firebase Admin — createCoach and resetCoachPassword
- /api/members now handles createCoach action
- /api/members now handles resetCoachPassword action
- generateTempPassword() now includes random suffix (XXXX-YYYY-ABC)
- Both member and coach API flows share the same route file

## [Nov 17] Mobile — AppProvider Coach Role Support
- needsPasswordChange now works for both member and coach roles
- changePassword() updates trainers collection when isCoach is true
- changePassword() updates members collection for member role
- SharedPreferences persists user_role across app restarts

## [Nov 20] Mobile — Force Password Screen Coach Support
- Screen now shows coach name instead of member name for coach role
- Temp password hint shows coachData tempPassword for coaches
- Used local variables to avoid Dart string interpolation parse issues

## [Nov 24] Mobile — Auth Routing Fix
- main.dart: needsPasswordChange check now runs before isCoach check
- Both coaches and members hit force password screen on first login
- AuthWrapper order: loading → not-logged-in → needs-pw-change → coach → member

## [Nov 27] Firebase Admin — Credentials Configured
- Obtained service account key from Firebase Console
- Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local
- Dashboard now auto-creates Firebase Auth accounts when adding members/coaches

## [Dec 1] Fix — Login Navigation Bug
- Login screen was not navigating after successful auth
- Root cause: AuthWrapper is behind navigator stack after push
- Fix: on auth success (err == null), call popUntil(route.isFirst)
- AuthWrapper then shows correct screen based on role and state

## [Dec 4] Fix — Member Modal Close Bug
- handleSave in members page: API call not in inner try-catch
- If /api/members threw, setShowModal(false) never ran
- Fix: wrap fetch() in separate try-catch, always close modal on Firestore success
- Fallback password now includes random suffix for better uniqueness

## [Dec 8] Refactor — Code Cleanup
- Removed unused imports across dashboard pages
- Cleaned up dead state variables in payments page
- Fixed TypeScript any types in a few components
- Standardized error boundary patterns in Firestore calls

## [Dec 11] UI Polish — Dashboard
- Trainer cards: password-changed border takes priority over on-duty border
- Gate scanner progress bar color now matches result type correctly
- Members page: edit form retains trainer assignment field
- Announcements: AI button disabled during generation

## [Dec 15] Mobile — QR Dialog Improvements
- Full-screen QR dialog now shows member name below the code
- Coach QR dialog updated to show 'Scan to Clock In/Out' label
- QrImageView padding adjusted for better scan reliability
- Dialog close button uses TextButton for consistent style

## [Dec 18] Mobile — Home Screen Live Data
- Gate status banner now animates pulse when open
- On-duty coaches section shows shift start time
- Empty state messages added for no coaches/no check-ins
- Fixed Timestamp.toDate() null safety in coach tile

## [Dec 22] Testing — Physical Device APK
- Release APK built and tested on physical Android device
- Fixed ADB install block: set verifier_verify_adb_installs=0
- Confirmed end-to-end flow: role select → login → home → QR → attendance
- Coach flow tested: login → force pw change → coach home → shift toggle

## [Dec 26] Final Review — Consistency Pass
- Standardized all card border-radius to rounded-xl (14px) across dashboard
- Flutter: replaced withOpacity() calls with withValues() where flagged
- Consistent empty state styling across all dashboard pages
- Mobile font sizes and weights audited for readability

## [Dec 29] Documentation
- README updated with full setup guide
- Added Firebase Admin SDK configuration steps
- Added Flutter build and ADB install instructions
- Added environment variable reference table

## [v1.0.0] — December 31, 2025 — Production Release

### Web Dashboard Features
- Member management: add, edit, delete, FF-XXXX IDs, temp passwords
- Coach/trainer management: FC-XXXX IDs, shift tracking, temp passwords
- Payments: record, history, pro-rata plan changes, credit system
- Attendance: real-time check-ins, gate open/close control
- Gate Scanner: USB QR kiosk — member check-in + coach clock in/out
- Classes, renewals, announcements, analytics, settings
- AI announcement writer powered by Claude

### Mobile App Features
- Member role: membership card, QR code, attendance history, goals, profile
- Coach role: shift management, coach QR code, live gym stats
- Force password change on first login (temp password flow)
- Real-time gate status and on-duty coaches display
- Firebase Auth with role-based routing

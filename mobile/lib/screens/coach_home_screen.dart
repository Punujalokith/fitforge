import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../core/app_colors.dart';
import '../providers/app_provider.dart';
import '../services/firestore_service.dart';

class CoachHomeScreen extends StatelessWidget {
  const CoachHomeScreen({super.key});

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),

              // ── Top bar ──────────────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_greeting(),
                          style: GoogleFonts.inter(
                            color: AppColors.textSecondary, fontSize: 13)),
                        const SizedBox(height: 2),
                        Text(provider.coachName,
                          style: GoogleFonts.inter(
                            color: Colors.white, fontSize: 22,
                            fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ),
                  // Coach badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.green.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.green.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.fitness_center_rounded,
                          color: AppColors.green, size: 12),
                        const SizedBox(width: 5),
                        Text('Coach', style: GoogleFonts.inter(
                          color: AppColors.green, fontSize: 11,
                          fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Sign out
                  GestureDetector(
                    onTap: () async {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          backgroundColor: AppColors.card,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16)),
                          title: Text('Sign Out',
                            style: GoogleFonts.inter(color: Colors.white,
                              fontWeight: FontWeight.w700)),
                          content: Text('Are you sure you want to sign out?',
                            style: GoogleFonts.inter(color: AppColors.textSecondary)),
                          actions: [
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, false),
                              child: Text('Cancel',
                                style: GoogleFonts.inter(color: AppColors.textSecondary))),
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              child: Text('Sign Out',
                                style: GoogleFonts.inter(color: AppColors.red,
                                  fontWeight: FontWeight.w700))),
                          ],
                        ),
                      );
                      if (confirmed == true && context.mounted) {
                        await context.read<AppProvider>().signOut();
                      }
                    },
                    child: Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(Icons.logout_rounded,
                        color: AppColors.textSecondary, size: 18),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // ── Shift card ───────────────────────────────────
              _ShiftCard(),
              const SizedBox(height: 16),

              // ── Coach QR card ─────────────────────────────────
              _CoachQrCard(),
              const SizedBox(height: 20),

              // ── Today's stats ────────────────────────────────
              _TodayStats(),
              const SizedBox(height: 24),

              // ── On-duty coaches ──────────────────────────────
              Text('On Duty Today',
                style: GoogleFonts.inter(
                  color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              _OnDutyCoaches(),
              const SizedBox(height: 24),

              // ── Recent check-ins ─────────────────────────────
              Text("Today's Check-ins",
                style: GoogleFonts.inter(
                  color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
              const SizedBox(height: 12),
              _TodayCheckins(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Coach QR Card ───────────────────────────────────────────────────────────
class _CoachQrCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final coachId  = provider.coachId;
    if (coachId.isEmpty) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () {
        showDialog(
          context: context,
          builder: (_) => Dialog(
            backgroundColor: Colors.white,
            insetPadding: const EdgeInsets.all(32),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Scan to Clock In/Out',
                    style: GoogleFonts.inter(
                      color: Colors.black, fontSize: 15, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),
                  QrImageView(
                    data: coachId,
                    version: QrVersions.auto,
                    size: 220,
                    eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(coachId,
                    style: GoogleFonts.inter(
                      color: Colors.black87, fontSize: 18,
                      fontWeight: FontWeight.w800, letterSpacing: 2)),
                  const SizedBox(height: 4),
                  Text(provider.coachName,
                    style: GoogleFonts.inter(color: Colors.black45, fontSize: 13)),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('Close',
                      style: GoogleFonts.inter(color: Colors.black54, fontSize: 13)),
                  ),
                ],
              ),
            ),
          ),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 52, height: 52,
              decoration: BoxDecoration(
                color: const Color(0xFFA855F7).withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: QrImageView(
                data: coachId,
                version: QrVersions.auto,
                eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Color(0xFFA855F7)),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: Color(0xFFA855F7),
                ),
                padding: const EdgeInsets.all(6),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('My Coach QR Code',
                    style: GoogleFonts.inter(
                      color: Colors.white, fontSize: 14, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(coachId,
                    style: GoogleFonts.inter(
                      color: const Color(0xFFA855F7),
                      fontSize: 13, fontWeight: FontWeight.w700,
                      letterSpacing: 1.5)),
                  const SizedBox(height: 1),
                  Text('Tap to enlarge · Scan at gate to clock in/out',
                    style: GoogleFonts.inter(
                      color: AppColors.textHint, fontSize: 10)),
                ],
              ),
            ),
            const Icon(Icons.qr_code_2_rounded, color: Color(0xFFA855F7), size: 20),
          ],
        ),
      ),
    );
  }
}

// ── Shift Card ──────────────────────────────────────────────────────────────
class _ShiftCard extends StatefulWidget {
  @override
  State<_ShiftCard> createState() => _ShiftCardState();
}

class _ShiftCardState extends State<_ShiftCard> {
  bool _loading = false;

  Future<void> _toggle(AppProvider provider) async {
    setState(() => _loading = true);
    try {
      if (provider.isOnDuty) {
        await provider.endShift();
      } else {
        await provider.startShift();
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final onDuty   = provider.isOnDuty;
    final color    = onDuty ? AppColors.green : AppColors.textSecondary;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: onDuty
              ? [const Color(0xFF0A2E1A), const Color(0xFF051A0E)]
              : [const Color(0xFF1A1A24), const Color(0xFF12121A)],
        ),
        border: Border.all(
          color: onDuty
              ? AppColors.green.withOpacity(0.3)
              : AppColors.border,
          width: 1.5,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              color: color.withOpacity(0.12),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(
              onDuty ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded,
              color: color, size: 26,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(onDuty ? 'Currently On Duty' : 'Off Duty',
                  style: GoogleFonts.inter(
                    color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 3),
                Text(onDuty
                    ? 'You are visible to members and the dashboard'
                    : 'Start your shift to begin tracking',
                  style: GoogleFonts.inter(
                    color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: _loading ? null : () => _toggle(provider),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: onDuty
                    ? AppColors.red.withOpacity(0.12)
                    : AppColors.green.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: onDuty
                      ? AppColors.red.withOpacity(0.3)
                      : AppColors.green.withOpacity(0.3),
                ),
              ),
              child: _loading
                  ? SizedBox(
                      width: 16, height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: onDuty ? AppColors.red : AppColors.green,
                      ),
                    )
                  : Text(
                      onDuty ? 'End Shift' : 'Start Shift',
                      style: GoogleFonts.inter(
                        color: onDuty ? AppColors.red : AppColors.green,
                        fontSize: 13, fontWeight: FontWeight.w700),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Today's Stats ───────────────────────────────────────────────────────────
class _TodayStats extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.getTodayAttendanceStream(),
      builder: (ctx, snap) {
        final checkins = snap.data?.length ?? 0;
        return StreamBuilder<List<Map<String, dynamic>>>(
          stream: FirestoreService.getOnDutyCoachesStream(),
          builder: (ctx2, snap2) {
            final onDutyCount = snap2.data?.length ?? 0;
            return Row(
              children: [
                _StatTile(label: "Today's Check-ins", value: '$checkins',
                  icon: Icons.login_rounded, color: AppColors.cyan),
                const SizedBox(width: 10),
                _StatTile(label: 'Coaches On Duty', value: '$onDutyCount',
                  icon: Icons.fitness_center_rounded, color: AppColors.green),
              ],
            );
          },
        );
      },
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatTile({required this.label, required this.value,
    required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 8),
            Text(value, style: GoogleFonts.inter(
              color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 2),
            Text(label, style: GoogleFonts.inter(
              color: AppColors.textSecondary, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

// ── On-duty Coaches ─────────────────────────────────────────────────────────
class _OnDutyCoaches extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.getOnDutyCoachesStream(),
      builder: (ctx, snap) {
        if (!snap.hasData || snap.data!.isEmpty) {
          return _empty('No coaches currently on duty');
        }
        return Column(
          children: snap.data!.map((c) => _CoachTile(coach: c)).toList(),
        );
      },
    );
  }
}

class _CoachTile extends StatelessWidget {
  final Map<String, dynamic> coach;
  const _CoachTile({required this.coach});

  @override
  Widget build(BuildContext context) {
    final name    = coach['coachName'] as String? ?? 'Coach';
    final initials = name.split(' ').map((w) => w.isNotEmpty ? w[0] : '').join('').substring(0, name.split(' ').length >= 2 ? 2 : 1).toUpperCase();

    DateTime? startTime;
    try {
      final ts = coach['startTime'];
      if (ts != null) startTime = (ts as dynamic).toDate() as DateTime;
    } catch (_) {}

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: AppColors.green.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(initials,
              style: GoogleFonts.inter(
                color: AppColors.green, fontSize: 13, fontWeight: FontWeight.w700))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: GoogleFonts.inter(
                  color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
                if (startTime != null)
                  Text('Since ${DateFormat('h:mm a').format(startTime)}',
                    style: GoogleFonts.inter(
                      color: AppColors.textSecondary, fontSize: 11)),
              ],
            ),
          ),
          Container(
            width: 8, height: 8,
            decoration: const BoxDecoration(
              shape: BoxShape.circle, color: AppColors.green),
          ),
        ],
      ),
    );
  }
}

// ── Today's Check-ins ───────────────────────────────────────────────────────
class _TodayCheckins extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.getTodayAttendanceStream(),
      builder: (ctx, snap) {
        if (!snap.hasData || snap.data!.isEmpty) {
          return _empty('No check-ins yet today');
        }
        final records = snap.data!.take(10).toList();
        return Column(
          children: records.map((r) => _CheckInRow(record: r)).toList(),
        );
      },
    );
  }
}

class _CheckInRow extends StatelessWidget {
  final Map<String, dynamic> record;
  const _CheckInRow({required this.record});

  @override
  Widget build(BuildContext context) {
    DateTime? dt;
    try {
      final ts = record['checkInTime'];
      if (ts != null) dt = (ts as dynamic).toDate() as DateTime;
    } catch (_) {}

    final name = record['memberName'] as String? ?? 'Member';
    final initials = (record['memberInitials'] as String?)
        ?? name.split(' ').map((w) => w.isNotEmpty ? w[0] : '').join('').substring(0, name.split(' ').length >= 2 ? 2 : 1).toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF00C896), AppColors.cyan]),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(initials,
              style: GoogleFonts.inter(
                color: Colors.black, fontSize: 12, fontWeight: FontWeight.w800))),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(name, style: GoogleFonts.inter(
              color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600)),
          ),
          if (dt != null)
            Text(DateFormat('h:mm a').format(dt),
              style: GoogleFonts.inter(
                color: AppColors.cyan, fontSize: 12, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

Widget _empty(String msg) => Container(
  padding: const EdgeInsets.all(20),
  decoration: BoxDecoration(
    color: AppColors.card,
    borderRadius: BorderRadius.circular(14),
    border: Border.all(color: AppColors.border),
  ),
  child: Center(child: Text(msg,
    style: GoogleFonts.inter(color: AppColors.textHint, fontSize: 13))),
);

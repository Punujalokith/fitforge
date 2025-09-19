import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../core/app_colors.dart';
import '../providers/app_provider.dart';
import '../services/firestore_service.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  DateTime _focusMonth = DateTime.now();

  void _prevMonth() => setState(() =>
    _focusMonth = DateTime(_focusMonth.year, _focusMonth.month - 1));

  void _nextMonth() {
    final now = DateTime.now();
    if (_focusMonth.year < now.year ||
        (_focusMonth.year == now.year && _focusMonth.month < now.month)) {
      setState(() => _focusMonth = DateTime(_focusMonth.year, _focusMonth.month + 1));
    }
  }

  @override
  Widget build(BuildContext context) {
    final member = context.watch<AppProvider>().memberData;
    final memberDocId = member?['id'] as String? ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: memberDocId.isEmpty
          ? const Center(child: CircularProgressIndicator(color: AppColors.cyan))
          : StreamBuilder<List<Map<String, dynamic>>>(
              stream: FirestoreService.getMemberAttendanceStream(memberDocId),
              builder: (ctx, snap) {
                final records = snap.data ?? [];
                final visitedDays = _buildVisitedSet(records);
                final stats = _buildStats(records);

                return SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 20),
                      Text('Attendance',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text('Your gym visit history',
                        style: GoogleFonts.inter(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Stats row
                      Row(
                        children: [
                          _StatCard(
                            label: 'This Month',
                            value: stats['thisMonth'].toString(),
                            icon: Icons.calendar_today_rounded,
                            color: AppColors.cyan,
                          ),
                          const SizedBox(width: 10),
                          _StatCard(
                            label: 'Total Visits',
                            value: stats['total'].toString(),
                            icon: Icons.door_front_door_outlined,
                            color: const Color(0xFF00C896),
                          ),
                          const SizedBox(width: 10),
                          _StatCard(
                            label: 'Streak',
                            value: '${stats['streak']} 🔥',
                            icon: Icons.local_fire_department_rounded,
                            color: const Color(0xFFF59E0B),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // QR Code card
                      _QrCard(
                        memberId: member?['memberId'] as String? ?? '',
                        memberName: member?['name'] as String? ?? 'Member',
                      ),
                      const SizedBox(height: 20),

                      // Calendar
                      _CalendarCard(
                        focusMonth: _focusMonth,
                        visitedDays: visitedDays,
                        onPrevMonth: _prevMonth,
                        onNextMonth: _nextMonth,
                      ),
                      const SizedBox(height: 20),

                      // Recent check-ins
                      Text('Recent Check-ins',
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 12),
                      if (records.isEmpty)
                        _EmptyCard()
                      else
                        ...records.take(15).map((r) => _CheckInTile(record: r)),
                      const SizedBox(height: 32),
                    ],
                  ),
                );
              },
            ),
      ),
    );
  }

  Set<String> _buildVisitedSet(List<Map<String, dynamic>> records) {
    final set = <String>{};
    for (final r in records) {
      try {
        final ts = r['checkInTime'];
        if (ts != null) {
          final d = (ts as dynamic).toDate() as DateTime;
          if (d.year == _focusMonth.year && d.month == _focusMonth.month) {
            set.add(d.day.toString());
          }
        }
      } catch (_) {}
    }
    return set;
  }

  Map<String, int> _buildStats(List<Map<String, dynamic>> records) {
    final now = DateTime.now();
    int thisMonth = 0;
    final visitedDateKeys = <String>{};

    for (final r in records) {
      try {
        final ts = r['checkInTime'];
        if (ts != null) {
          final d = (ts as dynamic).toDate() as DateTime;
          final key = '${d.year}-${d.month}-${d.day}';
          if (d.year == now.year && d.month == now.month) thisMonth++;
          visitedDateKeys.add(key);
        }
      } catch (_) {}
    }

    // Calculate streak
    int streak = 0;
    var day = DateTime(now.year, now.month, now.day);
    while (visitedDateKeys.contains('${day.year}-${day.month}-${day.day}')) {
      streak++;
      day = day.subtract(const Duration(days: 1));
    }

    return {
      'thisMonth': thisMonth,
      'total': records.length,
      'streak': streak,
    };
  }
}

class _QrCard extends StatefulWidget {
  final String memberId;
  final String memberName;
  const _QrCard({required this.memberId, required this.memberName});

  @override
  State<_QrCard> createState() => _QrCardState();
}

class _QrCardState extends State<_QrCard> {
  bool _expanded = false;

  void _showFullScreen(BuildContext context) {
    HapticFeedback.lightImpact();
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.92),
      builder: (_) => Dialog(
        backgroundColor: Colors.transparent,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  QrImageView(
                    data: widget.memberId,
                    version: QrVersions.auto,
                    size: 260,
                    backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Colors.black,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    widget.memberId,
                    style: GoogleFonts.inter(
                      color: Colors.black87,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.memberName,
                    style: GoogleFonts.inter(
                      color: Colors.black54,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Close',
                style: GoogleFonts.inter(color: Colors.white70, fontSize: 15)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.memberId.isEmpty) return const SizedBox.shrink();

    return GestureDetector(
      onTap: () => _showFullScreen(context),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.qr_code_2_rounded, color: AppColors.cyan, size: 18),
                const SizedBox(width: 8),
                Text('My Check-in QR Code',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const Spacer(),
                Text('Tap to enlarge',
                  style: GoogleFonts.inter(
                    color: AppColors.textHint,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                // Small QR preview
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: QrImageView(
                    data: widget.memberId,
                    version: QrVersions.auto,
                    size: 90,
                    backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Colors.black,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.memberId,
                        style: GoogleFonts.inter(
                          color: AppColors.cyan,
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 2,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(widget.memberName,
                        style: GoogleFonts.inter(
                          color: AppColors.textSecondary,
                          fontSize: 13,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.cyan.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.cyan.withOpacity(0.2)),
                        ),
                        child: Text('Show this at the gate',
                          style: GoogleFonts.inter(
                            color: AppColors.cyan,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 6),
            Text(value,
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 2),
            Text(label,
              style: GoogleFonts.inter(
                color: AppColors.textSecondary,
                fontSize: 9,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _CalendarCard extends StatelessWidget {
  final DateTime focusMonth;
  final Set<String> visitedDays;
  final VoidCallback onPrevMonth;
  final VoidCallback onNextMonth;

  const _CalendarCard({
    required this.focusMonth,
    required this.visitedDays,
    required this.onPrevMonth,
    required this.onNextMonth,
  });

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final firstDay = DateTime(focusMonth.year, focusMonth.month, 1);
    final daysInMonth = DateTime(focusMonth.year, focusMonth.month + 1, 0).day;
    final startWeekday = firstDay.weekday; // 1=Mon, 7=Sun
    final canGoForward = focusMonth.year < now.year ||
        (focusMonth.year == now.year && focusMonth.month < now.month);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: [
          // Header
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left, color: Colors.white, size: 20),
                onPressed: onPrevMonth,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              Expanded(
                child: Text(
                  DateFormat('MMMM yyyy').format(focusMonth),
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                    fontSize: 14,
                  ),
                ),
              ),
              IconButton(
                icon: Icon(Icons.chevron_right,
                  color: canGoForward ? Colors.white : AppColors.border,
                  size: 20),
                onPressed: canGoForward ? onNextMonth : null,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Day labels
          Row(
            children: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) =>
              Expanded(
                child: Center(
                  child: Text(d,
                    style: GoogleFonts.inter(
                      color: AppColors.textHint,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ).toList(),
          ),
          const SizedBox(height: 8),

          // Calendar grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              mainAxisSpacing: 4,
              crossAxisSpacing: 4,
            ),
            itemCount: (startWeekday - 1) + daysInMonth,
            itemBuilder: (ctx, i) {
              if (i < startWeekday - 1) return const SizedBox.shrink();
              final day = i - (startWeekday - 2);
              final isToday = day == now.day &&
                  focusMonth.month == now.month &&
                  focusMonth.year == now.year;
              final visited = visitedDays.contains(day.toString());
              final isFuture = DateTime(focusMonth.year, focusMonth.month, day)
                  .isAfter(now);

              return Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: visited
                    ? AppColors.cyan.withOpacity(0.2)
                    : isToday
                      ? AppColors.border
                      : null,
                  border: isToday
                    ? Border.all(color: AppColors.cyan, width: 1.5)
                    : null,
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Text('$day',
                      style: GoogleFonts.inter(
                        color: isFuture
                          ? AppColors.textHint
                          : isToday
                            ? AppColors.cyan
                            : visited
                              ? Colors.white
                              : AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: isToday ? FontWeight.w700 : FontWeight.w400,
                      ),
                    ),
                    if (visited)
                      Positioned(
                        bottom: 3,
                        child: Container(
                          width: 4, height: 4,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.cyan,
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(width: 8, height: 8,
                decoration: BoxDecoration(
                  color: AppColors.cyan.withOpacity(0.3),
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 5),
              Text('Visited day',
                style: GoogleFonts.inter(color: AppColors.textHint, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _CheckInTile extends StatelessWidget {
  final Map<String, dynamic> record;
  const _CheckInTile({required this.record});

  @override
  Widget build(BuildContext context) {
    DateTime? dt;
    try {
      final ts = record['checkInTime'];
      if (ts != null) dt = (ts as dynamic).toDate() as DateTime;
    } catch (_) {}

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
              color: AppColors.cyan.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(Icons.login_rounded, color: AppColors.cyan, size: 16),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Check In',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (dt != null)
                  Text(DateFormat('EEEE, MMM d').format(dt),
                    style: GoogleFonts.inter(
                      color: AppColors.textSecondary,
                      fontSize: 11,
                    ),
                  ),
              ],
            ),
          ),
          if (dt != null)
            Text(DateFormat('h:mm a').format(dt),
              style: GoogleFonts.inter(
                color: AppColors.cyan,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
        ],
      ),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Center(
        child: Column(
          children: [
            const Icon(Icons.calendar_month_outlined,
              color: AppColors.textHint, size: 36),
            const SizedBox(height: 10),
            Text('No check-ins yet',
              style: GoogleFonts.inter(
                color: AppColors.textHint,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/app_colors.dart';
import '../providers/app_provider.dart';
import '../services/firestore_service.dart';
import '../widgets/ring_painter.dart';

class GoalsScreen extends StatelessWidget {
  const GoalsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final member = context.watch<AppProvider>().memberData;
    final memberDocId = member?['id'] as String? ?? '';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              Text('My Goals',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text('Track your progress and stay motivated',
                style: GoogleFonts.inter(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 24),

              // Goal rings
              _GoalCard(
                title: 'Weekly Visits',
                icon: Icons.fitness_center_rounded,
                current: member?['weeklyVisits'] ?? 0,
                target: member?['weeklyGoal'] ?? 4,
                unit: 'visits',
                color: AppColors.cyan,
              ),
              const SizedBox(height: 14),
              _GoalCard(
                title: 'Calories Burned',
                icon: Icons.local_fire_department_rounded,
                current: member?['caloriesThisWeek'] ?? 0,
                target: member?['caloriesGoal'] ?? 2000,
                unit: 'kcal',
                color: const Color(0xFFF59E0B),
              ),
              const SizedBox(height: 14),
              _GoalCard(
                title: 'Active Minutes',
                icon: Icons.timer_rounded,
                current: member?['activeMinutesWeek'] ?? 0,
                target: member?['activeMinutesGoal'] ?? 150,
                unit: 'min',
                color: AppColors.purple,
              ),
              const SizedBox(height: 28),

              // Streak heatmap
              Text('Activity History',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 6),
              Text('Last 12 weeks of gym visits',
                style: GoogleFonts.inter(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 14),
              if (memberDocId.isNotEmpty)
                _ActivityHeatmap(memberDocId: memberDocId),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _GoalCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final int current;
  final int target;
  final String unit;
  final Color color;

  const _GoalCard({
    required this.title,
    required this.icon,
    required this.current,
    required this.target,
    required this.unit,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final progress = target > 0 ? (current / target).clamp(0.0, 1.0) : 0.0;
    final remaining = (target - current).clamp(0, target);
    final pct = (progress * 100).round();

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          // Ring
          SizedBox(
            width: 80,
            height: 80,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CustomPaint(
                  size: const Size(80, 80),
                  painter: RingPainter(
                    progress: progress,
                    trackColor: color.withOpacity(0.15),
                    progressColor: color,
                    strokeWidth: 7,
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('$pct%',
                      style: GoogleFonts.inter(
                        color: color,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(icon, color: color, size: 14),
                    const SizedBox(width: 5),
                    Text(title,
                      style: GoogleFonts.inter(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _StatBlock(label: 'Current', value: '$current', unit: unit),
                    const SizedBox(width: 16),
                    _StatBlock(label: 'Target', value: '$target', unit: unit),
                    const SizedBox(width: 16),
                    _StatBlock(
                      label: 'Remaining',
                      value: '$remaining',
                      unit: unit,
                      dimmed: true,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatBlock extends StatelessWidget {
  final String label;
  final String value;
  final String unit;
  final bool dimmed;

  const _StatBlock({
    required this.label,
    required this.value,
    required this.unit,
    this.dimmed = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label,
          style: GoogleFonts.inter(
            color: AppColors.textHint,
            fontSize: 9,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 2),
        Text(value,
          style: GoogleFonts.inter(
            color: dimmed ? AppColors.textSecondary : Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        Text(unit,
          style: GoogleFonts.inter(
            color: AppColors.textHint,
            fontSize: 9,
          ),
        ),
      ],
    );
  }
}

class _ActivityHeatmap extends StatelessWidget {
  final String memberDocId;
  const _ActivityHeatmap({required this.memberDocId});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.getMemberAttendanceStream(memberDocId),
      builder: (ctx, snap) {
        final attendanceDates = <String>{};
        if (snap.hasData) {
          for (final a in snap.data!) {
            try {
              final ts = a['checkInTime'];
              if (ts != null) {
                final d = (ts as dynamic).toDate() as DateTime;
                attendanceDates.add('${d.year}-${d.month}-${d.day}');
              }
            } catch (_) {}
          }
        }

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: _HeatmapGrid(attendanceDates: attendanceDates),
        );
      },
    );
  }
}

class _HeatmapGrid extends StatelessWidget {
  final Set<String> attendanceDates;
  const _HeatmapGrid({required this.attendanceDates});

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final weeks = 12;
    // Start from `weeks` weeks ago, Monday
    final startOffset = now.weekday - 1;
    final startDate = now.subtract(Duration(days: startOffset + (weeks - 1) * 7));

    final days = <DateTime>[];
    for (int i = 0; i < weeks * 7; i++) {
      days.add(startDate.add(Duration(days: i)));
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: List.generate(weeks, (w) {
            final weekStart = startDate.add(Duration(days: w * 7));
            final label = w == 0 || weekStart.day <= 7
              ? _monthAbbr(weekStart.month)
              : '';
            return Expanded(
              child: Text(label,
                style: GoogleFonts.inter(
                  color: AppColors.textHint,
                  fontSize: 8,
                ),
                textAlign: TextAlign.center,
              ),
            );
          }),
        ),
        const SizedBox(height: 4),
        Row(
          children: List.generate(weeks, (w) {
            return Expanded(
              child: Column(
                children: List.generate(7, (d) {
                  final date = startDate.add(Duration(days: w * 7 + d));
                  final key = '${date.year}-${date.month}-${date.day}';
                  final visited = attendanceDates.contains(key);
                  final isToday = date.year == now.year &&
                      date.month == now.month &&
                      date.day == now.day;
                  final isFuture = date.isAfter(now);

                  Color cellColor;
                  if (isFuture) {
                    cellColor = AppColors.background;
                  } else if (visited) {
                    cellColor = AppColors.cyan;
                  } else {
                    cellColor = AppColors.border;
                  }

                  return Container(
                    margin: const EdgeInsets.all(1.5),
                    width: double.infinity,
                    height: 12,
                    decoration: BoxDecoration(
                      color: cellColor,
                      borderRadius: BorderRadius.circular(2),
                      border: isToday
                        ? Border.all(color: AppColors.cyan, width: 1)
                        : null,
                    ),
                  );
                }),
              ),
            );
          }),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            _LegendItem(color: AppColors.border, label: 'No visit'),
            const SizedBox(width: 12),
            _LegendItem(color: AppColors.cyan, label: 'Visited'),
          ],
        ),
      ],
    );
  }

  static const _months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  static String _monthAbbr(int m) => _months[m - 1];
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendItem({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 10, height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 4),
        Text(label,
          style: GoogleFonts.inter(
            color: AppColors.textHint,
            fontSize: 10,
          ),
        ),
      ],
    );
  }
}

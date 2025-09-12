import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/app_colors.dart';
import '../providers/app_provider.dart';
import '../services/firestore_service.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final member = provider.memberData;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),
              _TopBar(memberName: provider.memberName),
              const SizedBox(height: 16),
              _GateStatusBanner(),
              const SizedBox(height: 16),
              if (member != null) _MembershipCard(member: member),
              const SizedBox(height: 20),
              _WorkoutCard(),
              const SizedBox(height: 20),
              _StatsRow(member: member),
              const SizedBox(height: 24),
              _SectionHeader(title: 'Upcoming Classes'),
              const SizedBox(height: 12),
              _UpcomingClasses(),
              const SizedBox(height: 24),
              _SectionHeader(title: 'Coaches On Duty'),
              const SizedBox(height: 12),
              _OnDutyCoaches(),
              const SizedBox(height: 24),
              _SectionHeader(title: 'Recent Announcements'),
              const SizedBox(height: 12),
              _Announcements(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _TopBar extends StatelessWidget {
  final String memberName;
  const _TopBar({required this.memberName});

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_greeting(),
                style: GoogleFonts.inter(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 2),
              Text(memberName,
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF00C896), AppColors.cyan],
            ),
          ),
          child: Center(
            child: Text(
              memberName.isNotEmpty ? memberName[0].toUpperCase() : 'M',
              style: GoogleFonts.inter(
                color: Colors.black,
                fontWeight: FontWeight.w800,
                fontSize: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _MembershipCard extends StatelessWidget {
  final Map<String, dynamic> member;
  const _MembershipCard({required this.member});

  @override
  Widget build(BuildContext context) {
    final plan = member['plan'] ?? 'Standard';
    final status = member['status'] ?? 'Active';
    final memberId = member['memberId'] ?? '';
    final isActive = status == 'Active';

    // Calculate days remaining if expiryDate exists
    int daysLeft = 0;
    double progress = 0;
    try {
      if (member['expiryDate'] != null) {
        final expiry = (member['expiryDate'] as dynamic).toDate() as DateTime;
        daysLeft = expiry.difference(DateTime.now()).inDays.clamp(0, 999);
        progress = isActive ? (daysLeft / 30.0).clamp(0.0, 1.0) : 0;
      }
    } catch (_) {}

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0D2B3A), Color(0xFF0A1E2A)],
        ),
        border: Border.all(color: AppColors.cyan.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('FitForge',
                      style: GoogleFonts.inter(
                        color: AppColors.cyan,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text('$plan Plan',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: isActive
                    ? AppColors.green.withOpacity(0.15)
                    : AppColors.red.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: isActive
                      ? AppColors.green.withOpacity(0.4)
                      : AppColors.red.withOpacity(0.4),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6, height: 6,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isActive ? AppColors.green : AppColors.red,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(status,
                      style: GoogleFonts.inter(
                        color: isActive ? AppColors.green : AppColors.red,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          if (daysLeft > 0) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Days Remaining',
                  style: GoogleFonts.inter(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                Text('$daysLeft days',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                backgroundColor: AppColors.border,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.cyan),
                minHeight: 5,
              ),
            ),
            const SizedBox(height: 16),
          ],
          if (memberId.isNotEmpty)
            Text(memberId,
              style: GoogleFonts.inter(
                color: AppColors.textSecondary,
                fontSize: 12,
              ),
            ),
        ],
      ),
    );
  }
}

class _WorkoutCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A2E1A), Color(0xFF051A0E)],
        ),
        border: Border.all(color: AppColors.green.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Today's Workout",
                  style: GoogleFonts.inter(
                    color: AppColors.greenSoft,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 6),
                Text('Full Body Strength',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 4),
                Text('6 exercises · 45 min',
                  style: GoogleFonts.inter(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: AppColors.green.withOpacity(0.15),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.fitness_center_rounded,
              color: AppColors.green, size: 22),
          ),
        ],
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  final Map<String, dynamic>? member;
  const _StatsRow({required this.member});

  @override
  Widget build(BuildContext context) {
    final visits = member?['totalVisits'] ?? 0;
    final streak = member?['currentStreak'] ?? 0;
    final points = member?['points'] ?? 0;

    return Row(
      children: [
        _StatChip(label: 'Total Visits', value: '$visits', icon: Icons.door_front_door_outlined, color: AppColors.cyan),
        const SizedBox(width: 10),
        _StatChip(label: 'Day Streak', value: '$streak 🔥', icon: Icons.local_fire_department_rounded, color: const Color(0xFFF59E0B)),
        const SizedBox(width: 10),
        _StatChip(label: 'Points', value: '$points', icon: Icons.star_rounded, color: AppColors.purple),
      ],
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatChip({
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

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(title,
      style: GoogleFonts.inter(
        color: Colors.white,
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
    );
  }
}

class _UpcomingClasses extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.getActiveClassesStream(),
      builder: (ctx, snap) {
        if (!snap.hasData || snap.data!.isEmpty) {
          return _EmptyCard(message: 'No upcoming classes');
        }
        final classes = snap.data!.take(3).toList();
        return Column(
          children: classes.map((c) => _ClassTile(cls: c)).toList(),
        );
      },
    );
  }
}

class _ClassTile extends StatelessWidget {
  final Map<String, dynamic> cls;
  const _ClassTile({required this.cls});

  static const _typeColors = {
    'Yoga': Color(0xFFA855F7),
    'HIIT': AppColors.red,
    'Cardio': AppColors.cyan,
    'Strength': AppColors.amber,
    'Pilates': Color(0xFFEC4899),
    'CrossFit': AppColors.green,
  };

  @override
  Widget build(BuildContext context) {
    final type = cls['type'] ?? 'General';
    final color = _typeColors[type] ?? AppColors.cyan;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: color.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(type.substring(0, 1),
                style: GoogleFonts.inter(
                  color: color,
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(cls['name'] ?? 'Class',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text('${cls['day'] ?? ''} · ${cls['time'] ?? ''} · ${cls['duration'] ?? 60} min',
                  style: GoogleFonts.inter(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(type,
              style: GoogleFonts.inter(color: color, fontSize: 11, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

class _Announcements extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.getAnnouncementsStream(),
      builder: (ctx, snap) {
        if (!snap.hasData || snap.data!.isEmpty) {
          return _EmptyCard(message: 'No announcements');
        }
        final list = snap.data!.take(3).toList();
        return Column(
          children: list.map((a) => _AnnouncementTile(item: a)).toList(),
        );
      },
    );
  }
}

class _AnnouncementTile extends StatelessWidget {
  final Map<String, dynamic> item;
  const _AnnouncementTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(item['title'] ?? 'Announcement',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(item['message'] ?? '',
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _GateStatusBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<bool>(
      stream: FirestoreService.getGateStatusStream(),
      builder: (ctx, snap) {
        final isOpen = snap.data ?? false;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 400),
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isOpen
                ? const Color(0xFF00C896).withOpacity(0.08)
                : Colors.white.withOpacity(0.04),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isOpen
                  ? const Color(0xFF00C896).withOpacity(0.25)
                  : Colors.white.withOpacity(0.08),
            ),
          ),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isOpen ? const Color(0xFF00C896) : Colors.white24,
                  boxShadow: isOpen
                      ? [BoxShadow(color: const Color(0xFF00C896).withOpacity(0.5), blurRadius: 6, spreadRadius: 1)]
                      : [],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  isOpen ? 'Gym Gate is Open — You may enter' : 'Gym Gate is Closed',
                  style: GoogleFonts.inter(
                    color: isOpen ? const Color(0xFF00C896) : AppColors.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Icon(
                isOpen ? Icons.door_front_door_rounded : Icons.lock_outline_rounded,
                color: isOpen ? const Color(0xFF00C896) : AppColors.textHint,
                size: 16,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _OnDutyCoaches extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.getOnDutyCoachesStream(),
      builder: (ctx, snap) {
        if (!snap.hasData || snap.data!.isEmpty) {
          return _EmptyCard(message: 'No coaches on duty right now');
        }
        return Column(
          children: snap.data!.map((shift) {
            final name = shift['coachName'] as String? ?? 'Coach';
            final words = name.split(' ');
            final initials = words.length >= 2
                ? '${words[0][0]}${words[1][0]}'.toUpperCase()
                : name.substring(0, 1).toUpperCase();
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(13),
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
                        color: AppColors.green, fontSize: 13,
                        fontWeight: FontWeight.w700))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(name, style: GoogleFonts.inter(
                      color: Colors.white, fontSize: 13,
                      fontWeight: FontWeight.w600)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.green.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(width: 6, height: 6,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle, color: AppColors.green)),
                        const SizedBox(width: 5),
                        Text('On Duty', style: GoogleFonts.inter(
                          color: AppColors.green, fontSize: 10,
                          fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }
}

class _EmptyCard extends StatelessWidget {
  final String message;
  const _EmptyCard({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Center(
        child: Text(message,
          style: GoogleFonts.inter(color: AppColors.textHint, fontSize: 13),
        ),
      ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../core/app_colors.dart';
import '../providers/app_provider.dart';
import '../services/firestore_service.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

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

              // Header
              Row(
                children: [
                  Text('Profile',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: () => _confirmSignOut(context, provider),
                    child: Text('Sign Out',
                      style: GoogleFonts.inter(
                        color: AppColors.red,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Avatar + name
              Center(
                child: Column(
                  children: [
                    Stack(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
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
                              _initials(provider.memberName),
                              style: GoogleFonts.inter(
                                color: Colors.black,
                                fontWeight: FontWeight.w800,
                                fontSize: 28,
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: Container(
                            width: 26,
                            height: 26,
                            decoration: BoxDecoration(
                              color: AppColors.card,
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.background, width: 2),
                            ),
                            child: const Icon(Icons.camera_alt_rounded,
                              color: AppColors.textSecondary, size: 13),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(provider.memberName,
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(provider.currentUser?.email ?? '',
                      style: GoogleFonts.inter(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 8),
                    if (provider.memberId.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.cyan.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: AppColors.cyan.withOpacity(0.3)),
                        ),
                        child: Text(provider.memberId,
                          style: GoogleFonts.inter(
                            color: AppColors.cyan,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Body stats 2x2
              if (member != null) _BodyStatsGrid(member: member),
              const SizedBox(height: 20),

              // Trainer card
              if (member?['trainerName'] != null) _TrainerCard(member: member!),
              if (member?['trainerName'] != null) const SizedBox(height: 20),

              // Membership plan card
              _MembershipInfo(provider: provider, member: member),
              const SizedBox(height: 20),

              // Payment history button
              if (member != null)
                _PaymentHistorySection(memberDocId: member['id']),
              const SizedBox(height: 20),

              // Settings list
              _SettingsList(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : 'M';
  }

  Future<void> _confirmSignOut(BuildContext context, AppProvider provider) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.card,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Sign Out',
          style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w700)),
        content: Text('Are you sure you want to sign out?',
          style: GoogleFonts.inter(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: Text('Cancel',
              style: GoogleFonts.inter(color: AppColors.textSecondary)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: Text('Sign Out',
              style: GoogleFonts.inter(color: AppColors.red, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
    if (confirmed == true) await provider.signOut();
  }
}

class _BodyStatsGrid extends StatelessWidget {
  final Map<String, dynamic> member;
  const _BodyStatsGrid({required this.member});

  @override
  Widget build(BuildContext context) {
    final items = [
      (label: 'Weight', value: member['weight'] != null ? '${member['weight']} kg' : '--', icon: Icons.monitor_weight_outlined, color: AppColors.cyan),
      (label: 'Height', value: member['height'] != null ? '${member['height']} cm' : '--', icon: Icons.straighten_rounded, color: const Color(0xFF00C896)),
      (label: 'Age', value: member['age'] != null ? '${member['age']} yrs' : '--', icon: Icons.cake_outlined, color: AppColors.purple),
      (label: 'BMI', value: _calcBmi(member), icon: Icons.speed_rounded, color: const Color(0xFFF59E0B)),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 2.0,
      children: items.map((item) => _StatTile(
        label: item.label,
        value: item.value,
        icon: item.icon,
        color: item.color,
      )).toList(),
    );
  }

  static String _calcBmi(Map<String, dynamic> m) {
    try {
      final w = (m['weight'] as num).toDouble();
      final h = (m['height'] as num).toDouble() / 100;
      final bmi = w / (h * h);
      return bmi.toStringAsFixed(1);
    } catch (_) {
      return '--';
    }
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _StatTile({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 16),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(value,
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Text(label,
                style: GoogleFonts.inter(
                  color: AppColors.textSecondary,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TrainerCard extends StatelessWidget {
  final Map<String, dynamic> member;
  const _TrainerCard({required this.member});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0D2B3A), Color(0xFF0A1E2A)],
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.cyan.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: AppColors.cyan.withOpacity(0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.person_pin_rounded, color: AppColors.cyan, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Your Trainer',
                  style: GoogleFonts.inter(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(member['trainerName'] ?? 'Unassigned',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.cyan.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('Assigned',
              style: GoogleFonts.inter(
                color: AppColors.cyan,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MembershipInfo extends StatelessWidget {
  final AppProvider provider;
  final Map<String, dynamic>? member;

  const _MembershipInfo({required this.provider, required this.member});

  @override
  Widget build(BuildContext context) {
    String expiryText = 'No expiry date';
    try {
      if (member?['expiryDate'] != null) {
        final d = (member!['expiryDate'] as dynamic).toDate() as DateTime;
        expiryText = 'Expires ${DateFormat('MMM d, yyyy').format(d)}';
      }
    } catch (_) {}

    final isActive = provider.memberStatus == 'Active';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Membership',
            style: GoogleFonts.inter(
              color: AppColors.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Text(provider.memberPlan,
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isActive
                    ? AppColors.green.withOpacity(0.1)
                    : AppColors.red.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(provider.memberStatus,
                  style: GoogleFonts.inter(
                    color: isActive ? AppColors.green : AppColors.red,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(expiryText,
            style: GoogleFonts.inter(
              color: AppColors.textSecondary,
              fontSize: 12,
            ),
          ),
          if (!isActive) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _requestRenewal(context, provider, member),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.cyan,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(vertical: 10),
                ),
                child: Text('Request Renewal',
                  style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 13),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _requestRenewal(
    BuildContext context,
    AppProvider provider,
    Map<String, dynamic>? member,
  ) async {
    if (member == null) return;
    try {
      await FirestoreService.requestRenewal(
        memberDocId: member['id'],
        memberId: provider.memberId,
        memberName: provider.memberName,
        plan: provider.memberPlan,
      );
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Renewal request sent!',
              style: GoogleFonts.inter(color: Colors.black, fontWeight: FontWeight.w600)),
            backgroundColor: const Color(0xFF00C896),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to send request. Try again.',
              style: GoogleFonts.inter(color: Colors.white)),
            backgroundColor: AppColors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    }
  }
}

class _PaymentHistorySection extends StatelessWidget {
  final String memberDocId;
  const _PaymentHistorySection({required this.memberDocId});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: FirestoreService.getMemberPaymentsStream(memberDocId),
      builder: (ctx, snap) {
        final payments = snap.data ?? [];
        if (payments.isEmpty) return const SizedBox.shrink();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Payment History',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: payments.take(5).toList().asMap().entries.map((entry) {
                  final i = entry.key;
                  final p = entry.value;
                  return _PaymentTile(payment: p, isLast: i == (payments.length > 5 ? 4 : payments.length - 1));
                }).toList(),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _PaymentTile extends StatelessWidget {
  final Map<String, dynamic> payment;
  final bool isLast;
  const _PaymentTile({required this.payment, required this.isLast});

  @override
  Widget build(BuildContext context) {
    final status = payment['status'] ?? 'Paid';
    final isPaid = status == 'Paid';
    DateTime? dt;
    try {
      final ts = payment['createdAt'];
      if (ts != null) dt = (ts as dynamic).toDate() as DateTime;
    } catch (_) {}

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: !isLast ? const Border(bottom: BorderSide(color: AppColors.border)) : null,
      ),
      child: Row(
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: isPaid
                ? const Color(0xFF00C896).withOpacity(0.1)
                : const Color(0xFFF59E0B).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isPaid ? Icons.check_circle_outline : Icons.schedule_rounded,
              color: isPaid ? const Color(0xFF00C896) : const Color(0xFFF59E0B),
              size: 16,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(payment['month'] ?? (dt != null ? DateFormat('MMMM yyyy').format(dt) : 'Payment'),
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(payment['plan'] ?? '',
                  style: GoogleFonts.inter(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('RM ${payment['amount'] ?? '--'}',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isPaid
                    ? const Color(0xFF00C896).withOpacity(0.1)
                    : const Color(0xFFF59E0B).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(status,
                  style: GoogleFonts.inter(
                    color: isPaid ? const Color(0xFF00C896) : const Color(0xFFF59E0B),
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SettingsList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final items = [
      (icon: Icons.notifications_outlined, label: 'Notifications', color: AppColors.cyan),
      (icon: Icons.privacy_tip_outlined, label: 'Privacy', color: AppColors.purple),
      (icon: Icons.help_outline_rounded, label: 'Help & Support', color: const Color(0xFF00C896)),
      (icon: Icons.info_outline_rounded, label: 'About FitForge', color: AppColors.textSecondary),
    ];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: items.asMap().entries.map((entry) {
          final i = entry.key;
          final item = entry.value;
          return InkWell(
            onTap: () {},
            borderRadius: BorderRadius.circular(i == 0 ? 16 : 0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                border: i < items.length - 1
                  ? const Border(bottom: BorderSide(color: AppColors.border))
                  : null,
              ),
              child: Row(
                children: [
                  Icon(item.icon, color: item.color, size: 18),
                  const SizedBox(width: 12),
                  Text(item.label,
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 14,
                    ),
                  ),
                  const Spacer(),
                  const Icon(Icons.chevron_right, color: AppColors.textHint, size: 18),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}


import 'package:cloud_firestore/cloud_firestore.dart';

class FirestoreService {
  static final _db = FirebaseFirestore.instance;

  // ── Attendance ────────────────────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> getMemberAttendance(String memberDocId) async {
    final snap = await _db
        .collection('attendance')
        .where('memberDocId', isEqualTo: memberDocId)
        .orderBy('checkInTime', descending: true)
        .get();
    return snap.docs.map((d) => {'id': d.id, ...d.data()}).toList();
  }

  static Stream<List<Map<String, dynamic>>> getMemberAttendanceStream(String memberDocId) {
    return _db
        .collection('attendance')
        .where('memberDocId', isEqualTo: memberDocId)
        .orderBy('checkInTime', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => {'id': d.id, ...d.data()}).toList());
  }

  // ── Payments ──────────────────────────────────────────────────────────────

  static Stream<List<Map<String, dynamic>>> getMemberPaymentsStream(String memberDocId) {
    return _db
        .collection('payments')
        .where('memberDocId', isEqualTo: memberDocId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => {'id': d.id, ...d.data()}).toList());
  }

  // ── Classes ───────────────────────────────────────────────────────────────

  static Stream<List<Map<String, dynamic>>> getActiveClassesStream() {
    return _db
        .collection('classes')
        .where('status', isEqualTo: 'Active')
        .snapshots()
        .map((snap) => snap.docs.map((d) => {'id': d.id, ...d.data()}).toList());
  }

  // ── Announcements ─────────────────────────────────────────────────────────

  static Stream<List<Map<String, dynamic>>> getAnnouncementsStream() {
    return _db
        .collection('announcements')
        .orderBy('createdAt', descending: true)
        .limit(20)
        .snapshots()
        .map((snap) => snap.docs.map((d) => {'id': d.id, ...d.data()}).toList());
  }

  // ── Renewals ──────────────────────────────────────────────────────────────

  static Future<void> requestRenewal({
    required String memberDocId,
    required String memberId,
    required String memberName,
    required String plan,
  }) async {
    await _db.collection('renewals').add({
      'memberDocId': memberDocId,
      'memberId': memberId,
      'memberName': memberName,
      'plan': plan,
      'status': 'Pending',
      'requestedBy': 'member',
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  // ── Today's Attendance (all members) ─────────────────────────────────────

  static Stream<List<Map<String, dynamic>>> getTodayAttendanceStream() {
    final today = DateTime.now().toIso8601String().split('T')[0];
    return _db
        .collection('attendance')
        .where('date', isEqualTo: today)
        .orderBy('checkInTime', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) => {'id': d.id, ...d.data()}).toList());
  }

  // ── On-duty coaches ────────────────────────────────────────────────────────

  static Stream<List<Map<String, dynamic>>> getOnDutyCoachesStream() {
    final today = DateTime.now().toIso8601String().split('T')[0];
    return _db
        .collection('coachShifts')
        .where('date', isEqualTo: today)
        .orderBy('startTime', descending: false)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => {'id': d.id, ...d.data()})
            .where((s) => s['endTime'] == null)
            .toList());
  }

  // ── Gate Status ───────────────────────────────────────────────────────────

  static Stream<bool> getGateStatusStream() {
    return _db.collection('meta').doc('gate').snapshots().map((snap) {
      if (!snap.exists) return false;
      return snap.data()?['isOpen'] as bool? ?? false;
    });
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  static Stream<Map<String, dynamic>?> getSettingsStream() {
    return _db.collection('settings').doc('gym').snapshots().map((snap) {
      if (!snap.exists) return null;
      return snap.data();
    });
  }
}

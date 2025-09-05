import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppProvider extends ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db  = FirebaseFirestore.instance;

  User?                    _currentUser;
  Map<String, dynamic>?   _memberData;
  Map<String, dynamic>?   _coachData;
  bool                     _isLoading = true;
  String?                  _authError;
  String                   _role = 'member'; // 'member' | 'coach'
  StreamSubscription<DocumentSnapshot>? _dataSub;

  // ── Getters ───────────────────────────────────────────────────────────────
  User?                  get currentUser  => _currentUser;
  Map<String, dynamic>?  get memberData   => _memberData;
  Map<String, dynamic>?  get coachData    => _coachData;
  bool                   get isLoading    => _isLoading;
  String?                get memberError  => _authError;
  String                 get role         => _role;
  bool                   get isCoach      => _coachData != null;

  // Member
  String get memberName   => _memberData?['name']     ?? 'Member';
  String get memberPlan   => _memberData?['plan']     ?? 'Standard';
  String get memberStatus => _memberData?['status']   ?? 'Active';
  String get memberId     => _memberData?['memberId'] ?? '';

  // Coach
  String get coachName      => _coachData?['name']           ?? 'Coach';
  String get coachId        => _coachData?['coachId']        ?? '';
  String get coachDocId     => _coachData?['id']             ?? '';
  bool   get isOnDuty       => _coachData?['isOnDuty']       == true;
  String? get currentShiftId => _coachData?['currentShiftId'] as String?;

  // Password change — works for both member and coach
  bool get passwordChanged {
    if (_coachData != null) return _coachData?['passwordChanged'] == true;
    return _memberData?['passwordChanged'] == true;
  }
  bool get needsPasswordChange {
    if (_coachData != null) return !passwordChanged;
    return _currentUser != null && _memberData != null && !passwordChanged;
  }

  AppProvider() {
    _auth.authStateChanges().listen(_onAuthChanged);
  }

  // ── Auth state ────────────────────────────────────────────────────────────
  Future<void> _onAuthChanged(User? user) async {
    _currentUser = user;
    _dataSub?.cancel();
    if (user != null) {
      final prefs = await SharedPreferences.getInstance();
      _role = prefs.getString('user_role') ?? 'member';
      if (_role == 'coach') {
        await _loadCoachData(user.email ?? '');
      } else {
        await _loadMemberData(user.uid);
      }
    } else {
      _memberData = null;
      _coachData  = null;
      _authError  = null;
      _isLoading  = false;
      notifyListeners();
    }
  }

  Future<void> _loadMemberData(String uid) async {
    _isLoading = true;
    notifyListeners();

    final q = await _db
        .collection('members')
        .where('uid', isEqualTo: uid)
        .limit(1)
        .get();

    if (q.docs.isNotEmpty) {
      final docId = q.docs.first.id;
      _authError = null;
      _dataSub = _db.collection('members').doc(docId).snapshots().listen((snap) {
        if (snap.exists) _memberData = {'id': snap.id, ...snap.data()!};
        _isLoading = false;
        notifyListeners();
      });
    } else {
      _memberData = null;
      _authError  = 'Not registered as a member. Try the Coach login.';
      _isLoading  = false;
      notifyListeners();
      await _auth.signOut();
    }
  }

  Future<void> _loadCoachData(String email) async {
    _isLoading = true;
    notifyListeners();

    final q = await _db
        .collection('trainers')
        .where('email', isEqualTo: email)
        .limit(1)
        .get();

    if (q.docs.isNotEmpty) {
      final docId = q.docs.first.id;
      _authError = null;
      _dataSub = _db.collection('trainers').doc(docId).snapshots().listen((snap) {
        if (snap.exists) _coachData = {'id': snap.id, ...snap.data()!};
        _isLoading = false;
        notifyListeners();
      });
    } else {
      _coachData = null;
      _authError = 'Not registered as a coach. Try the Member login.';
      _isLoading = false;
      notifyListeners();
      await _auth.signOut();
    }
  }

  // ── Sign in ───────────────────────────────────────────────────────────────
  Future<String?> signIn(String email, String password, String role) async {
    _authError = null;
    _role = role;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user_role', role);
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      return null;
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'user-not-found':
        case 'wrong-password':
        case 'invalid-credential':
          return 'Invalid email or password.';
        case 'user-disabled':
          return 'Your account has been disabled.';
        case 'too-many-requests':
          return 'Too many attempts. Try again later.';
        default:
          return 'Sign in failed. Please try again.';
      }
    }
  }

  // ── Password reset ────────────────────────────────────────────────────────
  Future<String?> sendPasswordReset(String email) async {
    if (email.trim().isEmpty) return 'Please enter your email address.';
    try {
      await _auth.sendPasswordResetEmail(email: email.trim());
      return null;
    } on FirebaseAuthException catch (e) {
      if (e.code == 'user-not-found') return 'No account found with that email.';
      return e.message ?? 'Failed to send reset email.';
    }
  }

  Future<String?> changePassword(String newPassword) async {
    try {
      await _auth.currentUser!.updatePassword(newPassword);
      if (_coachData != null) {
        await _db.collection('trainers').doc(_coachData!['id']).update({
          'passwordChanged': true,
          'tempPassword':    FieldValue.delete(),
        });
      } else if (_memberData != null) {
        await _db.collection('members').doc(_memberData!['id']).update({
          'passwordChanged': true,
          'tempPassword':    FieldValue.delete(),
        });
      }
      return null;
    } on FirebaseAuthException catch (e) {
      if (e.code == 'requires-recent-login') return 'Session expired. Please sign in again.';
      return e.message ?? 'Failed to change password.';
    }
  }

  // ── Coach shift ───────────────────────────────────────────────────────────
  Future<void> startShift() async {
    if (_coachData == null) return;
    final docId  = _coachData!['id']      as String;
    final cId    = _coachData!['coachId'] as String? ?? '';
    final name   = _coachData!['name']    as String? ?? 'Coach';

    final shiftRef = await _db.collection('coachShifts').add({
      'coachId':   cId,
      'coachName': name,
      'trainerId': docId,
      'startTime': FieldValue.serverTimestamp(),
      'endTime':   null,
      'date':      DateTime.now().toIso8601String().split('T')[0],
    });

    await _db.collection('trainers').doc(docId).update({
      'isOnDuty':       true,
      'shiftStarted':   FieldValue.serverTimestamp(),
      'currentShiftId': shiftRef.id,
    });
  }

  Future<void> endShift() async {
    if (_coachData == null) return;
    final docId   = _coachData!['id']             as String;
    final shiftId = _coachData!['currentShiftId'] as String?;
    if (shiftId == null) return;

    await _db.collection('coachShifts').doc(shiftId).update({
      'endTime': FieldValue.serverTimestamp(),
    });
    await _db.collection('trainers').doc(docId).update({
      'isOnDuty':       false,
      'shiftStarted':   null,
      'currentShiftId': null,
    });
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  Future<void> signOut() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user_role');
    _coachData  = null;
    _memberData = null;
    await _auth.signOut();
  }

  @override
  void dispose() {
    _dataSub?.cancel();
    super.dispose();
  }
}

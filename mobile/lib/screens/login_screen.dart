import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import '../core/app_colors.dart';
import '../providers/app_provider.dart';

class LoginScreen extends StatefulWidget {
  final String role; // 'member' | 'coach'
  const LoginScreen({super.key, required this.role});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _obscure      = true;
  bool _loading      = false;
  bool _resetLoading = false;
  bool _resetSent    = false;
  String? _error;

  bool get _isCoach => widget.role == 'coach';

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _signIn() async {
    if (_emailCtrl.text.trim().isEmpty || _passCtrl.text.isEmpty) {
      setState(() => _error = 'Please fill in all fields.');
      return;
    }
    setState(() { _loading = true; _error = null; _resetSent = false; });
    final err = await context.read<AppProvider>().signIn(
      _emailCtrl.text.trim(),
      _passCtrl.text,
      widget.role,
    );
    if (!mounted) return;
    if (err != null) {
      // Firebase Auth failed (wrong password, user not found, etc.)
      setState(() { _loading = false; _error = err; });
    } else {
      // Auth succeeded — pop to root so AuthWrapper shows the correct screen
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }

  Future<void> _forgotPassword() async {
    setState(() { _resetLoading = true; _error = null; _resetSent = false; });
    final err = await context.read<AppProvider>().sendPasswordReset(_emailCtrl.text);
    if (mounted) setState(() { _resetLoading = false; _error = err; _resetSent = err == null; });
  }

  @override
  Widget build(BuildContext context) {
    final accent = _isCoach ? AppColors.green : AppColors.cyan;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),

              // Back button
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: Colors.white, size: 16),
                ),
              ),
              const SizedBox(height: 32),

              // Role icon
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: _isCoach
                        ? [const Color(0xFF00C896), const Color(0xFF007A5E)]
                        : [const Color(0xFF00C896), AppColors.cyan],
                  ),
                ),
                child: Icon(
                  _isCoach ? Icons.fitness_center_rounded : Icons.person_rounded,
                  color: Colors.black,
                  size: 26,
                ),
              ),
              const SizedBox(height: 24),

              Text('Welcome back',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: accent.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: accent.withOpacity(0.3)),
                    ),
                    child: Text(
                      _isCoach ? 'Coach Login' : 'Member Login',
                      style: GoogleFonts.inter(
                        color: accent,
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 36),

              // Email
              _label('Email'),
              const SizedBox(height: 8),
              _textField(
                controller: _emailCtrl,
                hint: 'your@email.com',
                keyboardType: TextInputType.emailAddress,
                accent: accent,
              ),
              const SizedBox(height: 20),

              // Password
              _label('Password'),
              const SizedBox(height: 8),
              _textField(
                controller: _passCtrl,
                hint: '••••••••',
                obscure: _obscure,
                accent: accent,
                suffix: IconButton(
                  icon: Icon(
                    _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                    color: AppColors.textSecondary, size: 20,
                  ),
                  onPressed: () => setState(() => _obscure = !_obscure),
                ),
              ),

              // Forgot password (members only)
              if (!_isCoach) ...[
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: (_loading || _resetLoading) ? null : _forgotPassword,
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 0, vertical: 4),
                      minimumSize: Size.zero,
                      tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    ),
                    child: _resetLoading
                        ? const SizedBox(width: 14, height: 14,
                            child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.cyan))
                        : Text('Forgot Password?',
                            style: GoogleFonts.inter(
                              color: AppColors.cyan, fontSize: 13, fontWeight: FontWeight.w500)),
                  ),
                ),
              ],

              if (_resetSent) ...[
                const SizedBox(height: 12),
                _banner(
                  color: AppColors.green,
                  icon: Icons.check_circle_outline,
                  text: 'Password reset email sent. Check your inbox.',
                ),
              ],

              if (_error != null) ...[
                const SizedBox(height: 12),
                _banner(
                  color: AppColors.red,
                  icon: Icons.error_outline,
                  text: _error!,
                ),
              ],

              const SizedBox(height: 28),

              // Sign in button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _loading ? null : _signIn,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: accent,
                    foregroundColor: Colors.black,
                    disabledBackgroundColor: accent.withOpacity(0.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: _loading
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                      : Text('Sign In',
                          style: GoogleFonts.inter(fontWeight: FontWeight.w700, fontSize: 15)),
                ),
              ),

              const SizedBox(height: 24),
              Center(
                child: Text(
                  _isCoach
                      ? 'Contact your gym manager to get coach access.'
                      : 'Contact your gym owner to get member access.',
                  style: GoogleFonts.inter(color: AppColors.textHint, fontSize: 13),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Text(text,
    style: GoogleFonts.inter(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500));

  Widget _banner({required Color color, required IconData icon, required String text}) =>
    Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(children: [
        Icon(icon, color: color, size: 16),
        const SizedBox(width: 8),
        Expanded(child: Text(text, style: GoogleFonts.inter(color: color, fontSize: 13))),
      ]),
    );

  Widget _textField({
    required TextEditingController controller,
    required String hint,
    required Color accent,
    TextInputType? keyboardType,
    bool obscure = false,
    Widget? suffix,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscure,
      style: GoogleFonts.inter(color: Colors.white, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: GoogleFonts.inter(color: AppColors.textHint),
        suffixIcon: suffix,
        filled: true,
        fillColor: AppColors.card,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: accent, width: 1.5),
        ),
      ),
    );
  }
}

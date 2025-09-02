import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'core/firebase_options.dart';
import 'core/app_colors.dart';
import 'providers/app_provider.dart';
import 'screens/role_select_screen.dart';
import 'screens/main_screen.dart';
import 'screens/coach_home_screen.dart';
import 'screens/force_password_change_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  runApp(const FitForgeApp());
}

class FitForgeApp extends StatelessWidget {
  const FitForgeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AppProvider(),
      child: MaterialApp(
        title: 'FitForge',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          brightness: Brightness.dark,
          scaffoldBackgroundColor: AppColors.background,
          colorScheme: const ColorScheme.dark(
            primary: AppColors.cyan,
            secondary: AppColors.green,
            surface: AppColors.card,
          ),
          textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
          appBarTheme: AppBarTheme(
            backgroundColor: AppColors.background,
            elevation: 0,
            titleTextStyle: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
            iconTheme: const IconThemeData(color: Colors.white),
          ),
          useMaterial3: true,
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();

    // Loading
    if (provider.isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: CircularProgressIndicator(color: AppColors.cyan),
        ),
      );
    }

    // Not logged in → role selection
    if (provider.currentUser == null) {
      return const RoleSelectScreen();
    }

    // Force password change for both members and coaches
    if (provider.needsPasswordChange) {
      return const ForcePasswordChangeScreen();
    }

    // Coach home
    if (provider.isCoach) {
      return const CoachHomeScreen();
    }

    // Member home
    return const MainScreen();
  }
}

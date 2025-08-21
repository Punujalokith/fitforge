import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        return android;
    }
  }

  // ── Android ─────────────────────────────────────────────────────────────────
  // Run: flutterfire configure --project=fitforge-35f33
  // to auto-generate this file with correct values.
  // For now, use these placeholder values and replace after running flutterfire.
  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyBZZLKdiVz8WyLSNHW46Y0d1_BShvkfPeA',
    appId: '1:483241590862:android:REPLACE_WITH_ANDROID_APP_ID',
    messagingSenderId: '483241590862',
    projectId: 'fitforge-35f33',
    storageBucket: 'fitforge-35f33.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBZZLKdiVz8WyLSNHW46Y0d1_BShvkfPeA',
    appId: '1:483241590862:ios:REPLACE_WITH_IOS_APP_ID',
    messagingSenderId: '483241590862',
    projectId: 'fitforge-35f33',
    storageBucket: 'fitforge-35f33.firebasestorage.app',
    iosBundleId: 'com.fitforge.fitforgeApp',
  );
}

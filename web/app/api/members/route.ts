import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

// Initialize Firebase Admin once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

function generateTempPassword(id: string): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${id}-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "createMember") {
      const { email, memberId, name } = body;
      const tempPassword = generateTempPassword(memberId);

      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email,
        password: tempPassword,
        displayName: name,
      });

      return NextResponse.json({
        uid: userRecord.uid,
        tempPassword,
      });
    }

    if (action === "createCoach") {
      const { email, coachId, name } = body;
      const tempPassword = generateTempPassword(coachId);
      const userRecord = await admin.auth().createUser({
        email,
        password: tempPassword,
        displayName: name,
      });
      return NextResponse.json({ uid: userRecord.uid, tempPassword });
    }

    if (action === "resetCoachPassword") {
      const { uid, coachId } = body;
      const tempPassword = generateTempPassword(coachId);
      await admin.auth().updateUser(uid, { password: tempPassword });
      return NextResponse.json({ tempPassword });
    }

    if (action === "deleteMember") {
      const { uid } = body;
      if (uid) await admin.auth().deleteUser(uid);
      return NextResponse.json({ success: true });
    }

    if (action === "resetPassword") {
      const { uid, memberId } = body;
      const tempPassword = generateTempPassword(memberId);
      await admin.auth().updateUser(uid, { password: tempPassword });
      return NextResponse.json({ tempPassword });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

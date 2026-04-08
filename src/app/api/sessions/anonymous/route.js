/**
 * Next.js API Route for creating a temporary, anonymous session.
 *
 * This endpoint is located at `/api/sessions/anonymous` and handles POST requests.
 * It's designed to be called when a student clicks "Get Help Anonymously".
 * It takes minimal, non-identifying information, creates a secure session profile,
 * and returns a session token to the frontend.
 *
 * File Path: /src/app/api/sessions/anonymous/route.js
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const SESSION_DURATION_HOURS = 24; // Session lifespan (e.g., 24 hours)

/**
 * A mock database interaction function.
 * In a real-world application, this would interact with your SQL/NoSQL database.
 * It simulates saving the anonymous session data to the 'anonymous_sessions' table.
 *
 * @param {object} sessionData - The session data to be saved.
 * @returns {Promise<object>} - A promise that resolves with the saved session data.
 */
const saveAnonymousSessionToDB = async (sessionData) => {
  console.log('--- Simulating Database Write (Next.js) ---');
  console.log('Table: anonymous_sessions');
  console.log('Data:', sessionData);
  console.log('--- End Simulation ---');
  // Simulate an async operation and return the data as if it were retrieved from the DB
  return Promise.resolve(sessionData);
};

/**
 * Handles GET requests to /api/sessions/anonymous for testing.
 */
export async function GET() {
  return NextResponse.json({
    message: 'Anonymous session API is working',
    timestamp: new Date().toISOString()
  });
}

/**
 * Handles POST requests to /api/sessions/anonymous.
 * @param {Request} request - The incoming request object.
 */
export async function POST(request) {
  try {
    // 1. Extract minimal, non-identifying data from the request body.
    const {
      ageRange,
      academicYear,
      preferredLanguage
    } = await request.json();

    // Basic validation to ensure required fields are present
    if (!ageRange || !academicYear || !preferredLanguage) {
      return NextResponse.json({
        error: 'Missing required fields: ageRange, academicYear, preferredLanguage.'
      }, {
        status: 400
      });
    }

    // 2. Generate unique and secure identifiers for the session.
    const sessionId = uuidv4(); // Primary key for the session record (UUID)
    const sessionToken = crypto.randomBytes(32).toString('hex'); // Secure token for client-side authentication

    // 3. Calculate the session's expiration timestamp.
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    // 4. Structure the profile data according to the specified JSON model.
    const profileData = {
      demographics: {
        ageRange,
        academicYear,
        preferredLanguage,
      },
      screeningResults: {},
      sessionPreferences: {
        communicationMode: 'chat',
        anonymityLevel: 'high',
      },
    };

    // 5. Prepare the complete record for the 'anonymous_sessions' table.
    const sessionRecord = {
      session_id: sessionId,
      session_token: sessionToken,
      profile_data: profileData,
      expires_at: expiresAt.toISOString(),
      created_at: now.toISOString(),
      is_active: true,
    };

    // 6. Save the session record to the database.
    const savedSession = await saveAnonymousSessionToDB(sessionRecord);

    // 7. Respond to the client with the session token and expiration details.
    return NextResponse.json({
      message: 'Anonymous session created successfully.',
      sessionToken: savedSession.session_token,
      expiresAt: savedSession.expires_at,
    }, {
      status: 201
    });

  } catch (error) {
    console.error('Error creating anonymous session:', error);
    return NextResponse.json({
      error: 'An internal server error occurred. Please try again later.'
    }, {
      status: 500
    });
  }
}

import connectDB from './mongodb.js';
import MoodAssessment from '../models/MoodAssessment.js';
import AnonymousSession from '../models/AnonymousSession.js';

export async function createMoodAssessment(data) {
  try {
    await connectDB();
    const assessment = new MoodAssessment(data);
    return await assessment.save();
  } catch (error) {
    console.error('Error in createMoodAssessment:', error);
    throw error;
  }
}

export async function getStudentMoodHistory(studentId) {
  try {
    await connectDB();
    return await MoodAssessment.find({ student: studentId })
      .sort({ date: -1 })
      .limit(30);
  } catch (error) {
    console.error('Error in getStudentMoodHistory:', error);
    return [];
  }
}

export async function createAnonymousSession(data) {
  try {
    await connectDB();
    const session = new AnonymousSession(data);
    return await session.save();
  } catch (error) {
    console.error('Error in createAnonymousSession:', error);
    throw error;
  }
}

export async function updateAnonymousSession(sessionKey, updateData) {
  try {
    await connectDB();
    return await AnonymousSession.findOneAndUpdate(
      { sessionKey },
      { ...updateData, endedAt: new Date() },
      { new: true }
    );
  } catch (error) {
    console.error('Error in updateAnonymousSession:', error);
    throw error;
  }
}

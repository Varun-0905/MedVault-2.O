import connectDB from './mongodb.js';
import Appointment from '../models/Appointment.js';

export async function createAppointment(data) {
  try {
    await connectDB();
    const appointment = new Appointment(data);
    return await appointment.save();
  } catch (error) {
    console.error('Error in createAppointment:', error);
    throw error;
  }
}

export async function getAppointmentsByStudent(studentId) {
  try {
    await connectDB();
    return await Appointment.find({ student: studentId })
      .populate('professional')
      .sort({ dateTime: -1 });
  } catch (error) {
    console.error('Error in getAppointmentsByStudent:', error);
    return [];
  }
}

export async function updateAppointmentStatus(id, status) {
  try {
    await connectDB();
    return await Appointment.findByIdAndUpdate(id, { status }, { new: true });
  } catch (error) {
    console.error('Error in updateAppointmentStatus:', error);
    throw error;
  }
}

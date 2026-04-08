import connectDB from './mongodb.js';
import Therapist from '../models/Therapist.js';
import Counselor from '../models/Counselor.js';
import Advisor from '../models/Advisor.js';

export async function getAllTherapists() {
  try {
    await connectDB();
    return await Therapist.find({ status: 'active' }).sort({ name: 1 });
  } catch (error) {
    console.error('Error in getAllTherapists:', error);
    return [];
  }
}

export async function createTherapist(data) {
  try {
    await connectDB();
    const therapist = new Therapist(data);
    return await therapist.save();
  } catch (error) {
    console.error('Error in createTherapist:', error);
    throw error;
  }
}

export async function getAllCounselors() {
  try {
    await connectDB();
    return await Counselor.find({ status: 'active' }).sort({ name: 1 });
  } catch (error) {
    console.error('Error in getAllCounselors:', error);
    return [];
  }
}

export async function getAllAdvisors() {
  try {
    await connectDB();
    return await Advisor.find({ status: 'active' }).sort({ name: 1 });
  } catch (error) {
    console.error('Error in getAllAdvisors:', error);
    return [];
  }
}

export async function getProfessionalById(id, type) {
  try {
    await connectDB();
    if (type === 'Therapist') return await Therapist.findById(id);
    if (type === 'Counselor') return await Counselor.findById(id);
    if (type === 'Advisor') return await Advisor.findById(id);
    return null;
  } catch (error) {
    console.error('Error in getProfessionalById:', error);
    return null;
  }
}

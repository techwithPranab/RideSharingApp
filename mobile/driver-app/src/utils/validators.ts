/**
 * Validation utility functions
 */

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
};

/**
 * Validate vehicle number plate
 */
export const isValidVehicleNumber = (vehicleNumber: string): boolean => {
  // Basic validation for Indian vehicle number format
  const vehicleRegex = /^[A-Z]{2}\s?\d{2}\s?[A-Z]{1,2}\s?\d{4}$/;
  return vehicleRegex.test(vehicleNumber.toUpperCase());
};

/**
 * Validate driving license number
 */
export const isValidDrivingLicense = (licenseNumber: string): boolean => {
  // Basic validation for Indian driving license format
  const licenseRegex = /^[A-Z]{2}\d{13}$/;
  return licenseRegex.test(licenseNumber.toUpperCase().replace(/\s/g, ''));
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }

  return { isValid: true, message: 'Password is valid' };
};

/**
 * Validate name (no special characters, reasonable length)
 */
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

/**
 * Validate OTP (6 digits)
 */
export const isValidOTP = (otp: string): boolean => {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
};

/**
 * Validate coordinates
 */
export const isValidCoordinates = (latitude: number, longitude: number): boolean => {
  return (
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
};

/**
 * Validate age (for driver registration)
 */
export const isValidAge = (age: number): boolean => {
  return age >= 18 && age <= 65;
};

/**
 * Validate amount (positive number)
 */
export const isValidAmount = (amount: number): boolean => {
  return amount > 0 && Number.isFinite(amount);
};

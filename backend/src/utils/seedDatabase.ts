/**
 * Comprehensive seed data for RideSharing application
 * Includes data for all models and screens
 */

import mongoose from 'mongoose';
import { User, UserRole, UserStatus, KYCStatus } from '../models/User';
import { Vehicle, VehicleType, VehicleStatus } from '../models/Vehicle';
import { Ride, RideStatus, PaymentStatus } from '../models/Ride';
import { Payment, PaymentType, PaymentStatus as PayStatus, PaymentMethod } from '../models/Payment';
import { SubscriptionPlan, BillingCycle } from '../models/Subscription';
import { AdminAnalytics, AnalyticsPeriod } from '../models/AdminAnalytics';
import { AdminActivity, AdminAction, ActivitySeverity } from '../models/AdminActivity';

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Vehicle.deleteMany({}),
      Ride.deleteMany({}),
      Payment.deleteMany({}),
      SubscriptionPlan.deleteMany({}),
      AdminAnalytics.deleteMany({}),
      AdminActivity.deleteMany({})
    ]);

    console.log('🧹 Cleared existing data');

    // 1. Create Admin Users
    const adminUsers = await createAdminUsers();
    console.log(`✅ Created ${adminUsers.length} admin users`);

    // 2. Create Driver Users
    const driverUsers = await createDriverUsers();
    console.log(`✅ Created ${driverUsers.length} driver users`);

    // 3. Create Rider Users
    const riderUsers = await createRiderUsers();
    console.log(`✅ Created ${riderUsers.length} rider users`);

    // 4. Create Vehicles for Drivers
    const vehicles = await createVehicles(driverUsers);
    console.log(`✅ Created ${vehicles.length} vehicles`);

    // 5. Create Subscription Plans
    const subscriptionPlans = await createSubscriptionPlans();
    console.log(`✅ Created ${subscriptionPlans.length} subscription plans`);

    // 6. Create Rides
    const rides = await createRides(driverUsers, riderUsers, vehicles);
    console.log(`✅ Created ${rides.length} rides`);

    // 7. Create Payments
    const payments = await createPayments(rides, driverUsers, riderUsers);
    console.log(`✅ Created ${payments.length} payments`);

    // 8. Create Admin Analytics
    const analytics = await createAdminAnalytics();
    console.log(`✅ Created analytics data`);

    // 9. Create Admin Activities
    const activities = await createAdminActivities(adminUsers);
    console.log(`✅ Created ${activities.length} admin activities`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • ${adminUsers.length} Admin users`);
    console.log(`   • ${driverUsers.length} Driver users`);
    console.log(`   • ${riderUsers.length} Rider users`);
    console.log(`   • ${vehicles.length} Vehicles`);
    console.log(`   • ${subscriptionPlans.length} Subscription plans`);
    console.log(`   • ${rides.length} Rides`);
    console.log(`   • ${payments.length} Payments`);
    console.log(`   • ${analytics.length} Analytics records`);
    console.log(`   • ${activities.length} Admin activities`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Create Admin Users
const createAdminUsers = async () => {
  const adminData = [
    {
      phoneNumber: '+919876543210',
      email: 'admin@rideshare.com',
      firstName: 'Super',
      lastName: 'Admin',
      password: 'admin123',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      registrationSource: 'admin'
    },
    {
      phoneNumber: '+919876543211',
      email: 'manager@rideshare.com',
      firstName: 'Operations',
      lastName: 'Manager',
      password: 'manager123',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      registrationSource: 'admin'
    }
  ];

  const admins = [];
  for (const admin of adminData) {
    const user = new User({
      ...admin,
      password: admin.password // Don't hash here, let the model handle it
    });
    await user.save();
    admins.push(user);
  }

  return admins;
};

// Create Driver Users
const createDriverUsers = async () => {
  const driverData = [
    {
      phoneNumber: '+919876543212',
      email: 'rajesh.driver@rideshare.com',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      password: 'driver123',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      drivingLicenseNumber: 'DL1234567890123',
      drivingLicenseExpiry: new Date('2026-12-31'),
      isAvailable: true,
      averageRating: 4.7,
      totalRatings: 156,
      currentLocation: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Bangalore coordinates
        address: 'Koramangala, Bangalore'
      },
      homeAddress: 'Koramangala 4th Block, Bangalore',
      workAddress: 'MG Road, Bangalore',
      paymentMethods: [
        {
          type: 'upi',
          details: { upiId: 'rajesh.kumar@paytm' },
          isDefault: true,
          isActive: true
        }
      ],
      kycDocuments: [
        {
          type: 'driving_license',
          number: 'DL1234567890123',
          url: 'https://example.com/dl-rajesh.jpg',
          verificationStatus: KYCStatus.APPROVED,
          uploadedAt: new Date('2024-01-15'),
          verifiedAt: new Date('2024-01-16')
        },
        {
          type: 'aadhar',
          number: '1234-5678-9012',
          url: 'https://example.com/aadhar-rajesh.jpg',
          verificationStatus: KYCStatus.APPROVED,
          uploadedAt: new Date('2024-01-15'),
          verifiedAt: new Date('2024-01-16')
        }
      ]
    },
    {
      phoneNumber: '+919876543213',
      email: 'priya.driver@rideshare.com',
      firstName: 'Priya',
      lastName: 'Sharma',
      password: 'driver123',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      drivingLicenseNumber: 'DL9876543210987',
      drivingLicenseExpiry: new Date('2027-06-15'),
      isAvailable: true,
      averageRating: 4.9,
      totalRatings: 203,
      currentLocation: {
        type: 'Point',
        coordinates: [77.2090, 28.6139], // Delhi coordinates
        address: 'Connaught Place, Delhi'
      },
      homeAddress: 'Karol Bagh, Delhi',
      workAddress: 'Connaught Place, Delhi',
      paymentMethods: [
        {
          type: 'upi',
          details: { upiId: 'priya.sharma@ybl' },
          isDefault: true,
          isActive: true
        }
      ],
      kycDocuments: [
        {
          type: 'driving_license',
          number: 'DL9876543210987',
          url: 'https://example.com/dl-priya.jpg',
          verificationStatus: KYCStatus.APPROVED,
          uploadedAt: new Date('2024-02-10'),
          verifiedAt: new Date('2024-02-11')
        }
      ]
    },
    {
      phoneNumber: '+919876543214',
      email: 'arun.driver@rideshare.com',
      firstName: 'Arun',
      lastName: 'Patel',
      password: 'driver123',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      drivingLicenseNumber: 'DL4567891234567',
      drivingLicenseExpiry: new Date('2026-08-20'),
      isAvailable: false,
      averageRating: 4.3,
      totalRatings: 89,
      currentLocation: {
        type: 'Point',
        coordinates: [72.8777, 19.0760], // Mumbai coordinates
        address: 'Andheri West, Mumbai'
      },
      homeAddress: 'Andheri West, Mumbai',
      workAddress: 'Bandra West, Mumbai'
    },
    {
      phoneNumber: '+919876543215',
      email: 'meera.driver@rideshare.com',
      firstName: 'Meera',
      lastName: 'Singh',
      password: 'driver123',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      drivingLicenseNumber: 'DL7891234567891',
      drivingLicenseExpiry: new Date('2027-03-10'),
      isAvailable: true,
      averageRating: 4.6,
      totalRatings: 134,
      currentLocation: {
        type: 'Point',
        coordinates: [78.4867, 17.3850], // Hyderabad coordinates
        address: 'Banjara Hills, Hyderabad'
      },
      homeAddress: 'Jubilee Hills, Hyderabad',
      workAddress: 'Banjara Hills, Hyderabad'
    },
    {
      phoneNumber: '+919876543216',
      email: 'vikas.driver@rideshare.com',
      firstName: 'Vikas',
      lastName: 'Gupta',
      password: 'driver123',
      role: UserRole.DRIVER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      drivingLicenseNumber: 'DL3216549873210',
      drivingLicenseExpiry: new Date('2026-11-25'),
      isAvailable: true,
      averageRating: 4.4,
      totalRatings: 67,
      currentLocation: {
        type: 'Point',
        coordinates: [88.3639, 22.5726], // Kolkata coordinates
        address: 'Salt Lake City, Kolkata'
      },
      homeAddress: 'Salt Lake City, Kolkata',
      workAddress: 'Sector V, Kolkata'
    }
  ];

  const drivers = [];
  for (const driver of driverData) {
    const user = new User({
      ...driver,
      password: driver.password, // Don't hash here, let the model handle it
      lastActiveAt: new Date()
    });
    await user.save();
    drivers.push(user);
  }

  return drivers;
};

// Create Rider Users
const createRiderUsers = async () => {
  const riderData = [
    {
      phoneNumber: '+919876543217',
      email: 'amit.rider@rideshare.com',
      firstName: 'Amit',
      lastName: 'Verma',
      password: 'rider123',
      role: UserRole.RIDER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      averageRating: 4.8,
      totalRatings: 45,
      currentLocation: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Bangalore
        address: 'HSR Layout, Bangalore'
      },
      homeAddress: 'HSR Layout, Bangalore',
      workAddress: 'Whitefield, Bangalore',
      paymentMethods: [
        {
          type: 'card',
          details: { cardNumber: '4111' },
          isDefault: true,
          isActive: true
        },
        {
          type: 'upi',
          details: { upiId: 'amit.verma@okicici' },
          isDefault: false,
          isActive: true
        }
      ]
    },
    {
      phoneNumber: '+919876543218',
      email: 'neha.rider@rideshare.com',
      firstName: 'Neha',
      lastName: 'Agarwal',
      password: 'rider123',
      role: UserRole.RIDER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      averageRating: 4.9,
      totalRatings: 78,
      currentLocation: {
        type: 'Point',
        coordinates: [77.2090, 28.6139], // Delhi
        address: 'Lajpat Nagar, Delhi'
      },
      homeAddress: 'Lajpat Nagar, Delhi',
      workAddress: 'Nehru Place, Delhi'
    },
    {
      phoneNumber: '+919876543219',
      email: 'rohit.rider@rideshare.com',
      firstName: 'Rohit',
      lastName: 'Mehta',
      password: 'rider123',
      role: UserRole.RIDER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      averageRating: 4.6,
      totalRatings: 32,
      currentLocation: {
        type: 'Point',
        coordinates: [72.8777, 19.0760], // Mumbai
        address: 'Powai, Mumbai'
      },
      homeAddress: 'Powai, Mumbai',
      workAddress: 'Lower Parel, Mumbai'
    },
    {
      phoneNumber: '+919876543220',
      email: 'kavita.rider@rideshare.com',
      firstName: 'Kavita',
      lastName: 'Joshi',
      password: 'rider123',
      role: UserRole.RIDER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      averageRating: 4.7,
      totalRatings: 56,
      currentLocation: {
        type: 'Point',
        coordinates: [78.4867, 17.3850], // Hyderabad
        address: 'Gachibowli, Hyderabad'
      },
      homeAddress: 'Gachibowli, Hyderabad',
      workAddress: 'Hi-Tech City, Hyderabad'
    },
    {
      phoneNumber: '+919876543221',
      email: 'suresh.rider@rideshare.com',
      firstName: 'Suresh',
      lastName: 'Rao',
      password: 'rider123',
      role: UserRole.RIDER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      averageRating: 4.5,
      totalRatings: 23,
      currentLocation: {
        type: 'Point',
        coordinates: [77.5946, 12.9716], // Bangalore
        address: 'Electronic City, Bangalore'
      },
      homeAddress: 'Electronic City, Bangalore',
      workAddress: 'Marathahalli, Bangalore'
    },
    {
      phoneNumber: '+919876543222',
      email: 'anita.rider@rideshare.com',
      firstName: 'Anita',
      lastName: 'Gupta',
      password: 'rider123',
      role: UserRole.RIDER,
      status: UserStatus.ACTIVE,
      isPhoneVerified: true,
      isEmailVerified: true,
      kycStatus: KYCStatus.APPROVED,
      averageRating: 4.8,
      totalRatings: 41,
      currentLocation: {
        type: 'Point',
        coordinates: [88.3639, 22.5726], // Kolkata
        address: 'New Town, Kolkata'
      },
      homeAddress: 'New Town, Kolkata',
      workAddress: 'Rajpur Sonarpur, Kolkata'
    }
  ];

  const riders = [];
  for (const rider of riderData) {
    const user = new User({
      ...rider,
      password: rider.password, // Don't hash here, let the model handle it
      lastActiveAt: new Date()
    });
    await user.save();
    riders.push(user);
  }

  return riders;
};

// Create Vehicles
const createVehicles = async (drivers: any[]) => {
  const vehicleData = [
    {
      driverId: drivers[0]._id,
      make: 'Toyota',
      model: 'Etios',
      year: 2020,
      color: 'White',
      licensePlate: 'KA01AB1234',
      type: VehicleType.SEDAN,
      capacity: 4,
      fuelType: 'petrol',
      registrationNumber: 'KA01AB1234',
      registrationDocument: 'https://example.com/reg-rajesh.jpg',
      insuranceNumber: 'INS123456789',
      insuranceDocument: 'https://example.com/ins-rajesh.jpg',
      insuranceExpiry: new Date('2025-12-31'),
      pucCertificate: 'https://example.com/puc-rajesh.jpg',
      pucExpiry: new Date('2025-06-30'),
      status: VehicleStatus.ACTIVE,
      hasAC: true,
      hasMusic: true,
      hasWifi: false,
      totalDistance: 15420,
      totalTrips: 156,
      averageRating: 4.7
    },
    {
      driverId: drivers[1]._id,
      make: 'Honda',
      model: 'City',
      year: 2019,
      color: 'Silver',
      licensePlate: 'DL01CD5678',
      type: VehicleType.SEDAN,
      capacity: 4,
      fuelType: 'petrol',
      registrationNumber: 'DL01CD5678',
      registrationDocument: 'https://example.com/reg-priya.jpg',
      insuranceNumber: 'INS987654321',
      insuranceDocument: 'https://example.com/ins-priya.jpg',
      insuranceExpiry: new Date('2025-08-15'),
      pucCertificate: 'https://example.com/puc-priya.jpg',
      pucExpiry: new Date('2025-04-20'),
      status: VehicleStatus.ACTIVE,
      hasAC: true,
      hasMusic: true,
      hasWifi: true,
      totalDistance: 22150,
      totalTrips: 203,
      averageRating: 4.9
    },
    {
      driverId: drivers[2]._id,
      make: 'Maruti',
      model: 'Swift',
      year: 2018,
      color: 'Red',
      licensePlate: 'MH01EF9012',
      type: VehicleType.HATCHBACK,
      capacity: 4,
      fuelType: 'petrol',
      registrationNumber: 'MH01EF9012',
      registrationDocument: 'https://example.com/reg-arun.jpg',
      insuranceNumber: 'INS456789123',
      insuranceDocument: 'https://example.com/ins-arun.jpg',
      insuranceExpiry: new Date('2025-10-22'),
      pucCertificate: 'https://example.com/puc-arun.jpg',
      pucExpiry: new Date('2025-05-15'),
      status: VehicleStatus.ACTIVE,
      hasAC: true,
      hasMusic: false,
      hasWifi: false,
      totalDistance: 12890,
      totalTrips: 89,
      averageRating: 4.3
    },
    {
      driverId: drivers[3]._id,
      make: 'Hyundai',
      model: 'Verna',
      year: 2021,
      color: 'Blue',
      licensePlate: 'TS01GH3456',
      type: VehicleType.SEDAN,
      capacity: 4,
      fuelType: 'petrol',
      registrationNumber: 'TS01GH3456',
      registrationDocument: 'https://example.com/reg-meera.jpg',
      insuranceNumber: 'INS789123456',
      insuranceDocument: 'https://example.com/ins-meera.jpg',
      insuranceExpiry: new Date('2026-02-28'),
      pucCertificate: 'https://example.com/puc-meera.jpg',
      pucExpiry: new Date('2025-07-10'),
      status: VehicleStatus.ACTIVE,
      hasAC: true,
      hasMusic: true,
      hasWifi: true,
      totalDistance: 18750,
      totalTrips: 134,
      averageRating: 4.6
    },
    {
      driverId: drivers[4]._id,
      make: 'Tata',
      model: 'Nexon',
      year: 2022,
      color: 'Black',
      licensePlate: 'WB01IJ7890',
      type: VehicleType.SUV,
      capacity: 4,
      fuelType: 'petrol',
      registrationNumber: 'WB01IJ7890',
      registrationDocument: 'https://example.com/reg-vikas.jpg',
      insuranceNumber: 'INS321654987',
      insuranceDocument: 'https://example.com/ins-vikas.jpg',
      insuranceExpiry: new Date('2026-05-18'),
      pucCertificate: 'https://example.com/puc-vikas.jpg',
      pucExpiry: new Date('2025-08-25'),
      status: VehicleStatus.ACTIVE,
      hasAC: true,
      hasMusic: true,
      hasWifi: false,
      totalDistance: 9650,
      totalTrips: 67,
      averageRating: 4.4
    }
  ];

  const vehicles = [];
  for (const vehicle of vehicleData) {
    const veh = new Vehicle(vehicle);
    await veh.save();

    // Update driver's vehicleIds
    await User.findByIdAndUpdate(vehicle.driverId, {
      $push: { vehicleIds: veh._id }
    });

    vehicles.push(veh);
  }

  return vehicles;
};

// Create Subscription Plans
const createSubscriptionPlans = async () => {
  const planData = [
    {
      name: 'Daily Rider',
      type: 'basic',
      description: 'Perfect for daily commuters',
      price: 99,
      billingCycle: BillingCycle.MONTHLY,
      features: ['Unlimited rides', 'Priority booking', '24/7 support'],
      maxRides: 0, // Unlimited
      priorityBooking: true,
      dedicatedSupport: false,
      discountPercentage: 10,
      status: 'active',
      currency: 'INR',
      duration: 30
    },
    {
      name: 'Premium Rider',
      type: 'premium',
      description: 'Premium experience with all features',
      price: 299,
      billingCycle: BillingCycle.MONTHLY,
      features: ['Unlimited rides', 'Priority booking', 'Dedicated support', 'Free cancellation'],
      maxRides: 0,
      priorityBooking: true,
      dedicatedSupport: true,
      discountPercentage: 20,
      status: 'active',
      currency: 'INR',
      duration: 30
    },
    {
      name: 'Weekly Pass',
      type: 'basic',
      description: 'Great value for weekly travel',
      price: 199,
      billingCycle: BillingCycle.MONTHLY,
      features: ['Unlimited rides', 'Priority booking'],
      maxRides: 0,
      priorityBooking: true,
      dedicatedSupport: false,
      discountPercentage: 15,
      status: 'active',
      currency: 'INR',
      duration: 7
    }
  ];

  const plans = [];
  for (const plan of planData) {
    const subscriptionPlan = new SubscriptionPlan(plan);
    await subscriptionPlan.save();
    plans.push(subscriptionPlan);
  }

  return plans;
};

// Create Rides
const createRides = async (drivers: any[], riders: any[], vehicles: any[]) => {
  const rideData = [
    // Completed rides
    {
      rideId: 'R20240910001',
      driverId: drivers[0]._id,
      vehicleId: vehicles[0]._id,
      capacity: 4,
      passengers: [{
        userId: riders[0]._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [77.5946, 12.9716],
          address: 'HSR Layout, Bangalore'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [77.6139, 12.9716],
          address: 'Koramangala, Bangalore'
        },
        fare: 120,
        paymentStatus: PaymentStatus.COMPLETED,
        joinedAt: new Date('2024-09-10T09:00:00Z'),
        rating: 5,
        review: 'Great driver, very professional!'
      }],
      estimatedDistance: 8.5,
      actualDistance: 8.2,
      estimatedDuration: 25,
      actualDuration: 22,
      baseFare: 50,
      totalFare: 120,
      driverEarnings: 102,
      platformCommission: 18,
      status: RideStatus.COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: 'upi',
      requestedAt: new Date('2024-09-10T08:45:00Z'),
      acceptedAt: new Date('2024-09-10T08:47:00Z'),
      startedAt: new Date('2024-09-10T09:00:00Z'),
      completedAt: new Date('2024-09-10T09:22:00Z'),
      otp: '1234'
    },
    {
      rideId: 'R20240910002',
      driverId: drivers[1]._id,
      vehicleId: vehicles[1]._id,
      capacity: 4,
      passengers: [{
        userId: riders[1]._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [77.2090, 28.6139],
          address: 'Lajpat Nagar, Delhi'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [77.2244, 28.6358],
          address: 'Connaught Place, Delhi'
        },
        fare: 85,
        paymentStatus: PaymentStatus.COMPLETED,
        joinedAt: new Date('2024-09-10T14:30:00Z'),
        rating: 4,
        review: 'Good service, reached on time.'
      }],
      estimatedDistance: 6.2,
      actualDistance: 6.5,
      estimatedDuration: 20,
      actualDuration: 18,
      baseFare: 40,
      totalFare: 85,
      driverEarnings: 72.25,
      platformCommission: 12.75,
      status: RideStatus.COMPLETED,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentMethod: 'card',
      requestedAt: new Date('2024-09-10T14:15:00Z'),
      acceptedAt: new Date('2024-09-10T14:18:00Z'),
      startedAt: new Date('2024-09-10T14:30:00Z'),
      completedAt: new Date('2024-09-10T14:48:00Z'),
      otp: '5678'
    },
    // Active rides
    {
      rideId: 'R20240910003',
      driverId: drivers[3]._id,
      vehicleId: vehicles[3]._id,
      capacity: 4,
      passengers: [{
        userId: riders[3]._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [78.4867, 17.3850],
          address: 'Gachibowli, Hyderabad'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [78.4747, 17.3616],
          address: 'Hi-Tech City, Hyderabad'
        },
        fare: 95,
        paymentStatus: PaymentStatus.PENDING,
        joinedAt: new Date()
      }],
      estimatedDistance: 7.8,
      actualDistance: null,
      estimatedDuration: 22,
      actualDuration: null,
      baseFare: 45,
      totalFare: 95,
      driverEarnings: 80.75,
      platformCommission: 14.25,
      status: RideStatus.STARTED,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: 'upi',
      requestedAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      acceptedAt: new Date(Date.now() - 13 * 60 * 1000),
      startedAt: new Date(Date.now() - 10 * 60 * 1000),
      otp: '9012'
    },
    // Cancelled rides
    {
      rideId: 'R20240909001',
      driverId: drivers[2]._id,
      vehicleId: vehicles[2]._id,
      capacity: 4,
      passengers: [{
        userId: riders[2]._id,
        pickupLocation: {
          type: 'Point',
          coordinates: [72.8777, 19.0760],
          address: 'Powai, Mumbai'
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [72.8354, 19.0178],
          address: 'Lower Parel, Mumbai'
        },
        fare: 0,
        paymentStatus: PaymentStatus.FAILED,
        joinedAt: new Date('2024-09-09T11:00:00Z')
      }],
      estimatedDistance: 9.5,
      actualDistance: null,
      estimatedDuration: 30,
      actualDuration: null,
      baseFare: 55,
      totalFare: 0,
      driverEarnings: 0,
      platformCommission: 0,
      status: RideStatus.CANCELLED,
      paymentStatus: PaymentStatus.FAILED,
      paymentMethod: 'upi',
      requestedAt: new Date('2024-09-09T10:45:00Z'),
      acceptedAt: new Date('2024-09-09T10:48:00Z'),
      cancelledAt: new Date('2024-09-09T11:05:00Z'),
      cancellationReason: 'Passenger cancelled the ride'
    }
  ];

  const rides = [];
  for (const ride of rideData) {
    const newRide = new Ride(ride);
    await newRide.save();
    rides.push(newRide);
  }

  return rides;
};

// Create Payments
const createPayments = async (rides: any[], drivers: any[], riders: any[]) => {
  const paymentData = [
    // Ride payments
    {
      paymentId: 'PAY20240910001',
      type: PaymentType.RIDE_PAYMENT,
      payerId: riders[0]._id,
      payeeId: drivers[0]._id,
      rideId: rides[0]._id,
      amount: 120,
      currency: 'INR',
      method: PaymentMethod.UPI,
      status: PayStatus.COMPLETED,
      initiatedAt: new Date('2024-09-10T09:00:00Z'),
      processedAt: new Date('2024-09-10T09:01:00Z'),
      completedAt: new Date('2024-09-10T09:02:00Z'),
      description: 'Payment for ride R20240910001',
      gatewayTransactionId: 'TXN_1234567890',
      gatewayOrderId: 'ORDER_1234567890'
    },
    {
      paymentId: 'PAY20240910002',
      type: PaymentType.RIDE_PAYMENT,
      payerId: riders[1]._id,
      payeeId: drivers[1]._id,
      rideId: rides[1]._id,
      amount: 85,
      currency: 'INR',
      method: PaymentMethod.CARD,
      status: PayStatus.COMPLETED,
      initiatedAt: new Date('2024-09-10T14:30:00Z'),
      processedAt: new Date('2024-09-10T14:31:00Z'),
      completedAt: new Date('2024-09-10T14:32:00Z'),
      description: 'Payment for ride R20240910002',
      gatewayTransactionId: 'TXN_0987654321',
      gatewayOrderId: 'ORDER_0987654321'
    },
    // Driver payouts
    {
      paymentId: 'PAY20240910003',
      type: PaymentType.DRIVER_PAYOUT,
      payerId: new mongoose.Types.ObjectId(), // Platform ID
      payeeId: drivers[0]._id,
      amount: 102,
      currency: 'INR',
      method: PaymentMethod.UPI,
      status: PayStatus.COMPLETED,
      initiatedAt: new Date('2024-09-10T20:00:00Z'),
      processedAt: new Date('2024-09-10T20:05:00Z'),
      completedAt: new Date('2024-09-10T20:10:00Z'),
      description: 'Driver payout for ride R20240910001',
      metadata: {
        payoutType: 'weekly',
        ridesCount: 1,
        platformFee: 18
      }
    },
    {
      paymentId: 'PAY20240910004',
      type: PaymentType.DRIVER_PAYOUT,
      payerId: new mongoose.Types.ObjectId(), // Platform ID
      payeeId: drivers[1]._id,
      amount: 72.25,
      currency: 'INR',
      method: PaymentMethod.UPI,
      status: PayStatus.COMPLETED,
      initiatedAt: new Date('2024-09-10T20:00:00Z'),
      processedAt: new Date('2024-09-10T20:05:00Z'),
      completedAt: new Date('2024-09-10T20:10:00Z'),
      description: 'Driver payout for ride R20240910002',
      metadata: {
        payoutType: 'weekly',
        ridesCount: 1,
        platformFee: 12.75
      }
    },
    // Incentives
    {
      paymentId: 'PAY20240908001',
      type: PaymentType.INCENTIVE,
      payerId: new mongoose.Types.ObjectId(), // Platform ID
      payeeId: drivers[0]._id,
      amount: 50,
      currency: 'INR',
      method: PaymentMethod.UPI,
      status: PayStatus.COMPLETED,
      initiatedAt: new Date('2024-09-08T10:00:00Z'),
      processedAt: new Date('2024-09-08T10:05:00Z'),
      completedAt: new Date('2024-09-08T10:10:00Z'),
      description: 'Performance bonus for high ratings',
      metadata: {
        incentiveType: 'rating_bonus',
        period: 'weekly'
      }
    }
  ];

  const payments = [];
  for (const payment of paymentData) {
    const newPayment = new Payment(payment);
    await newPayment.save();
    payments.push(newPayment);
  }

  return payments;
};

// Create Admin Analytics
const createAdminAnalytics = async () => {
  const analyticsData = [];
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const analytics = new AdminAnalytics({
      period: AnalyticsPeriod.DAILY,
      date,
      metrics: {
        user_registrations: { value: Math.floor(Math.random() * 50) + 10 },
        driver_registrations: { value: Math.floor(Math.random() * 10) + 2 },
        ride_completions: { value: Math.floor(Math.random() * 200) + 50 },
        revenue: { value: Math.floor(Math.random() * 5000) + 1000 }
      },
      summary: {
        totalUsers: 1000 + (i * 5),
        activeUsers: 800 + (i * 3),
        totalDrivers: 200 + Math.floor(i * 0.5),
        activeDrivers: 150 + Math.floor(i * 0.3),
        totalRides: 5000 + (i * 20),
        completedRides: 4800 + (i * 18),
        totalRevenue: 150000 + (i * 1000),
        averageRating: 4.5 + (Math.random() * 0.5 - 0.25)
      },
      breakdowns: {
        ridesByStatus: {
          completed: 4800 + (i * 18),
          cancelled: 150 + (i * 2),
          active: 50 + Math.floor(i * 0.5)
        },
        usersByRole: {
          rider: 800 + (i * 4),
          driver: 200 + Math.floor(i * 0.5)
        },
        revenueByPaymentMethod: {
          upi: 75000 + (i * 500),
          card: 60000 + (i * 400),
          cash: 15000 + (i * 100)
        },
        ridesByHour: {},
        topLocations: [
          { location: 'Bangalore', rides: 1200 + (i * 5) },
          { location: 'Delhi', rides: 1000 + (i * 4) },
          { location: 'Mumbai', rides: 800 + (i * 3) },
          { location: 'Hyderabad', rides: 600 + (i * 2) },
          { location: 'Kolkata', rides: 400 + (i * 1) }
        ]
      }
    });

    await analytics.save();
    analyticsData.push(analytics);
  }

  return analyticsData;
};

// Create Admin Activities
const createAdminActivities = async (admins: any[]) => {
  const activitiesData = [
    {
      adminId: admins[0]._id,
      action: AdminAction.USER_UPDATE,
      resource: '/admin/users',
      method: 'PUT',
      severity: ActivitySeverity.LOW,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      details: {
        changes: ['status', 'verification']
      }
    },
    {
      adminId: admins[0]._id,
      action: AdminAction.RIDE_CANCEL,
      resource: '/admin/rides',
      method: 'PUT',
      severity: ActivitySeverity.MEDIUM,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      details: {
        rideId: 'R20240910001',
        reason: 'Driver request'
      }
    },
    {
      adminId: admins[1]._id,
      action: AdminAction.PAYMENT_REFUND,
      resource: '/admin/payments',
      method: 'PUT',
      severity: ActivitySeverity.HIGH,
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      details: {
        paymentId: 'PAY20240910001',
        amount: 120,
        reason: 'Customer complaint'
      }
    },
    {
      adminId: admins[0]._id,
      action: AdminAction.REPORT_GENERATE,
      resource: '/admin/dashboard',
      method: 'GET',
      severity: ActivitySeverity.LOW,
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      details: {
        reportType: 'revenue',
        period: 'monthly'
      }
    }
  ];

  const activities = [];
  for (const activity of activitiesData) {
    const adminActivity = new AdminActivity({
      ...activity,
      timestamp: new Date(),
      success: true
    });
    await adminActivity.save();
    activities.push(adminActivity);
  }

  return activities;
};

export default seedDatabase;

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import FoodPost from '../models/FoodPost.js';
import Request from '../models/Request.js';
import Review from '../models/Review.js';

// Load env vars
dotenv.config();

/**
 * Seed database with sample data
 */
const seedDatabase = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await FoodPost.deleteMany({});
    await Request.deleteMany({});
    await Review.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@sharespoon.com',
      password: 'admin123',
      role: 'admin',
      phone: '+919876543210',
      bio: 'System Administrator',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.6139] // Delhi coordinates
      },
      address: {
        street: '123 Admin St',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001'
      }
    });

    // Create sample users
    const users = await User.create([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        phone: '+919876543211',
        bio: 'Love sharing food and reducing waste!',
        location: {
          type: 'Point',
          coordinates: [77.3775, 28.5959] // Noida area
        },
        address: {
          street: '456 Food St',
          city: 'Noida',
          state: 'Uttar Pradesh',
          zipCode: '201301'
        },
        foodDonated: 5,
        rating: 4.5,
        totalReviews: 3
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password123',
        phone: '+919876543212',
        bio: 'Community food enthusiast',
        location: {
          type: 'Point',
          coordinates: [77.2167, 28.6358] // Connaught Place
        },
        address: {
          street: '789 Share Ave',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001'
        },
        foodReceived: 3,
        rating: 4.8,
        totalReviews: 5
      },
      {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: 'password123',
        phone: '+919876543213',
        bio: 'Fighting food waste one meal at a time',
        location: {
          type: 'Point',
          coordinates: [77.1025, 28.7041] // Rohini
        },
        address: {
          street: '321 Community Blvd',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110085'
        },
        foodDonated: 8,
        foodReceived: 2,
        rating: 4.9,
        totalReviews: 7
      }
    ]);

    console.log('👥 Created users');

    // Create sample food posts
    const posts = await FoodPost.create([
      {
        donor: users[0]._id,
        title: 'Fresh Homemade Pizza - 2 Large Pizzas',
        description: 'Made too much pizza for dinner! Two large pizzas with various toppings. Still hot and delicious. Perfect for a family dinner.',
        foodType: 'Cooked Meal',
        quantity: '2 large pizzas (serves 6-8)',
        expiryTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        pickupTimeStart: new Date(Date.now() + 1 * 60 * 60 * 1000),
        pickupTimeEnd: new Date(Date.now() + 5 * 60 * 60 * 1000),
        images: [{
          url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
          publicId: 'sample_pizza'
        }],
        pickupLocation: {
          type: 'Point',
          coordinates: [77.3775, 28.5959] // Noida
        },
        address: {
          street: '456 Food St',
          city: 'Noida',
          state: 'Uttar Pradesh',
          zipCode: '201301',
          fullAddress: '456 Food St, Noida, UP 201301'
        },
        hygieneChecklist: {
          freshFood: true,
          properStorage: true,
          allergenFree: false,
          noContamination: true
        },
        allergenInfo: 'Contains gluten, dairy. May contain nuts.',
        status: 'available'
      },
      {
        donor: users[1]._id,
        title: 'Organic Vegetables Bundle',
        description: 'Fresh organic vegetables from my garden. Includes tomatoes, cucumbers, peppers, and lettuce. All pesticide-free!',
        foodType: 'Raw Vegetables',
        quantity: '5 lbs mixed vegetables',
        expiryTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        pickupTimeStart: new Date(Date.now() + 2 * 60 * 60 * 1000),
        pickupTimeEnd: new Date(Date.now() + 8 * 60 * 60 * 1000),
        images: [{
          url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999',
          publicId: 'sample_vegetables'
        }],
        pickupLocation: {
          type: 'Point',
          coordinates: [77.2167, 28.6358] // Connaught Place
        },
        address: {
          street: '789 Share Ave',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110001',
          fullAddress: '789 Share Ave, New Delhi, Delhi 110001'
        },
        hygieneChecklist: {
          freshFood: true,
          properStorage: true,
          allergenFree: true,
          noContamination: true
        },
        status: 'available'
      },
      {
        donor: users[2]._id,
        title: 'Freshly Baked Bread - Sourdough',
        description: 'Just baked 3 loaves of sourdough bread. Have extras to share with the community!',
        foodType: 'Bakery',
        quantity: '3 loaves',
        expiryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        pickupTimeStart: new Date(Date.now() + 1 * 60 * 60 * 1000),
        pickupTimeEnd: new Date(Date.now() + 6 * 60 * 60 * 1000),
        images: [{
          url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
          publicId: 'sample_bread'
        }],
        pickupLocation: {
          type: 'Point',
          coordinates: [77.1025, 28.7041] // Rohini
        },
        address: {
          street: '321 Community Blvd',
          city: 'New Delhi',
          state: 'Delhi',
          zipCode: '110085',
          fullAddress: '321 Community Blvd, New Delhi, Delhi 110085'
        },
        hygieneChecklist: {
          freshFood: true,
          properStorage: true,
          allergenFree: false,
          noContamination: true
        },
        allergenInfo: 'Contains gluten',
        status: 'available'
      },
      {
        donor: users[0]._id,
        title: 'Fresh Fruits - Apples and Oranges',
        description: 'Have extra fruits from my weekly grocery shopping. All fresh and organic.',
        foodType: 'Fruits',
        quantity: '10 lbs mixed fruits',
        expiryTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        pickupTimeStart: new Date(Date.now() + 3 * 60 * 60 * 1000),
        pickupTimeEnd: new Date(Date.now() + 10 * 60 * 60 * 1000),
        images: [{
          url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b',
          publicId: 'sample_fruits'
        }],
        pickupLocation: {
          type: 'Point',
          coordinates: [77.3775, 28.5959] // Noida
        },
        address: {
          street: '456 Food St',
          city: 'Noida',
          state: 'Uttar Pradesh',
          zipCode: '201301',
          fullAddress: '456 Food St, Noida, UP 201301'
        },
        hygieneChecklist: {
          freshFood: true,
          properStorage: true,
          allergenFree: true,
          noContamination: true
        },
        status: 'available'
      }
    ]);

    console.log('🍕 Created food posts');

    console.log('\n✅ Database seeded successfully!\n');
    console.log('📧 Admin Credentials:');
    console.log('   Email: admin@sharespoon.com');
    console.log('   Password: admin123\n');
    console.log('📧 User Credentials:');
    console.log('   Email: john@example.com, jane@example.com, mike@example.com');
    console.log('   Password: password123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();

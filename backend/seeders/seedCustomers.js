require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const { USER_ROLES, CUSTOMER_GROUPS } = require('../config/constants');

const dummyCustomers = [
  {
    email: 'john.doe@example.com',
    password: 'Customer123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+27123456789',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main Street',
        city: 'Johannesburg',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '2000',
        phone: '+27123456789',
        isDefault: true
      },
      {
        type: 'shipping',
        firstName: 'John',
        lastName: 'Doe',
        street: '123 Main Street',
        city: 'Johannesburg',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '2000',
        phone: '+27123456789',
        isDefault: true
      }
    ],
    loyaltyPoints: 150,
    totalSpent: 45000,
    orderCount: 5,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'jane.smith@example.com',
    password: 'Customer123!',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+27987654321',
    customerGroup: CUSTOMER_GROUPS.VIP,
    addresses: [
      {
        type: 'billing',
        firstName: 'Jane',
        lastName: 'Smith',
        street: '456 Oak Avenue',
        city: 'Cape Town',
        state: 'Western Cape',
        country: 'South Africa',
        postalCode: '8001',
        phone: '+27987654321',
        isDefault: true
      }
    ],
    loyaltyPoints: 500,
    totalSpent: 125000,
    orderCount: 12,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'mike.johnson@example.com',
    password: 'Customer123!',
    firstName: 'Mike',
    lastName: 'Johnson',
    phone: '+27555123456',
    customerGroup: CUSTOMER_GROUPS.WHOLESALE,
    addresses: [
      {
        type: 'billing',
        firstName: 'Mike',
        lastName: 'Johnson',
        street: '789 Business Park',
        city: 'Durban',
        state: 'KwaZulu-Natal',
        country: 'South Africa',
        postalCode: '4001',
        phone: '+27555123456',
        isDefault: true
      }
    ],
    loyaltyPoints: 75,
    totalSpent: 25000,
    orderCount: 3,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'sarah.williams@example.com',
    password: 'Customer123!',
    firstName: 'Sarah',
    lastName: 'Williams',
    phone: '+27666123456',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'Sarah',
        lastName: 'Williams',
        street: '321 Elm Street',
        city: 'Pretoria',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '0001',
        phone: '+27666123456',
        isDefault: true
      }
    ],
    loyaltyPoints: 200,
    totalSpent: 60000,
    orderCount: 8,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'david.brown@example.com',
    password: 'Customer123!',
    firstName: 'David',
    lastName: 'Brown',
    phone: '+27777123456',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'David',
        lastName: 'Brown',
        street: '654 Pine Road',
        city: 'Port Elizabeth',
        state: 'Eastern Cape',
        country: 'South Africa',
        postalCode: '6001',
        phone: '+27777123456',
        isDefault: true
      }
    ],
    loyaltyPoints: 50,
    totalSpent: 15000,
    orderCount: 2,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'emily.davis@example.com',
    password: 'Customer123!',
    firstName: 'Emily',
    lastName: 'Davis',
    phone: '+27888123456',
    customerGroup: CUSTOMER_GROUPS.VIP,
    addresses: [
      {
        type: 'billing',
        firstName: 'Emily',
        lastName: 'Davis',
        street: '987 Maple Drive',
        city: 'Bloemfontein',
        state: 'Free State',
        country: 'South Africa',
        postalCode: '9301',
        phone: '+27888123456',
        isDefault: true
      }
    ],
    loyaltyPoints: 300,
    totalSpent: 90000,
    orderCount: 10,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'robert.miller@example.com',
    password: 'Customer123!',
    firstName: 'Robert',
    lastName: 'Miller',
    phone: '+27999123456',
    customerGroup: CUSTOMER_GROUPS.WHOLESALE,
    addresses: [
      {
        type: 'billing',
        firstName: 'Robert',
        lastName: 'Miller',
        street: '147 Cedar Lane',
        city: 'Nelspruit',
        state: 'Mpumalanga',
        country: 'South Africa',
        postalCode: '1200',
        phone: '+27999123456',
        isDefault: true
      }
    ],
    loyaltyPoints: 100,
    totalSpent: 35000,
    orderCount: 4,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'lisa.wilson@example.com',
    password: 'Customer123!',
    firstName: 'Lisa',
    lastName: 'Wilson',
    phone: '+27111234567',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'Lisa',
        lastName: 'Wilson',
        street: '258 Birch Street',
        city: 'Polokwane',
        state: 'Limpopo',
        country: 'South Africa',
        postalCode: '0700',
        phone: '+27111234567',
        isDefault: true
      }
    ],
    loyaltyPoints: 25,
    totalSpent: 8000,
    orderCount: 1,
    isActive: true,
    isEmailVerified: false
  },
  {
    email: 'james.moore@example.com',
    password: 'Customer123!',
    firstName: 'James',
    lastName: 'Moore',
    phone: '+27222345678',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'James',
        lastName: 'Moore',
        street: '369 Willow Way',
        city: 'Kimberley',
        state: 'Northern Cape',
        country: 'South Africa',
        postalCode: '8301',
        phone: '+27222345678',
        isDefault: true
      }
    ],
    loyaltyPoints: 0,
    totalSpent: 0,
    orderCount: 0,
    isActive: true,
    isEmailVerified: false
  },
  {
    email: 'amanda.taylor@example.com',
    password: 'Customer123!',
    firstName: 'Amanda',
    lastName: 'Taylor',
    phone: '+27333456789',
    customerGroup: CUSTOMER_GROUPS.VIP,
    addresses: [
      {
        type: 'billing',
        firstName: 'Amanda',
        lastName: 'Taylor',
        street: '741 Spruce Avenue',
        city: 'East London',
        state: 'Eastern Cape',
        country: 'South Africa',
        postalCode: '5201',
        phone: '+27333456789',
        isDefault: true
      }
    ],
    loyaltyPoints: 400,
    totalSpent: 150000,
    orderCount: 15,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'chris.anderson@example.com',
    password: 'Customer123!',
    firstName: 'Chris',
    lastName: 'Anderson',
    phone: '+27444567890',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'Chris',
        lastName: 'Anderson',
        street: '852 Ash Boulevard',
        city: 'Rustenburg',
        state: 'North West',
        country: 'South Africa',
        postalCode: '0300',
        phone: '+27444567890',
        isDefault: true
      }
    ],
    loyaltyPoints: 80,
    totalSpent: 22000,
    orderCount: 3,
    isActive: false,
    isEmailVerified: true
  },
  {
    email: 'jennifer.thomas@example.com',
    password: 'Customer123!',
    firstName: 'Jennifer',
    lastName: 'Thomas',
    phone: '+27555678901',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'Jennifer',
        lastName: 'Thomas',
        street: '963 Poplar Street',
        city: 'Welkom',
        state: 'Free State',
        country: 'South Africa',
        postalCode: '9460',
        phone: '+27555678901',
        isDefault: true
      }
    ],
    loyaltyPoints: 120,
    totalSpent: 38000,
    orderCount: 6,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'daniel.jackson@example.com',
    password: 'Customer123!',
    firstName: 'Daniel',
    lastName: 'Jackson',
    phone: '+27666789012',
    customerGroup: CUSTOMER_GROUPS.WHOLESALE,
    addresses: [
      {
        type: 'billing',
        firstName: 'Daniel',
        lastName: 'Jackson',
        street: '159 Fir Road',
        city: 'Vereeniging',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '1930',
        phone: '+27666789012',
        isDefault: true
      }
    ],
    loyaltyPoints: 250,
    totalSpent: 75000,
    orderCount: 7,
    isActive: true,
    isEmailVerified: true
  },
  {
    email: 'michelle.white@example.com',
    password: 'Customer123!',
    firstName: 'Michelle',
    lastName: 'White',
    phone: '+27777890123',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'Michelle',
        lastName: 'White',
        street: '357 Chestnut Drive',
        city: 'Soweto',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '1800',
        phone: '+27777890123',
        isDefault: true
      }
    ],
    loyaltyPoints: 60,
    totalSpent: 18000,
    orderCount: 2,
    isActive: true,
    isEmailVerified: false
  },
  {
    email: 'ryan.harris@example.com',
    password: 'Customer123!',
    firstName: 'Ryan',
    lastName: 'Harris',
    phone: '+27888901234',
    customerGroup: CUSTOMER_GROUPS.RETAIL,
    addresses: [
      {
        type: 'billing',
        firstName: 'Ryan',
        lastName: 'Harris',
        street: '468 Hickory Lane',
        city: 'Boksburg',
        state: 'Gauteng',
        country: 'South Africa',
        postalCode: '1460',
        phone: '+27888901234',
        isDefault: true
      }
    ],
    loyaltyPoints: 30,
    totalSpent: 10000,
    orderCount: 1,
    isActive: true,
    isEmailVerified: true
  }
];

const seedCustomers = async () => {
  try {
    await connectDB();
    
    console.log('🗑️  Clearing existing customers (role: customer)...');
    await User.deleteMany({ role: USER_ROLES.CUSTOMER });
    
    console.log('👥 Creating dummy customers...');
    const createdCustomers = [];
    
    for (const customerData of dummyCustomers) {
      try {
        const customer = await User.create({
          ...customerData,
          role: USER_ROLES.CUSTOMER
        });
        createdCustomers.push(customer);
        console.log(`✅ Created customer: ${customer.firstName} ${customer.lastName} (${customer.email})`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  Customer ${customerData.email} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating customer ${customerData.email}:`, error.message);
        }
      }
    }
    
    console.log(`\n✅ Successfully created ${createdCustomers.length} customers!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Total customers: ${createdCustomers.length}`);
    console.log(`   - VIP customers: ${createdCustomers.filter(c => c.customerGroup === CUSTOMER_GROUPS.VIP).length}`);
    console.log(`   - Wholesale customers: ${createdCustomers.filter(c => c.customerGroup === CUSTOMER_GROUPS.WHOLESALE).length}`);
    console.log(`   - Retail customers: ${createdCustomers.filter(c => c.customerGroup === CUSTOMER_GROUPS.RETAIL).length}`);
    console.log(`   - Active customers: ${createdCustomers.filter(c => c.isActive).length}`);
    console.log(`   - Verified customers: ${createdCustomers.filter(c => c.isEmailVerified).length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding customers:', error);
    process.exit(1);
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedCustomers();
}

module.exports = seedCustomers;

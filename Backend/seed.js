const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/marketplace";

const seedProducts = [
    {
        name: "Wireless Headphones",
        description: "High quality noise-canceling wireless headphones.",
        price: 99.99,
        category: "Electronics",
        brand: "SoundWave",
        countInStock: 50,
        sellerID: new mongoose.Types.ObjectId()
    },
    {
        name: "Gaming Mouse",
        description: "Ergonomic gaming mouse with customizable RGB lighting.",
        price: 49.99,
        category: "Electronics",
        brand: "ClickPro",
        countInStock: 120,
        sellerID: new mongoose.Types.ObjectId()
    },
    {
        name: "Running Shoes",
        description: "Comfortable and lightweight running shoes.",
        price: 79.99,
        category: "Fashion",
        brand: "Stride",
        countInStock: 80,
        sellerID: new mongoose.Types.ObjectId()
    }
];

const seedDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected for seeding...');

        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.log('No products found. Seeding initial products...');
            await Product.insertMany(seedProducts);
            console.log('Database seeded successfully with initial products!');
        } else {
            console.log('Database already contains products. Skipping seeding.');
        }

        mongoose.connection.close();
    } catch (err) {
        console.error('Error seeding database:', err);
        mongoose.connection.close();
        process.exit(1);
    }
};

seedDB();

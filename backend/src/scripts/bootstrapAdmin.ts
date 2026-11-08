import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import { User } from "../models/User.js";

const requiredVariables = [
  "ADMIN_NAME",
  "ADMIN_EMAIL",
  "ADMIN_PHONE",
  "ADMIN_PASSWORD",
] as const;

const bootstrapAdmin = async (): Promise<void> => {
  for (const variable of requiredVariables) {
    if (!process.env[variable]) {
      throw new Error(`${variable} must be configured in backend/.env`);
    }
  }

  const name = process.env.ADMIN_NAME!.trim();
  const email = process.env.ADMIN_EMAIL!.trim().toLowerCase();
  const phone = process.env.ADMIN_PHONE!.trim();
  const password = process.env.ADMIN_PASSWORD!;

  if (name.length < 2 || !email.includes("@") || phone.length < 10) {
    throw new Error("Admin name, email, or phone is invalid");
  }

  if (password.length < 12 || password.length > 72) {
    throw new Error("ADMIN_PASSWORD must contain 12 to 72 characters");
  }

  await connectDatabase();

  try {
    const existingAdmin = await User.exists({ role: "ADMIN" });

    if (existingAdmin) {
      throw new Error(
        "An admin account already exists. Bootstrap has been refused."
      );
    }

    const existingUser = await User.exists({ email });

    if (existingUser) {
      throw new Error(
        "This email already belongs to an account. Use a different admin email."
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    });

    console.log("Initial admin account created successfully.");
    console.log(`Admin email: ${admin.email}`);
    console.log("Keep the admin credentials private.");
  } finally {
    await mongoose.disconnect();
  }
};

bootstrapAdmin().catch((error: unknown) => {
  console.error(
    "Admin bootstrap failed:",
    error instanceof Error ? error.message : error
  );
  process.exitCode = 1;
});

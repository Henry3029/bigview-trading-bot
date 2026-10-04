import { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
  {
    // Web3 / Wallet Auth Fields
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    nonce: {
      type: String,
      required: true,
      default: () => Math.floor(Math.random() * 1000000).toString(),
    },

    // Standard Web2 Auth Fields
    email: {
      type: String,
      unique: true,
      sparse: true, 
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: false, 
    },

    // Application Balances
    freeUsdtBalance: {
      type: Number,
      default: 1000.0,
      min: 0,
    },

    // -------------------------------------------------------------
    // NEW FIELDS: Alexa & WEEX Exchange Integration
    // -------------------------------------------------------------
    alexaUserId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    weexApiKey: {
      type: String,
      default: null,
    },
    weexSecretKey: {
      type: String,
      default: null, // Stores the encrypted secret key
    },
    weexPassphrase: {
      type: String,
      default: null, // Stores the encrypted passphrase
    },
  },
  {
    timestamps: true,
  }
);

const User = models.User || model('User', UserSchema);

export default User;

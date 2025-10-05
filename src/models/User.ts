import mongoose, { Document, Schema, Model } from "mongoose";


interface RefreshToken {
  token: string;
  issuedAt: Date;
  
}

export interface IUser extends Document {
  phone: string;
  name?: string;
  refreshTokens: RefreshToken[];
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}


const RefreshSchema = new Schema<RefreshToken>({
  token: { type: String, required: true },
  issuedAt: { type: Date, required: true },
  
});

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, required: true, unique: true },
    name: { type: String },
    refreshTokens: { type: [RefreshSchema], default: [] },
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);


const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;

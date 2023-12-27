import { Document, Schema, model } from 'mongoose';

export interface User extends Document {
  nombre: string;
  apiKey: string;
  vencimiento: Date;
  registrosProcesados: number;
}

export const UserSchema = new Schema<User>(
  {
    nombre: { type: String, required: true },
    apiKey: { type: String, required: true, unique: true },
    vencimiento: { type: Date, required: true },
    registrosProcesados: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ apiKey: 1 });

export const UserModel = model<User>('User', UserSchema);

import Twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

const client = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
export async function sendSms(phone: string, body: string) {
  return client.messages.create({ to: phone, from: process.env.TWILIO_FROM!, body });
}

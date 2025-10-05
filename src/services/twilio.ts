import dotenv from "dotenv";
dotenv.config();
import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER!;
const toNumber = process.env.MY_WHATSAPP_NUMBER!;



const client = twilio(accountSid, authToken);

export async function sendSms(to: string, body: string) {
  return client.messages.create({
    body,
    from: fromNumber,
    to: toNumber,       
  });
}

   

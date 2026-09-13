import dotenv from 'dotenv';
import { Zindua } from "@zindua/sdk";
dotenv.config()

console.log("NODE_ENV:", process.env.NODE_ENV);

const zindua = new Zindua({
  apiKey: process.env.ZINDUA_API_KEY!,
});

// Send OTP
export const sendOTPEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return;
  }

  await zindua.send({
    to: email,
    template: "verify-otp",
    variables: {
      otp,
    },
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  passwordResetOTP: string
): Promise<void> => {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return;
  }

  await zindua.send({
    to: email,
    template: "password-reset",
    variables: {
      passwordResetOTP,
    },
  });
};

export const sendSpecialRequestEmail = async (
  email: string,
  requesterName: string,
  wantToGift: string,
  reason: string,
  phone: string,
  emailAdd: string
): Promise<void> => {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return;
  }

  await zindua.send({
    to: email,
    template: "special-request",
    variables: {
      requesterName,
      wantToGift,
      reason,
      phone,
      emailAdd,
    },
  });
};

export const sendEventCompletionEmail = async (
  email: string,
  eventName: string
): Promise<void> => {
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    return;
  }

  await zindua.send({
    to: email,
    template: "event-completed",
    variables: {
      eventName,
    },
  });
};

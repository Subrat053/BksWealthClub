import { User } from "../modules/user/user.model.js";

export const generateReferralCode = async (fullName = "BWC") => {
  let referralCode = "";
  let exists = true;

  const cleanPrefix =
    fullName
      ?.replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 4) || "BWC";

  while (exists) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    referralCode = `${cleanPrefix}${randomNumber}`;
    exists = await User.exists({ referralCode });
  }

  return referralCode;
};

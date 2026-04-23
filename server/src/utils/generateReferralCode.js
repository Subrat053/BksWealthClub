import { User } from "../modules/user/user.model.js";

export const generateReferralCode = async (fullName = "BWC") => {
	const seed = String(fullName).replace(/[^a-zA-Z]/g, "").toUpperCase();
	const prefix = (seed.slice(0, 3) || "BWC").padEnd(3, "X");

	let referralCode;
	let exists = true;

	while (exists) {
		const randomNumber = Math.floor(100000 + Math.random() * 900000);
		referralCode = `${prefix}${randomNumber}`;
		exists = await User.exists({ referralCode });
	}

	return referralCode;
};

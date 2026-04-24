import { User } from "../modules/user/user.model.js";

export const generateMemberId = async () => {
  let memberId;
  let exists = true;

  while (exists) {
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    memberId = `BKS${randomNumber}`;
    exists = await User.exists({ memberId });
  }

  return memberId;
};

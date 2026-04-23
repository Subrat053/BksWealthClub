import { User } from "../user/user.model.js";

// 👉 Get All Users
export const getAllUsers = async () => {
    const users = await User.find();
    return users;
};


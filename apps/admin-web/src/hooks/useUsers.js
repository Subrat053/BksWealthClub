import { useEffect, useState } from "react";
import { fetchUsers } from "../api/user.api";

export const useUsers = (filters) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const getUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchUsers(filters);
      setUsers(
        res.data.users.map((u) => ({
          _id: u._id,
          id: u.memberId,
          name: u.fullName,
          email: u.email,
          phone: u.phone,
          role: u.role || "user",
          status: u.status,
          joinedAt: new Date(u.createdAt).toLocaleDateString(),
        })),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, [JSON.stringify(filters)]);

  return { users, loading, refetch: getUsers };
};

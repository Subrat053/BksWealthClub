import { useEffect, useState } from "react";
import { fetchUsers } from "../api/user.api";

const formatExactTimestamp = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const pad = (n, size = 2) => String(n).padStart(size, "0");

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad(date.getMilliseconds(), 3);

  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export const useUsers = (filters) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const getUsers = async () => {
    try {
      setLoading(true);
      const res = await fetchUsers(filters);
      const payload = res?.data;
      const usersList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.users)
          ? payload.users
          : [];

      setUsers(
        usersList.map((u) => ({
          _id: u._id,
          id: u.memberId,
          name: u.fullName,
          email: u.email,
          phone: u.phone,
          role: u.role || "user",
          status: u.status,
          createdAtMs: u.createdAt ? new Date(u.createdAt).getTime() : null,
          joinedAt: u.createdAt || null,
          joinedAtExact: formatExactTimestamp(u.createdAt || u.registeredAt),
        })),
      );
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUsers();
  }, [JSON.stringify(filters)]);

  return { users, loading, refetch: getUsers };
};

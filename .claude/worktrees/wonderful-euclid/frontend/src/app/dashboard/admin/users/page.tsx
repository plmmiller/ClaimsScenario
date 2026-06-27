"use client";

import { useEffect, useState } from "react";
import { getUsers } from "@/lib/api";
import { User } from "@/types";

interface UserWithSessions extends User {
  session_count: number;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithSessions[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Users</h1>
      <p className="text-gray-500 mb-8">Manage platform users</p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Name
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Email
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Role
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Sessions
              </th>
              <th className="text-left px-6 py-3 font-medium text-gray-500">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-6 py-4 font-medium">{user.full_name}</td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-700"
                        : user.role === "instructor"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">{user.session_count}</td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(user.created_at as unknown as string).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

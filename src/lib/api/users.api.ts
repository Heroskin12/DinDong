import { useAxios } from "../context/axios/AxiosContext";
import type { User } from "../types/User";

export function useUsersApi() {
  const client = useAxios();

  async function getUsers(signal?: AbortSignal): Promise<User[]> {
    const response = await client.get<User[]>("/users", { signal });
    return response.data;
  }

  async function getUserById(id: number, signal?: AbortSignal): Promise<User> {
    const response = await client.get<User>(`/users/${id}`, {
      signal,
    });
    return response.data;
  }

  async function addUser(
    user: Omit<User, "id">,
    signal?: AbortSignal,
  ): Promise<User> {
    const response = await client.post<User>("/users", user, {
      signal,
    });
    return response.data;
  }

  async function deleteUserById(
    id: number,
    signal?: AbortSignal,
  ): Promise<void> {
    await client.delete(`/users/${id}`, {
      signal,
    });
  }

  async function updateUserById(
    id: number,
    updates: Partial<Omit<User, "id">>,
    signal?: AbortSignal,
  ): Promise<User> {
    const response = await client.patch<User>(`/users/${id}`, updates, {
      signal,
    });
    return response.data;
  }

  return { getUsers, getUserById, addUser, deleteUserById, updateUserById };
}

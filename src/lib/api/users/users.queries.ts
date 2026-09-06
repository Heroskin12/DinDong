import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUsersApi } from "./users.api";
import type { User } from "../../types/User";
import { usersKeys } from "./users.keys";

export function useUsers() {
  const { getUsers } = useUsersApi();

  return useQuery({
    queryKey: usersKeys.lists(),
    queryFn: ({ signal }) => getUsers(signal),
  });
}

export function useUser(id: number | undefined) {
  const { getUserById } = useUsersApi();

  return useQuery({
    queryKey: usersKeys.detail(id!),
    queryFn: ({ signal }) => getUserById(id!, signal),
    enabled: id !== undefined,
  });
}

export function useAddUser() {
  const queryClient = useQueryClient();
  const { addUser } = useUsersApi();

  return useMutation({
    mutationFn: (user: Omit<User, "id">) => addUser(user),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { updateUserById } = useUsersApi();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<Omit<User, "id">>;
    }) => updateUserById(id, updates),
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(usersKeys.detail(updatedUser.id), updatedUser);
      queryClient.setQueryData(usersKeys.lists(), (old: User[] | undefined) =>
        old?.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      );
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  const { deleteUserById } = useUsersApi();

  return useMutation({
    mutationFn: (id: number) => deleteUserById(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.all }),
  });
}

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
    refetchOnWindowFocus: false,
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

      onMutate: async ({ id, updates }) => {
        await queryClient.cancelQueries({ queryKey: usersKeys.detail(id) });
        await queryClient.cancelQueries({ queryKey: usersKeys.lists() });

        const previousDetail = queryClient.getQueryData<User>(
          usersKeys.detail(id),
        );
        const previousList = queryClient.getQueryData<User[]>(
          usersKeys.lists(),
        );

        queryClient.setQueryData<User>(usersKeys.detail(id), (old) =>
          old ? { ...old, ...updates } : old,
        );
        queryClient.setQueryData<User[]>(usersKeys.lists(), (old) =>
          old?.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        );

        return { previousDetail, previousList };
      },

      onError: (_err, { id }, context) => {
        if (context?.previousDetail) {
          queryClient.setQueryData(
            usersKeys.detail(id),
            context.previousDetail,
          );
        }
        if (context?.previousList) {
          queryClient.setQueryData(usersKeys.lists(), context.previousList);
        }
      },

      onSettled: (_data, _err, { id }) => {
        queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
        queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
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

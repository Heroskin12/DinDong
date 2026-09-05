export const usersKeys = {
  all: ["users"] as const, // Root - Invalidates every key in this factory.
  lists: () => [...usersKeys.all, "list"] as const, // No list variants yet. Will need when adding filters for example.
  details: () => [...usersKeys.all, "detail"] as const, // When something changes which affects every user's detail view.
  detail: (id: number) => [...usersKeys.details(), id] as const, // Invalidates details of one specific user.
};

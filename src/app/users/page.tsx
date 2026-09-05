import type { Metadata } from "next";
import UsersExplorer from "site/components/users/UsersExplorer";

export const metadata: Metadata = {
  title: "Users",
};

export default function UsersPage() {
  return <UsersExplorer />;
}

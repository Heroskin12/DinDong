"use client";
import { useState } from "react";
import {
  useUsers,
  useUser,
  useAddUser,
  useUpdateUser,
  useDeleteUser,
} from "site/lib/api/users/users.queries";
import type { User } from "site/lib/types/User";
import styles from "./UsersExplorer.module.css";

const emptyUser: Omit<User, "id"> = {
  name: "",
  username: "",
  email: "",
  phone: "",
  website: "",
  address: {
    street: "",
    suite: "",
    city: "",
    zipcode: "",
    geo: { lat: "", lng: "" },
  },
  company: {
    name: "",
    catchPhrase: "",
    bs: "",
  },
};

export default function UsersExplorer() {
  const [selectedId, setSelectedId] = useState<number | undefined>();
  const [newUser, setNewUser] = useState<Omit<User, "id">>(emptyUser);

  function updateField(
    field: "name" | "username" | "email" | "phone" | "website",
    value: string,
  ) {
    setNewUser((prev) => ({ ...prev, [field]: value }));
  }

  function updateAddressField(
    field: "street" | "suite" | "city" | "zipcode",
    value: string,
  ) {
    setNewUser((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  }

  function updateGeoField(field: "lat" | "lng", value: string) {
    setNewUser((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        geo: { ...prev.address.geo, [field]: value },
      },
    }));
  }

  function updateCompanyField(
    field: "name" | "catchPhrase" | "bs",
    value: string,
  ) {
    setNewUser((prev) => ({
      ...prev,
      company: { ...prev.company, [field]: value },
    }));
  }

  const {
    data: users,
    isLoading,
    isError,
    isRefetching: isUserListRefetching,
  } = useUsers();
  const {
    data: selectedUser,
    isLoading: isDetailLoading,
    isRefetching: isDetailRefetching,
  } = useUser(selectedId);
  const { mutate: addUser, isPending: isAdding } = useAddUser();
  const { mutate: updateUser, isError: isUpdateError } = useUpdateUser();
  const { mutate: deleteUser } = useDeleteUser();

  function handleAddUser(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    addUser(newUser, { onSuccess: () => setNewUser(emptyUser) });
  }

  function handleRename(user: User, nextName: string) {
    updateUser({ id: user.id, updates: { name: nextName } });
  }

  function handleDelete(id: number) {
    deleteUser(id, {
      onSuccess: () => {
        if (id === selectedId) setSelectedId(undefined);
      },
    });
  }

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Something went wrong.</p>;

  const userList = users ?? [];

  return (
    <div className={styles.container}>
      <section className={styles.list}>
        <h2>Users</h2>
        {isUserListRefetching && <p>Refreshing...</p>}
        <ul>
          {userList.map((user) => (
            <li
              key={user.id}
              className={[
                styles.row,
                user.id === selectedId && styles.rowSelected,
              ]
                .filter(Boolean)
                .join(" ")}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedId(user.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedId(user.id);
                }
              }}
            >
              <span>
                {user.name} ({user.email})
              </span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleDelete(user.id);
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddUser} className={styles.form}>
          <h3>Add user</h3>
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
          <input
            placeholder="Username"
            value={newUser.username}
            onChange={(event) => updateField("username", event.target.value)}
          />
          <input
            placeholder="Email"
            value={newUser.email}
            onChange={(event) => updateField("email", event.target.value)}
          />
          <input
            placeholder="Phone"
            value={newUser.phone}
            onChange={(event) => updateField("phone", event.target.value)}
          />
          <input
            placeholder="Website"
            value={newUser.website}
            onChange={(event) => updateField("website", event.target.value)}
          />

          <h4>Address</h4>
          <input
            placeholder="Street"
            value={newUser.address.street}
            onChange={(event) =>
              updateAddressField("street", event.target.value)
            }
          />
          <input
            placeholder="Suite"
            value={newUser.address.suite}
            onChange={(event) =>
              updateAddressField("suite", event.target.value)
            }
          />
          <input
            placeholder="City"
            value={newUser.address.city}
            onChange={(event) => updateAddressField("city", event.target.value)}
          />
          <input
            placeholder="Zipcode"
            value={newUser.address.zipcode}
            onChange={(event) =>
              updateAddressField("zipcode", event.target.value)
            }
          />
          <input
            placeholder="Latitude"
            value={newUser.address.geo.lat}
            onChange={(event) => updateGeoField("lat", event.target.value)}
          />
          <input
            placeholder="Longitude"
            value={newUser.address.geo.lng}
            onChange={(event) => updateGeoField("lng", event.target.value)}
          />

          <h4>Company</h4>
          <input
            placeholder="Company name"
            value={newUser.company.name}
            onChange={(event) => updateCompanyField("name", event.target.value)}
          />
          <input
            placeholder="Catchphrase"
            value={newUser.company.catchPhrase}
            onChange={(event) =>
              updateCompanyField("catchPhrase", event.target.value)
            }
          />
          <input
            placeholder="BS"
            value={newUser.company.bs}
            onChange={(event) => updateCompanyField("bs", event.target.value)}
          />

          <button type="submit" disabled={isAdding}>
            {isAdding ? "Adding..." : "Add"}
          </button>
        </form>
      </section>

      <section className={styles.detail}>
        <h2>Detail</h2>

        {selectedId === undefined && <p>Pick a user from the list.</p>}
        {selectedId !== undefined && isDetailLoading && <p>Loading...</p>}
        {selectedId !== undefined && isDetailRefetching && <p>Refreshing...</p>}
        {selectedId !== undefined && !isDetailLoading && selectedUser && (
          <div>
            <p>Name: {selectedUser.name}</p>
            <p>Username: {selectedUser.username}</p>
            <p>Email: {selectedUser.email}</p>

            <form
              key={selectedUser.id}
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                const nextName = formData.get("name") as string;
                handleRename(selectedUser, nextName);
              }}
            >
              <input name="name" defaultValue={selectedUser.name} />
              <button type="submit">Rename</button>
            </form>
            {isUpdateError && (
              <p role="alert">Couldn&apos;t save the rename. Reverted to the previous name.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

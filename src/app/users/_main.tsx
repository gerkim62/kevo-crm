"use client";

import React, { JSX, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Plus, Edit2, Trash2, Users, Mail, Loader2, KeyRound } from "lucide-react";
import { authClient } from "@/lib/auth";
import { deleteUser, updateUser } from "./_actions";
import { useRouter } from "nextjs-toploader/app";
import { toast } from "sonner";
import ChangePasswordModal from "./_update-password-modal";

interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

// Zod schemas
const addUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["user", "admin"], { message: "Please select a role" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character",
    }),
});

const editUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  role: z.enum(["user", "admin"], { message: "Please select a role" }),
});

type AddUserFormData = z.infer<typeof addUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

interface UserFormProps {
  isEdit?: boolean;
  form: any;
  onSubmit: (data: AddUserFormData | EditUserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({
  isEdit = false,
  form,
  onSubmit,
  onCancel,
  isLoading = false,
}) => (
  <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input
                placeholder="Enter user name"
                disabled={isLoading}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input
                type="email"
                placeholder="Enter email address"
                disabled={isLoading || isEdit}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="role"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Select
              onValueChange={field.onChange}
              defaultValue={field.value}
              disabled={isLoading}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Only show password field when adding a new user */}
      {!isEdit && (
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter password"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEdit ? "Updating..." : "Adding..."}
            </>
          ) : isEdit ? (
            "Update User"
          ) : (
            "Add User"
          )}
        </Button>
      </div>
    </form>
  </Form>
);

export default function UserManagementDashboard({
  users,
}: {
  users: Omit<User, "password">[];
}): JSX.Element {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddLoading, setIsAddLoading] = useState<boolean>(false);
  const [isEditLoading, setIsEditLoading] = useState<boolean>(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const router = useRouter();

  // Form for adding users
  const addForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      password: "",
    },
  });

  // Form for editing users
  const editForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
    },
  });

  const handleAddUser = async (data: AddUserFormData): Promise<void> => {
    setIsAddLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      console.log("Add user response:", result);

      toast.info(
        result.data
          ? "User added successfully!"
          : result.error
          ? result.error.message
          : "Something went wrong"
      );

      router.refresh(); // Refresh the page to show new user

      addForm.reset();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding user:", error);
      toast.error("Failed to add user");
    } finally {
      setIsAddLoading(false);
    }
  };

  const handleEditUser = async (user: User): Promise<void> => {
    setEditingUser(user);
    editForm.reset({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (data: EditUserFormData): Promise<void> => {
    if (!editingUser) return;

    setIsEditLoading(true);
    try {
      const user = await updateUser({
        id: editingUser.id,
        name: data.name,
        role: data.role,
      });

      console.log("Update user response:", user);

      toast.success("User updated successfully!");

      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingUser(null);
      router.refresh();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string): Promise<void> => {
    setDeletingUserId(userId);
    try {
      const res = await deleteUser(userId);
      toast.success("User deleted successfully!");
      router.refresh();
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCancel = (isEdit: boolean) => {
    // Prevent closing if loading
    if (isEdit && isEditLoading) return;
    if (!isEdit && isAddLoading) return;

    if (isEdit) {
      editForm.reset();
      setIsEditDialogOpen(false);
      setEditingUser(null);
    } else {
      addForm.reset();
      setIsAddDialogOpen(false);
    }
  };

  const handleAddDialogOpenChange = (open: boolean) => {
    // Prevent closing if loading
    if (isAddLoading) return;
    if (!open) {
      addForm.reset();
    }
    setIsAddDialogOpen(open);
  };

  const handleEditDialogOpenChange = (open: boolean) => {
    // Prevent closing if loading
    if (isEditLoading) return;
    if (!open) {
      editForm.reset();
      setEditingUser(null);
    }
    setIsEditDialogOpen(open);
  };

  return (
    <div className="container py-6 mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <div>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage system users and their roles
                </CardDescription>
              </div>
            </div>

            <Dialog
              open={isAddDialogOpen}
              onOpenChange={handleAddDialogOpenChange}
            >
              <DialogTrigger asChild>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <UserForm
                  form={addForm}
                  onSubmit={handleAddUser as UserFormProps["onSubmit"]}
                  onCancel={() => handleCancel(false)}
                  isLoading={isAddLoading}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 rounded-full p-2">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-lg">{user.name}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={user.role === "admin" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                    <ChangePasswordModal userId={user.id} userData={user}>
                      <Button variant="ghost">
                        {" "}
                        <KeyRound className="h-4 w-4" />
                      </Button>
                    </ChangePasswordModal>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      disabled={isEditLoading || deletingUserId === user.id}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isEditLoading || deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="h-4 w-4 text-red-500 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-500" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the user "{user.name}".
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            disabled={deletingUserId === user.id}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found. Click "Add User" to create your first user.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserForm
            isEdit={true}
            form={editForm}
            onSubmit={handleUpdateUser}
            onCancel={() => handleCancel(true)}
            isLoading={isEditLoading}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState } from "react";
import { deleteUser, getUserDeleteEligibility } from "@/api/usersApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit2, UserMinus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { hasPermission, PERMISSIONS } from "@/components/shared/rbac";
import UserEditDialog from "./UserEditDialog";

function statusBadgeVariant(status) {
  if (status === "active") return "default";
  if (status === "pending") return "secondary";
  return "outline";
}

export default function UserManagementTable({
  users = [],
  departments = [],
  currentUser,
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const isAdmin = hasPermission(currentUser?.role, PERMISSIONS.USERS_DELETE);

  const deleteMutation = useMutation({
    mutationFn: ({ userId, mode }) => deleteUser(userId, mode),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: variables.mode === "hard" ? "User deleted" : "User deactivated",
        description:
          variables.mode === "hard"
            ? "The user was permanently removed."
            : "The user was set to inactive.",
      });
      setConfirmAction(null);
    },
    onError: (error) => {
      toast({
        title: "Action failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeactivate = (user) => {
    setConfirmAction({ type: "soft", user });
  };

  const handleDelete = async (user) => {
    try {
      const eligibility = await getUserDeleteEligibility(user.id);
      if (!eligibility.canHardDelete) {
        toast({
          title: "Cannot permanently delete",
          description:
            "This user has linked tasks, assigned emails, or pending approvals. Deactivate instead.",
          variant: "destructive",
        });
        return;
      }
      setConfirmAction({ type: "hard", user });
    } catch (error) {
      toast({
        title: "Could not check eligibility",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No team members found.</p>
      </div>
    );
  }

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.full_name || user.name || user.email}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.role || "user"}</Badge>
                  </TableCell>
                  <TableCell>{user.department || user.department_name || "Unassigned"}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(user.status)}>
                      {user.status || "active"}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingUser(user)}
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {user.id !== currentUser?.id && user.status !== "inactive" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeactivate(user)}
                            title="Deactivate user"
                          >
                            <UserMinus className="w-4 h-4" />
                          </Button>
                        )}
                        {user.id !== currentUser?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(user)}
                            title="Delete user permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <UserEditDialog
        user={editingUser}
        departments={departments}
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />

      <AlertDialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "hard" ? "Permanently delete user?" : "Deactivate user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "hard"
                ? `This will permanently remove ${confirmAction?.user?.full_name || confirmAction?.user?.email} (${confirmAction?.user?.email}). This cannot be undone.`
                : `${confirmAction?.user?.full_name || confirmAction?.user?.email} (${confirmAction?.user?.email}) will be set to inactive and unassigned from their department.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate({
                  userId: confirmAction.user.id,
                  mode: confirmAction.type,
                });
              }}
              className={confirmAction?.type === "hard" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {deleteMutation.isPending
                ? "Processing..."
                : confirmAction?.type === "hard"
                  ? "Delete permanently"
                  : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

import React from "react";
import { deleteDepartment } from "@/api/departmentsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit2, Trash2, Users } from "lucide-react";
import { useState } from "react";

export default function DepartmentList({ departments, onEdit }) {
  const [deleteId, setDeleteId] = useState(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      setDeleteId(null);
    },
  });

  if (departments.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">No departments found. Create your first department.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => (
          <Card key={dept.id} className={!dept.is_active ? 'opacity-60' : ''}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg text-slate-900">{dept.name}</h3>
                    {!dept.is_active && (
                      <Badge variant="outline" className="text-amber-700 border-amber-300">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  {dept.sector && (
                    <Badge variant="secondary" className="mr-2">
                      {dept.sector}
                    </Badge>
                  )}
                </div>

                {dept.description && (
                  <p className="text-sm text-slate-600">{dept.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  {dept.manager_name && (
                    <div>
                      <p className="text-slate-500">Manager:</p>
                      <p className="text-slate-900 font-medium">{dept.manager_name}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span>{dept.member_count || 0} members</span>
                  </div>

                  {dept.location && (
                    <div>
                      <p className="text-slate-500">Location: {dept.location}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-slate-600 text-sm">
                    Members: <span className="font-medium">{dept.member_count || 0}</span>
                  </div>

                  {dept.email && (
                    <div>
                      <a href={`mailto:${dept.email}`} className="text-blue-600 hover:underline">
                        {dept.email}
                      </a>
                    </div>
                  )}

                  {dept.phone && (
                    <div>
                      <p className="text-slate-600">{dept.phone}</p>
                    </div>
                  )}

                  {dept.budget && (
                    <div>
                      <p className="text-slate-500">Budget: ${parseFloat(dept.budget).toLocaleString()}</p>
                    </div>
                  )}
                </div>

                {dept.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {dept.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-slate-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(dept)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteId(dept.id)}
                    className="flex-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
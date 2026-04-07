import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/authApi";
import { ROLES } from "@/components/shared/rbac";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Users, Layout, Key, Lock } from "lucide-react";
import UserRoleManager from "@/components/accesscontrol/UserRoleManager";
import PageAccessMatrix from "@/components/accesscontrol/PageAccessMatrix";
import PermissionsMatrix from "@/components/accesscontrol/PermissionsMatrix";

export default function AccessControl() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getCurrentUser(),
  });

  if (user && user.role !== ROLES.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Lock className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-600 dark:text-slate-400">Access Denied</h2>
        <p className="text-slate-400">Only System Administrators can manage access control.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shrink-0">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Access Control</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Manage user roles and control what each role can access across the system.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="flex items-center gap-4 pt-5">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">User Roles</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Assign & Manage</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="flex items-center gap-4 pt-5">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <Layout className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Page Access</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Per Role Control</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="flex items-center gap-4 pt-5">
            <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Permissions</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">Feature-level Access</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="bg-slate-100 dark:bg-slate-800">
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" /> User Roles
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2">
            <Layout className="w-4 h-4" /> Page Access
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2">
            <Key className="w-4 h-4" /> Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-base">User Role Management</CardTitle>
              <CardDescription>Assign roles to users. Role changes take effect immediately.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserRoleManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-base">Page Access Control</CardTitle>
              <CardDescription>
                Toggle which roles can access each page. System Admin always has full access.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <PageAccessMatrix />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <Card className="border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-base">Feature Permissions</CardTitle>
              <CardDescription>
                Control what actions each role can perform. System Admin always has all permissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <PermissionsMatrix />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function MemberContributionChart({ initiatives = [], users = [] }) {
  // Calculate contribution metrics for each user
  const userStats = users.map(user => {
    const userInitiatives = initiatives.filter(init => 
      init.lead_user_id === user.id || 
      (init.support_users && init.support_users.includes(user.id))
    );
    
    const led = userInitiatives.filter(init => init.lead_user_id === user.id).length;
    const supported = userInitiatives.filter(init => init.support_users?.includes(user.id)).length;
    const completed = userInitiatives.filter(init => init.lead_user_id === user.id && init.status === 'completed').length;
    
    return {
      id: user.id,
      name: user.full_name?.substring(0, 12) || 'User',
      fullName: user.full_name,
      led,
      supported,
      total: led + supported,
      completed,
    };
  }).filter(stat => stat.total > 0).sort((a, b) => b.total - a.total).slice(0, 10);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Contributors</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={userStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
            <YAxis />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload?.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-slate-200 rounded shadow-lg">
                      <p className="font-medium text-slate-900">{data.fullName}</p>
                      <p className="text-sm text-slate-600">Led: {data.led}</p>
                      <p className="text-sm text-slate-600">Supported: {data.supported}</p>
                      <p className="text-sm text-slate-600">Completed: {data.completed}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar dataKey="led" fill="#3b82f6" name="Led Tasks" />
            <Bar dataKey="supported" fill="#8b5cf6" name="Supported Tasks" />
          </BarChart>
        </ResponsiveContainer>

        {userStats.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No contribution data available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
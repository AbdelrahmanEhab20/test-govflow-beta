import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listUsers } from '@/api/usersApi';
import { listTaskApprovals, submitForApproval } from '@/api/approvalsApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Clock, X, Plus, Trash2 } from 'lucide-react';

export default function ApprovalFlowManager({ taskId, requiresApproval = false, approvers = [], onApproversChange }) {
  const [showAddApprover, setShowAddApprover] = useState(false);
  const [selectedApproverId, setSelectedApproverId] = useState('');
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const { data: approvalRecords = [] } = useQuery({
    queryKey: ['approvals', taskId],
    queryFn: () => listTaskApprovals(taskId),
  });

  const submitForApprovalMutation = useMutation({
    mutationFn: async () => submitForApproval(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    }
  });

  const handleAddApprover = () => {
    if (selectedApproverId && !approvers.includes(selectedApproverId)) {
      onApproversChange([...approvers, selectedApproverId]);
      setSelectedApproverId('');
      setShowAddApprover(false);
    }
  };

  const handleRemoveApprover = (userId) => {
    onApproversChange(approvers.filter(id => id !== userId));
  };

  const getApproverName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || 'Unknown User';
  };

  const getApprovalStatus = (userId) => {
    const approval = approvalRecords.find(a => a.approver_user_id === userId);
    return approval?.status || 'pending';
  };

  return (
    <Card className="dark:bg-slate-900 dark:border-slate-800">
      <CardHeader>
        <CardTitle>Approval Flow</CardTitle>
        <CardDescription>Configure approvers for this task</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-900 dark:text-white">Require approval</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Task needs approval to proceed</p>
          </div>
          <Switch checked={requiresApproval} onCheckedChange={onApproversChange} />
        </div>

        {requiresApproval && (
          <>
            {approvers.length > 0 && (
              <div className="space-y-2">
                {approvers.map((userId) => {
                  const status = getApprovalStatus(userId);
                  const statusColor = {
                    pending: 'text-yellow-600 dark:text-yellow-400',
                    approved: 'text-green-600 dark:text-green-400',
                    rejected: 'text-red-600 dark:text-red-400'
                  };

                  return (
                    <div key={userId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">
                          {getApproverName(userId)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {status === 'pending' && (
                            <>
                              <Clock className={`w-3 h-3 ${statusColor.pending}`} />
                              <span className="text-xs text-slate-600 dark:text-slate-400">Pending</span>
                            </>
                          )}
                          {status === 'approved' && (
                            <>
                              <CheckCircle2 className={`w-3 h-3 ${statusColor.approved}`} />
                              <span className="text-xs text-slate-600 dark:text-slate-400">Approved</span>
                            </>
                          )}
                          {status === 'rejected' && (
                            <>
                              <X className={`w-3 h-3 ${statusColor.rejected}`} />
                              <span className="text-xs text-slate-600 dark:text-slate-400">Rejected</span>
                            </>
                          )}
                        </div>
                      </div>
                      {status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveApprover(userId)}
                          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {showAddApprover ? (
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <Select value={selectedApproverId} onValueChange={setSelectedApproverId}>
                  <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent>
                    {users
                      .filter(u => !approvers.includes(u.id))
                      .map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name} ({user.role})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>

                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddApprover} className="bg-blue-600">
                    Add
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddApprover(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddApprover(true)}
                className="w-full dark:border-slate-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Approver
              </Button>
            )}

            {approvers.length > 0 && (
              <Button
                onClick={() => submitForApprovalMutation.mutate()}
                disabled={submitForApprovalMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {submitForApprovalMutation.isPending ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
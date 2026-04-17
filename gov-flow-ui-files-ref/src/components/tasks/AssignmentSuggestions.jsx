import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Check, AlertCircle } from "lucide-react";

export default function AssignmentSuggestions({ taskId, taskData, onAssigned }) {
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [assignedUser, setAssignedUser] = useState(null);

  const assignMutation = useMutation({
    mutationFn: (userId) =>
      base44.functions.invoke('assignTaskToUser', {
        taskId,
        userId,
        initiativeData: taskData,
      }),
    onSuccess: (data) => {
      setAssignedUser(data.data.updatedInitiative.lead_user_id);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onAssigned?.();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const loadSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('suggestTaskAssignment', {
        taskId,
        taskData,
      });
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      setError(err.message);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    return 'text-slate-600';
  };

  if (assignedUser) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Task Assigned</p>
              <p className="text-sm text-green-700">Assignment completed successfully. Notification sent to assignee.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            AI Assignment Suggestions
          </CardTitle>
          <Button
            size="sm"
            onClick={loadSuggestions}
            disabled={isLoading}
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Get Suggestions'
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900">Error loading suggestions</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {suggestions.length === 0 && !isLoading && !error && (
          <p className="text-sm text-slate-500 text-center py-4">
            Click "Get Suggestions" to get AI-powered assignment recommendations
          </p>
        )}

        {suggestions.map((suggestion, index) => (
          <div
            key={suggestion.userId}
            className="flex items-start justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {index + 1}. {suggestion.userName}
                </p>
                <Badge variant="secondary" className={getScoreColor(suggestion.score)}>
                  {suggestion.score}%
                </Badge>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{suggestion.reasoning}</p>
            </div>
            <Button
              size="sm"
              onClick={() => assignMutation.mutate(suggestion.userId)}
              disabled={assignMutation.isPending}
              className="ml-3 flex-shrink-0"
            >
              {assignMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
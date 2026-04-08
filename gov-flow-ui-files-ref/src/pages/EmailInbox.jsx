import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/authApi";
import { listEmails, syncMailboxInbox, updateEmail } from "@/api/emailApi";
import { listUsers } from "@/api/usersApi";
import { listTasks } from "@/api/tasksApi";
import { useNodeBackend } from "@/api/nodeBackendClient";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { 
  Search, 
  RefreshCw, 
  Inbox, 
  Star, 
  Archive,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import EmailListItem from "../components/email/EmailListItem";
import EmailViewer from "../components/email/EmailViewer";
import MailboxSelector from "../components/email/MailboxSelector";
import EmptyState from "../components/shared/EmptyState";
import { useToast } from "@/components/ui/use-toast";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "invitation", label: "Invitation" },
  { value: "mou", label: "MoU" },
  { value: "media", label: "Media" },
  { value: "data_request", label: "Data Request" },
  { value: "complaint", label: "Complaint" },
  { value: "protocol", label: "Protocol" },
  { value: "other", label: "Other" }
];

export default function EmailInbox() {
  const urlParams = new URLSearchParams(window.location.search);
  const preSelectedId = urlParams.get('id');

  const [activeView, setActiveView] = useState('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEmailId, setSelectedEmailId] = useState(preSelectedId || null);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedTaskToLink, setSelectedTaskToLink] = useState('');
  const [activeMailbox, setActiveMailbox] = useState(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  });

  React.useEffect(() => {
    const active = currentUser?.mailboxes?.find((mailbox) => mailbox.isActive);
    const activeEmail = active?.email || null;
    if (activeEmail !== activeMailbox) {
      setActiveMailbox(activeEmail);
    }
  }, [currentUser, activeMailbox]);

  const { data: emails = [], isLoading, refetch } = useQuery({
    queryKey: ['emails', activeMailbox],
    queryFn: () => {
      const query = activeMailbox ? { mailbox: activeMailbox } : {};
      return listEmails(query, '-received_at', 50);
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => listTasks({ orderBy: '-created_date', limit: 50 }),
  });

  const updateEmailMutation = useMutation({
    mutationFn: ({ id, data }) => updateEmail(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emails'] }),
  });
  const syncInboxMutation = useMutation({
    mutationFn: (provider) => syncMailboxInbox(provider),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emails'] }),
  });

  // Filter emails
  const filteredEmails = useMemo(() => {
    let result = [...emails];

    // View filter
    switch (activeView) {
      case 'new':
        result = result.filter(e => e.status_in_system === 'new');
        break;
      case 'starred':
        result = result.filter(e => e.is_starred);
        break;
      case 'converted':
        result = result.filter(e => e.linked_task_id);
        break;
      case 'archived':
        result = result.filter(e => e.status_in_system === 'archived');
        break;
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(e => e.category === categoryFilter);
    }

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.subject?.toLowerCase().includes(query) ||
        e.from_name?.toLowerCase().includes(query) ||
        e.from_email?.toLowerCase().includes(query) ||
        e.body_preview?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [emails, activeView, categoryFilter, searchQuery]);

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

  // Stats
  const newCount = emails.filter(e => e.status_in_system === 'new').length;
  const starredCount = emails.filter(e => e.is_starred).length;
  const convertedCount = emails.filter(e => e.linked_task_id).length;

  const handleSelectEmail = (email) => {
    setSelectedEmailId(email.id);
    if (!email.is_read) {
      updateEmailMutation.mutate({ id: email.id, data: { is_read: true } });
    }
  };

  const handleStarEmail = (email) => {
    updateEmailMutation.mutate({ 
      id: email.id, 
      data: { is_starred: !email.is_starred } 
    });
  };

  const handleConvertToTask = () => {
    if (selectedEmail) {
      navigate(createPageUrl(`TaskForm?emailId=${selectedEmail.id}`));
    }
  };

  const handleLinkToTask = () => {
    setLinkDialogOpen(true);
  };

  const confirmLinkToTask = () => {
    if (selectedEmail && selectedTaskToLink) {
      updateEmailMutation.mutate({
        id: selectedEmail.id,
        data: { 
          linked_task_id: selectedTaskToLink,
          status_in_system: 'converted'
        }
      });
    }
    setLinkDialogOpen(false);
    setSelectedTaskToLink('');
  };

  const handleArchive = () => {
    if (selectedEmail) {
      updateEmailMutation.mutate({
        id: selectedEmail.id,
        data: { status_in_system: 'archived' }
      });
    }
  };

  const handleCategoryChange = (category) => {
    if (selectedEmail) {
      updateEmailMutation.mutate({
        id: selectedEmail.id,
        data: { category, status_in_system: 'triaged' }
      });
    }
  };

  const handleAssign = (userId) => {
    if (selectedEmail) {
      updateEmailMutation.mutate({
        id: selectedEmail.id,
        data: { assigned_to_user_id: userId, status_in_system: 'triaged' }
      });
    }
  };

  const handleRefresh = async () => {
    const selectedMailbox = currentUser?.mailboxes?.find((mailbox) => mailbox.email === activeMailbox && mailbox.isActive);
    const selectedProvider = selectedMailbox?.provider;
    if (useNodeBackend) {
      try {
        if (selectedProvider === 'gmail' || selectedProvider === 'outlook') {
          await syncInboxMutation.mutateAsync(selectedProvider);
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Inbox sync failed',
          description: error?.message || 'Reconnect this mailbox and try again.',
        });
        // Keep manual refresh available even when sync fails.
      }
    }
    refetch();
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Email Inbox</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Department mailbox</p>
          </div>
          
          <div className="flex items-center gap-2">
            {currentUser && <MailboxSelector 
              user={currentUser} 
              activeMailbox={activeMailbox}
              onMailboxChange={setActiveMailbox}
            />}
            <Button variant="outline" onClick={handleRefresh} disabled={syncInboxMutation.isPending}>
              <RefreshCw className={`w-4 h-4 mr-2 ${syncInboxMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
          <Tabs value={activeView} onValueChange={setActiveView}>
            <TabsList>
              <TabsTrigger value="all" className="gap-1.5">
                <Inbox className="w-4 h-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1.5">
                <AlertCircle className="w-4 h-4" />
                New
                {newCount > 0 && (
                  <Badge className="ml-1 bg-red-500">{newCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="starred" className="gap-1.5">
                <Star className="w-4 h-4" />
                Starred
                {starredCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{starredCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="converted" className="gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Converted
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-1.5">
                <Archive className="w-4 h-4" />
                Archived
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 flex-1 justify-end">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List */}
        <div className={`
          w-full lg:w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex flex-col
          ${selectedEmailId ? 'hidden lg:flex' : 'flex'}
        `}>
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : filteredEmails.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No emails found"
                description={activeView !== 'all' || searchQuery 
                  ? "Try adjusting your filters"
                  : "Your inbox is empty"
                }
                className="h-full"
              />
            ) : (
              filteredEmails.map(email => (
                <EmailListItem
                  key={email.id}
                  email={email}
                  isSelected={selectedEmails.includes(email.id)}
                  isActive={email.id === selectedEmailId}
                  onSelect={() => {
                    setSelectedEmails(prev => 
                      prev.includes(email.id)
                        ? prev.filter(id => id !== email.id)
                        : [...prev, email.id]
                    );
                  }}
                  onClick={() => handleSelectEmail(email)}
                  onStar={() => handleStarEmail(email)}
                />
              ))
            )}
          </ScrollArea>
        </div>

        {/* Email Viewer */}
        <EmailViewer
          email={selectedEmail}
          onClose={() => setSelectedEmailId(null)}
          onConvertToTask={handleConvertToTask}
          onLinkToTask={handleLinkToTask}
          onArchive={handleArchive}
          onCategoryChange={handleCategoryChange}
          onAssign={handleAssign}
          users={users}
        />
      </div>

      {/* Link to Task Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link to Existing Task</DialogTitle>
            <DialogDescription>
              Select a task to link this email to.
            </DialogDescription>
          </DialogHeader>
          <Select value={selectedTaskToLink} onValueChange={setSelectedTaskToLink}>
            <SelectTrigger>
              <SelectValue placeholder="Select a task" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map(task => (
                <SelectItem key={task.id} value={task.id}>
                  {task.pillar}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmLinkToTask} disabled={!selectedTaskToLink}>
              Link Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
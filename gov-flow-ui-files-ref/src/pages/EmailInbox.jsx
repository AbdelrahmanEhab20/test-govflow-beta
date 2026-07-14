import React, { useState, useMemo } from "react";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/authApi";
import {
  listEmailsPaginated,
  getEmailCounts,
  syncMailboxInbox,
  updateEmail,
  EMAIL_LIST_INITIAL,
  EMAIL_LIST_PAGE_SIZE,
} from "@/api/emailApi";
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
  AlertCircle,
  ChevronDown,
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

function buildEmailListQuery(activeView, activeMailbox) {
  const query = activeMailbox ? { mailbox: activeMailbox } : {};
  switch (activeView) {
    case 'new':
      query.status_in_system = 'new';
      break;
    case 'archived':
      query.status_in_system = 'archived';
      break;
    case 'starred':
      query.is_starred = 'true';
      break;
    case 'converted':
      query.has_linked_task = 'true';
      break;
    default:
      break;
  }
  return query;
}

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
  const [providerCursor, setProviderCursor] = useState(null);

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
      setProviderCursor(null);
    }
  }, [currentUser, activeMailbox]);

  const listQuery = useMemo(
    () => buildEmailListQuery(activeView, activeMailbox),
    [activeView, activeMailbox],
  );

  const {
    data: emailPages,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['emails', activeMailbox, activeView],
    queryFn: ({ pageParam = 0 }) => {
      const skip = pageParam;
      const limit = skip === 0 ? EMAIL_LIST_INITIAL : EMAIL_LIST_PAGE_SIZE;
      return listEmailsPaginated(listQuery, '-received_at', limit, skip);
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.skip + lastPage.items.length : undefined,
  });

  const emails = useMemo(
    () => emailPages?.pages?.flatMap((page) => page.items) ?? [],
    [emailPages],
  );

  const { data: viewCounts = {} } = useQuery({
    queryKey: ['emailCounts', activeMailbox],
    queryFn: () => getEmailCounts(activeMailbox ? { mailbox: activeMailbox } : {}),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['emailCounts'] });
    },
  });
  const syncInboxMutation = useMutation({
    mutationFn: ({ provider, options = {} }) => syncMailboxInbox(provider, options),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      queryClient.invalidateQueries({ queryKey: ['emailCounts'] });
      if (variables.provider === 'gmail' && result?.nextPageToken) {
        setProviderCursor({ provider: 'gmail', pageToken: result.nextPageToken, hasMore: result.hasMore });
      } else if (variables.provider === 'outlook') {
        setProviderCursor({
          provider: 'outlook',
          skip: result?.nextSkip ?? 0,
          hasMore: Boolean(result?.hasMore),
        });
      } else {
        setProviderCursor(null);
      }
    },
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

  // Stats for tab counts from API (full mailbox totals)
  const tabCounts = {
    all: viewCounts.all ?? 0,
    new: viewCounts.new ?? 0,
    starred: viewCounts.starred ?? 0,
    converted: viewCounts.converted ?? 0,
    archived: viewCounts.archived ?? 0,
  };

  const selectedEmail = emails.find(e => e.id === selectedEmailId);

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
          const result = await syncInboxMutation.mutateAsync({ provider: selectedProvider, options: {} });
          if (selectedProvider === 'gmail' && result?.nextPageToken) {
            setProviderCursor({ provider: 'gmail', pageToken: result.nextPageToken, hasMore: result.hasMore });
          } else if (selectedProvider === 'outlook') {
            setProviderCursor({
              provider: 'outlook',
              skip: result?.nextSkip ?? 0,
              hasMore: Boolean(result?.hasMore),
            });
          }
        }
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Inbox sync failed',
          description: error?.message || 'Reconnect this mailbox and try again.',
        });
      }
    }
    refetch();
  };

  const handleSyncOlder = async () => {
    const selectedMailbox = currentUser?.mailboxes?.find((mailbox) => mailbox.email === activeMailbox && mailbox.isActive);
    const selectedProvider = selectedMailbox?.provider;
    if (!selectedProvider || !providerCursor?.hasMore) return;

    const options =
      selectedProvider === 'gmail'
        ? { pageToken: providerCursor.pageToken }
        : { skip: providerCursor.skip };

    try {
      await syncInboxMutation.mutateAsync({ provider: selectedProvider, options });
      await refetch();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Sync older emails failed',
        description: error?.message || 'Please try again.',
      });
    }
  };

  const showSyncOlder = !hasNextPage && providerCursor?.hasMore && useNodeBackend;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col min-w-0">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Email Inbox</h1>
            <p className="text-slate-500 dark:text-slate-300 mt-1">Department mailbox</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentUser && <MailboxSelector 
              user={currentUser} 
              activeMailbox={activeMailbox}
              onMailboxChange={setActiveMailbox}
            />}
            <Button variant="outline" onClick={handleRefresh} disabled={syncInboxMutation.isPending} className="ml-auto sm:ml-0">
              <RefreshCw className={`w-4 h-4 mr-2 ${syncInboxMutation.isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tabs and Filters */}
        <div className="flex flex-col gap-3 sm:gap-4 mt-4">
          <div className="overflow-x-auto pb-1 -mx-1 px-1">
            <Tabs value={activeView} onValueChange={setActiveView}>
              <TabsList className="w-max min-w-full sm:min-w-0">
              <TabsTrigger value="all" className="gap-1.5">
                <Inbox className="w-4 h-4" />
                All
                <Badge variant="secondary" className="ml-1 min-w-[1.25rem] justify-center px-1.5">
                  {tabCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-1.5">
                <AlertCircle className="w-4 h-4" />
                New
                <Badge className={`ml-1 min-w-[1.25rem] justify-center px-1.5 ${tabCounts.new > 0 ? 'bg-red-500' : 'bg-slate-400'}`}>
                  {tabCounts.new}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="starred" className="gap-1.5">
                <Star className="w-4 h-4" />
                Starred
                <Badge variant="secondary" className="ml-1 min-w-[1.25rem] justify-center px-1.5">
                  {tabCounts.starred}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="converted" className="gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Converted
                <Badge variant="secondary" className="ml-1 min-w-[1.25rem] justify-center px-1.5">
                  {tabCounts.converted}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="archived" className="gap-1.5">
                <Archive className="w-4 h-4" />
                Archived
                <Badge variant="secondary" className="ml-1 min-w-[1.25rem] justify-center px-1.5">
                  {tabCounts.archived}
                </Badge>
              </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative flex-1 sm:max-w-xs isolate">
              <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
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
              <>
                {filteredEmails.map(email => (
                  <EmailListItem
                    key={email.id}
                    email={email}
                    users={users}
                    tasks={tasks}
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
                ))}
                {(hasNextPage || showSyncOlder) && (
                  <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    {hasNextPage && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                      >
                        {isFetchingNextPage ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Load more ({EMAIL_LIST_PAGE_SIZE})
                          </>
                        )}
                      </Button>
                    )}
                    {showSyncOlder && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={handleSyncOlder}
                        disabled={syncInboxMutation.isPending}
                      >
                        {syncInboxMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          'Sync older emails'
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </>
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
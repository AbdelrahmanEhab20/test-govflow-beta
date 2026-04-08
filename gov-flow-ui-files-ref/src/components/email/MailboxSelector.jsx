import React, { useState } from "react";
import { updateMe } from "@/api/authApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Mail, Plus, Check, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AddMailboxDialog from "./AddMailboxDialog";

export default function MailboxSelector({ user, activeMailbox, onMailboxChange }) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const mailboxes = user?.mailboxes || [];

  const switchMailboxMutation = useMutation({
    mutationFn: async (mailbox) => {
      const updatedMailboxes = mailboxes.map(m => ({
        ...m,
        isActive: m.id === mailbox.id
      }));
      await updateMe({ mailboxes: updatedMailboxes });
      return mailbox;
    },
    onSuccess: (mailbox) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      onMailboxChange?.(mailbox?.email || null);
    },
  });

  const deleteMailboxMutation = useMutation({
    mutationFn: async (mailboxId) => {
      const updatedMailboxes = mailboxes.filter(m => m.id !== mailboxId);
      // If deleted mailbox was active, activate the first remaining one
      if (mailboxes.find(m => m.id === mailboxId)?.isActive && updatedMailboxes.length > 0) {
        updatedMailboxes[0].isActive = true;
      }
      await updateMe({ mailboxes: updatedMailboxes });
      return mailboxId;
    },
    onSuccess: (removedMailboxId) => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });
      const updated = mailboxes.filter((m) => m.id !== removedMailboxId);
      const nextActive = updated.find((m) => m.isActive) || updated[0] || null;
      onMailboxChange?.(nextActive?.email || null);
    },
  });

  const getProviderColor = (provider) => {
    switch (provider) {
      case 'outlook':
        return 'bg-blue-100 text-blue-700';
      case 'gmail':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const activeMailboxData = mailboxes.find(m => m.isActive);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline truncate max-w-[120px]">
              {activeMailboxData?.displayName || activeMailboxData?.email || 'Select Mailbox'}
            </span>
            <span className="sm:hidden">Mailbox</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 dark:bg-slate-800 dark:border-slate-700">
          <div className="px-2 py-1.5">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Connected Mailboxes</p>
          </div>

          {mailboxes.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No mailboxes connected</p>
            </div>
          ) : (
            <>
              {mailboxes.map((mailbox) => (
                <div key={mailbox.id} className="relative">
                  <DropdownMenuItem
                    onClick={() => switchMailboxMutation.mutate(mailbox)}
                    className="gap-2 cursor-pointer pr-12"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">
                          {mailbox.displayName || mailbox.email}
                        </span>
                        <Badge variant="secondary" className={`text-xs ${getProviderColor(mailbox.provider)}`}>
                          {mailbox.provider}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{mailbox.email}</p>
                    </div>
                    {mailbox.isActive && <Check className="w-4 h-4 text-green-600 flex-shrink-0" />}
                  </DropdownMenuItem>
                  {mailboxes.length >= 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMailboxMutation.mutate(mailbox.id);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem 
            className="gap-2 cursor-pointer"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add Mailbox</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddMailboxDialog 
        open={addDialogOpen} 
        onOpenChange={setAddDialogOpen}
        user={user}
      />
    </>
  );
}
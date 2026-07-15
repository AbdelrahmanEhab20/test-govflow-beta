import React, { useState } from "react";
import { updateMe } from "@/api/authApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNodeBackend } from "@/api/nodeBackendClient";
import { startOutlookConnect } from "@/api/outlookApi";
import { startGmailConnect } from "@/api/googleApi";

export default function AddMailboxDialog({ open, onOpenChange, user, oauthReturnTo = "/EmailInbox" }) {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [provider, setProvider] = useState("outlook");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isOAuthProvider = useNodeBackend && (provider === "outlook" || provider === "gmail");

  const addMailboxMutation = useMutation({
    mutationFn: async () => {
      if (isOAuthProvider) {
        // OAuth providers (Outlook/Gmail) are added by backend callback after redirect.
        // This mutation is kept for manual providers only.
        return;
      }
      if (!email || !displayName) {
        setError("Please fill in all fields");
        return;
      }

      if (!email.includes("@")) {
        setError("Please enter a valid email");
        return;
      }

      const mailboxes = user?.mailboxes || [];
      const newMailbox = {
        id: `mailbox_${Date.now()}`,
        email,
        displayName,
        provider,
        isActive: mailboxes.length === 0, // Auto-activate if first mailbox
      };

      await updateMe({
        mailboxes: [...mailboxes, newMailbox],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setDisplayName("");
      setEmail("");
      setProvider("outlook");
      setError("");
      if (!isOAuthProvider) {
        onOpenChange(false);
      }
    },
    onError: (err) => {
      setError(err.message || "Failed to add mailbox");
    },
  });

  const handleOAuthConnect = async () => {
    setError("");
    try {
      if (provider === "outlook") {
        await startOutlookConnect(oauthReturnTo);
        return;
      }
      if (provider === "gmail") {
        await startGmailConnect(oauthReturnTo);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: `Unable to start ${provider === "outlook" ? "Microsoft" : "Google"} login`,
        description: err?.message || "Please verify OAuth configuration.",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addMailboxMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Mailbox</DialogTitle>
          <DialogDescription>
            Connect a new email account to manage multiple mailboxes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isOAuthProvider && (
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                placeholder="e.g., Personal Email, Work Email"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outlook">Outlook/Microsoft 365</SelectItem>
                <SelectItem value="gmail">Gmail</SelectItem>
                <SelectItem value="other">Other (IMAP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!isOAuthProvider && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {isOAuthProvider && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded text-sm border border-blue-200 dark:border-blue-800/40">
              You’ll be redirected to {provider === "outlook" ? "Microsoft" : "Google"} to authorize access. After you
              return, the mailbox will be added automatically.
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {isOAuthProvider ? (
              <Button type="button" onClick={handleOAuthConnect}>
                {provider === "outlook" ? "Connect Microsoft" : "Connect Google"}
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={addMailboxMutation.isPending || !email || !displayName}
              >
                {addMailboxMutation.isPending ? "Adding..." : "Add Mailbox"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
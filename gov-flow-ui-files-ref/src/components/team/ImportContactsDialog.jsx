import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { getOutlookStatus, listOutlookContacts, startOutlookConnect } from "@/api/outlookApi";
import { inviteUser } from "@/api/usersApi";
import { useNodeBackend } from "@/api/nodeBackendClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, Mail, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function ImportContactsDialog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedContactKeys, setSelectedContactKeys] = useState([]);
  const [importMethod, setImportMethod] = useState('file');
  const fileInputRef = React.useRef(null);
  const getContactKey = (contact = {}) => String(contact.email || "").trim().toLowerCase();
  const {
    data: outlookStatus,
    isLoading: isLoadingOutlookStatus,
    refetch: refetchOutlookStatus,
  } = useQuery({
    queryKey: ['outlookStatus'],
    queryFn: () => getOutlookStatus(),
    enabled: useNodeBackend,
  });

  React.useEffect(() => {
    if (!open || !useNodeBackend) return;
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('ms_connected');
    const reason = params.get('reason');
    if (!connected) return;

    if (connected === '1') {
      toast({
        title: 'Outlook connected',
        description: 'Your Outlook account is now connected. You can import contacts.',
      });
      refetchOutlookStatus();
    } else if (connected === '0') {
      toast({
        variant: 'destructive',
        title: 'Outlook connection failed',
        description: reason || 'OAuth flow did not complete.',
      });
    }

    params.delete('ms_connected');
    params.delete('reason');
    const newSearch = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`);
  }, [open, refetchOutlookStatus, toast]);

  const importMutation = useMutation({
    mutationFn: async (vCardText) => {
      const response = await base44.functions.invoke('importOutlookContacts', {
        vCardText
      });
      return response.data;
    },
    onSuccess: () => {
      setOpen(false);
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert('Contacts imported successfully!');
    },
  });

  const outlookImportMutation = useMutation({
    mutationFn: async () => {
      if (useNodeBackend) {
        return listOutlookContacts();
      }
      const response = await base44.functions.invoke('importOutlookContactsOAuth', {});
      return response.data;
    },
    onSuccess: (data) => {
      const imported = useNodeBackend
        ? (data?.value || [])
          .map((contact) => {
            const primaryEmail = Array.isArray(contact.emailAddresses) ? contact.emailAddresses[0]?.address : null;
            return {
              name: contact.displayName || 'Unknown',
              email: primaryEmail || '',
              position: contact.jobTitle || '',
              department: contact.department || '',
            };
          })
          .filter((c) => Boolean(c.email))
        : (data?.imported || []);

      if (imported.length > 0) {
        const normalized = imported
          .map((contact) => ({ ...contact, email: String(contact.email || "").trim() }))
          .filter((contact) => Boolean(contact.email));
        setPreview({
          contacts: normalized,
          errors: data?.errors || [],
          count: normalized.length
        });
        setSelectedContactKeys(Array.from(new Set(normalized.map((contact) => getContactKey(contact)))));
      } else {
        if (useNodeBackend) {
          startOutlookConnect();
          return;
        }
        alert('No new contacts found to import.');
      }
    },
    onError: (error) => {
      alert('Failed to import contacts: ' + error.message);
    },
  });

  const bulkInviteMutation = useMutation({
    mutationFn: async (contacts) => {
      const uniqueContacts = Array.from(
        new Map(
          (contacts || [])
            .filter((c) => c?.email)
            .map((c) => [String(c.email).trim().toLowerCase(), c])
        ).values()
      );
      const results = await Promise.allSettled(
        uniqueContacts.map((contact) =>
          inviteUser({
            email: contact.email,
            role: "user",
            ...(contact.department ? { department: contact.department } : {}),
            ...(contact.position ? { position: contact.position } : {}),
          })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.length - succeeded;
      return { succeeded, failed, total: results.length };
    },
    onSuccess: ({ succeeded, failed, total }) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({
        title: "Contacts invited",
        description:
          failed > 0
            ? `${succeeded}/${total} contacts invited. ${failed} failed.`
            : `${succeeded}/${total} contacts invited successfully.`,
      });
      setOpen(false);
      setPreview(null);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Invite failed",
        description: error?.message || "Could not invite imported contacts.",
      });
    },
  });

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      
      // Show preview
      const response = await base44.functions.invoke('importOutlookContacts', {
        vCardText: text
      });

      setPreview({
        contacts: response.data.imported,
        errors: response.data.errors,
        count: response.data.count
      });
      setSelectedContactKeys(
        Array.from(
          new Set((response.data.imported || []).map((contact) => getContactKey(contact)).filter(Boolean))
        )
      );
    } catch (error) {
      alert('Error reading file: ' + error.message);
    }
  };

  const selectedContacts = (preview?.contacts || []).filter((contact) =>
    selectedContactKeys.includes(getContactKey(contact))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="w-4 h-4" />
          Import Contacts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import Contacts from Outlook</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!preview ? (
            <Tabs value={importMethod} onValueChange={setImportMethod} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">Upload File</TabsTrigger>
                <TabsTrigger value="oauth">Connect Outlook</TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="space-y-4">
                <div className="p-6 border-2 border-dashed border-slate-300 rounded-lg text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vcf,.ics,.vcard"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <FileUp className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <p className="font-medium text-slate-900">Upload Contact File</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Drag and drop your .vcf or .ics file from Outlook
                    </p>
                  </button>
                </div>

                <div className="text-sm text-slate-600 space-y-2">
                  <p className="font-medium">How to export from Outlook:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Open Outlook Contacts or People</li>
                    <li>Select the contacts you want to import (or use Ctrl+A for all)</li>
                    <li>Right-click and select "Export" or use File → Export</li>
                    <li>Choose "vCard (.vcf)" format</li>
                    <li>Upload the exported file here</li>
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="oauth" className="space-y-4">
                <div className="text-center space-y-4 py-8">
                  <Mail className="w-12 h-12 mx-auto text-blue-500" />
                  <div>
                    <p className="font-medium text-slate-900 mb-2">Connect Your Outlook Account</p>
                    <p className="text-sm text-slate-600 mb-4">
                      Import contacts directly from your Outlook/Office 365 account
                    </p>
                  </div>
                  {useNodeBackend && (
                    <div
                      className={`rounded-md border p-3 text-left ${
                        outlookStatus?.connected
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      {isLoadingOutlookStatus ? (
                        <p className="text-xs text-slate-600">Checking Outlook connection...</p>
                      ) : outlookStatus?.connected ? (
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-emerald-800">Connected account</p>
                            <p className="text-xs text-emerald-700">
                              {outlookStatus?.mailbox?.email || "Outlook connected"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-800">No Outlook account connected yet.</p>
                      )}
                    </div>
                  )}
                  <Button 
                    onClick={() => outlookImportMutation.mutate()}
                    disabled={outlookImportMutation.isPending}
                    className="w-full"
                  >
                    {outlookImportMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Import Contacts from Outlook
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      startOutlookConnect().catch((error) => {
                        alert('Failed to start Outlook OAuth: ' + error.message);
                      });
                    }}
                    className="w-full"
                    disabled={useNodeBackend ? isLoadingOutlookStatus : false}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {useNodeBackend && outlookStatus?.connected
                      ? "Reconnect Outlook Account"
                      : "Connect Outlook Account"}
                  </Button>
                  {!useNodeBackend && (
                    <p className="text-xs text-slate-500">
                      Node backend mode is required for Outlook OAuth.
                    </p>
                  )}
                  {useNodeBackend && !outlookStatus?.connected && (
                    <p className="text-xs text-slate-500">
                      Connect your account first, then click Import Contacts.
                    </p>
                  )}
                  {useNodeBackend && outlookStatus?.connected && (
                    <p className="text-xs text-slate-500">
                      Connected. Click Import Contacts to pull people from Outlook.
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    We'll only import contacts with valid email addresses
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-900">
                  Found {preview.count} contacts to import
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Review the list below and invite them individually
                </p>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={
                        preview.contacts.length > 0 && selectedContactKeys.length === preview.contacts.length
                      }
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedContactKeys(
                            Array.from(new Set(preview.contacts.map((contact) => getContactKey(contact)).filter(Boolean)))
                          );
                          return;
                        }
                        setSelectedContactKeys([]);
                      }}
                    />
                    <span className="text-xs text-slate-700">
                      Select all ({selectedContactKeys.length}/{preview.contacts.length})
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelectedContactKeys([])}
                  >
                    Clear
                  </Button>
                </div>
                {preview.contacts.map((contact, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <Checkbox
                        checked={selectedContactKeys.includes(getContactKey(contact))}
                        onCheckedChange={(checked) => {
                          const key = getContactKey(contact);
                          if (!key) return;
                          setSelectedContactKeys((prev) => {
                            if (checked) return prev.includes(key) ? prev : [...prev, key];
                            return prev.filter((existing) => existing !== key);
                          });
                        }}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-slate-500">{contact.email}</p>
                        {contact.position && (
                          <p className="text-xs text-slate-600 mt-1">{contact.position}</p>
                        )}
                        {contact.department && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            {contact.department}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {preview.errors.length > 0 && (
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-xs font-medium text-amber-900 mb-2">
                    Issues found:
                  </p>
                  <ul className="space-y-1">
                    {preview.errors.map((error, idx) => (
                      <li key={idx} className="text-xs text-amber-700">
                        • {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => bulkInviteMutation.mutate(selectedContacts)}
                  disabled={bulkInviteMutation.isPending || selectedContacts.length === 0}
                >
                  {bulkInviteMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inviting...
                    </>
                  ) : (
                    `Invite Selected (${selectedContacts.length})`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
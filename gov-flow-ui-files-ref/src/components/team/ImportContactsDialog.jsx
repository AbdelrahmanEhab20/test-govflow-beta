import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { listOutlookContacts, startOutlookConnect } from "@/api/outlookApi";
import { useNodeBackend } from "@/api/nodeBackendClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ImportContactsDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importMethod, setImportMethod] = useState('file');
  const fileInputRef = React.useRef(null);

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
        setPreview({
          contacts: imported,
          errors: data?.errors || [],
          count: imported.length
        });
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
    } catch (error) {
      alert('Error reading file: ' + error.message);
    }
  };

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
                  <Button 
                    onClick={() => {
                      if (useNodeBackend) {
                        startOutlookConnect().catch((error) => {
                          alert('Failed to start Outlook OAuth: ' + error.message);
                        });
                        return;
                      }
                      outlookImportMutation.mutate();
                    }}
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
                        Connect Outlook Account
                      </>
                    )}
                  </Button>
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
                {preview.contacts.map((contact, idx) => (
                  <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
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
                  onClick={() => {
                    setOpen(false);
                    alert('Review the contacts above. Use the "Invite Team Member" button to add them individually.');
                  }}
                >
                  Close & Invite Manually
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
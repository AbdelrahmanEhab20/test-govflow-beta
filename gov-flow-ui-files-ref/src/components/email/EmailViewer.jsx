import React from "react";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Reply, 
  Forward, 
  MoreHorizontal, 
  Paperclip,
  Download,
  ExternalLink,
  Expand,
  Tag,
  User as UserIcon,
  Archive,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CATEGORY_COLORS = {
  general: "bg-slate-100 text-slate-700",
  invitation: "bg-purple-100 text-purple-700",
  mou: "bg-blue-100 text-blue-700",
  media: "bg-pink-100 text-pink-700",
  data_request: "bg-amber-100 text-amber-700",
  complaint: "bg-red-100 text-red-700",
  protocol: "bg-emerald-100 text-emerald-700",
  other: "bg-slate-100 text-slate-700"
};

function buildEmailSrcDoc(bodyHtml) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base target="_blank" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
        color: #0f172a;
        background: #ffffff;
      }
      body {
        padding: 16px;
        overflow-wrap: anywhere;
      }
      img, video, iframe {
        max-width: 100%;
      }
    </style>
  </head>
  <body>${bodyHtml || ""}</body>
</html>`;
}

export default function EmailViewer({ 
  email, 
  onClose, 
  onConvertToTask,
  onLinkToTask,
  onArchive,
  onCategoryChange,
  onAssign,
  users = []
}) {
  const [isExpandedOpen, setIsExpandedOpen] = React.useState(false);

  if (!email) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Select an email to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-start justify-between gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex flex-wrap items-center justify-end gap-2 flex-1 min-w-0">
            <Button 
              onClick={onConvertToTask}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              Convert to Task
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsExpandedOpen(true)}
              size="sm"
            >
              <Expand className="w-4 h-4 mr-2" />
              Open Mail
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Tag className="w-4 h-4 mr-2" />
                  Category
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <DropdownMenuItem 
                    key={cat} 
                    onClick={() => onCategoryChange(cat)}
                  >
                    <Badge className={`${CATEGORY_COLORS[cat]} mr-2`}>
                      {cat.replace('_', ' ')}
                    </Badge>
                    {cat === email.category && '✓'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserIcon className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {users.map(user => (
                  <DropdownMenuItem 
                    key={user.id} 
                    onClick={() => onAssign(user.id)}
                  >
                    {user.full_name}
                    {user.id === email.assigned_to_user_id && ' ✓'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onLinkToTask}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Link to Existing Task
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onArchive}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Subject */}
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white break-words">{email.subject}</h2>
        
        {/* Meta */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mt-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
              {email.from_name?.[0]?.toUpperCase() || email.from_email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-900 dark:text-white truncate">
                {email.from_name || email.from_email}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{email.from_email}</p>
            </div>
          </div>
          <div className="text-left sm:text-right text-sm text-slate-500 dark:text-slate-400">
            <p>{format(new Date(email.received_at), 'MMM d, yyyy')}</p>
            <p>{format(new Date(email.received_at), 'h:mm a')}</p>
          </div>
        </div>

        {/* To/CC */}
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          <p>To: {email.to_emails?.join(', ')}</p>
          {email.cc_emails?.length > 0 && (
            <p>CC: {email.cc_emails.join(', ')}</p>
          )}
        </div>

        {/* Category Badge */}
        {email.category && (
          <div className="mt-3">
            <Badge className={CATEGORY_COLORS[email.category]}>
              {email.category.replace('_', ' ')}
            </Badge>
          </div>
        )}
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 p-3 sm:p-6 dark:bg-slate-900">
        {email.body_html ? (
          <iframe
            title="Email content"
            className="w-full min-h-[300px] sm:min-h-[420px] rounded-md border border-slate-200 dark:border-slate-700 bg-white"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            srcDoc={buildEmailSrcDoc(email.body_html)}
          />
        ) : (
          <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300">
            {email.body_text || email.body_preview}
          </div>
        )}
      </ScrollArea>

      {/* Attachments */}
      {email.attachments?.length > 0 && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            <Paperclip className="w-4 h-4 inline mr-1" />
            {email.attachments.length} Attachment{email.attachments.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-2">
            {email.attachments.map((att, idx) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">{att.name}</span>
                <Download className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {(email.suggested_category || email.suggested_assignee_id || email.suggested_priority) && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-950/30">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">🤖 AI Suggestions</p>
          <div className="flex flex-wrap gap-2 text-sm">
            {email.suggested_category && (
              <Badge variant="outline" className="bg-white dark:bg-slate-800 dark:text-slate-200">
                Category: {email.suggested_category}
              </Badge>
            )}
            {email.suggested_priority && (
              <Badge variant="outline" className="bg-white dark:bg-slate-800 dark:text-slate-200">
                Priority: {email.suggested_priority}
              </Badge>
            )}
            {email.suggested_assignee_id && (
              <Badge variant="outline" className="bg-white dark:bg-slate-800 dark:text-slate-200">
                Assign to: {users.find(u => u.id === email.suggested_assignee_id)?.full_name}
              </Badge>
            )}
          </div>
        </div>
      )}

      <Dialog open={isExpandedOpen} onOpenChange={setIsExpandedOpen}>
        <DialogContent className="w-[96vw] sm:w-[95vw] max-w-6xl h-[90vh] sm:h-[88vh] p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <DialogTitle className="truncate">{email.subject}</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(88vh-56px)] bg-slate-50 dark:bg-slate-900 p-3">
            {email.body_html ? (
              <iframe
                title="Expanded email content"
                className="w-full h-full rounded-md border border-slate-200 dark:border-slate-700 bg-white"
                sandbox="allow-popups allow-popups-to-escape-sandbox"
                srcDoc={buildEmailSrcDoc(email.body_html)}
              />
            ) : (
              <div className="h-full overflow-auto rounded-md border border-slate-200 dark:border-slate-700 bg-white p-4 whitespace-pre-wrap text-slate-700">
                {email.body_text || email.body_preview}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
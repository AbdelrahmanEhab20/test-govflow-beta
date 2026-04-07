import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Paperclip, ChevronRight, Inbox } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";

export default function RecentEmailsWidget({ emails = [] }) {
  const recentEmails = emails.
  filter((e) => e.status_in_system === 'new').
  sort((a, b) => new Date(b.received_at) - new Date(a.received_at)).
  slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="w-5 h-5 text-purple-500" />
          New Emails
        </CardTitle>
        <Link to={createPageUrl('EmailInbox')}>
          <Button variant="ghost" size="sm" className="text-blue-600">
            View All
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          {recentEmails.length === 0 ?
          <div className="flex flex-col items-center justify-center h-full py-8">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Inbox className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">No new emails</p>
            </div> :

          <div className="space-y-2">
              {recentEmails.map((email) =>
            <Link
              key={email.id}
              to={createPageUrl(`EmailInbox?id=${email.id}`)}
              className="block p-3 rounded-lg hover:bg-slate-50 transition-colors">

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium shrink-0">
                      {email.from_name?.[0]?.toUpperCase() || email.from_email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-gray-500 text-sm font-medium truncate">
                          {email.from_name || email.from_email}
                        </p>
                        <span className="text-xs text-slate-400 shrink-0">
                          {formatDistanceToNow(new Date(email.received_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 truncate mt-0.5">{email.subject}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {email.has_attachments &&
                    <Paperclip className="w-3 h-3 text-slate-400" />
                    }
                        {email.category && email.category !== 'general' &&
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            {email.category.replace('_', ' ')}
                          </Badge>
                    }
                      </div>
                    </div>
                  </div>
                </Link>
            )}
            </div>
          }
        </ScrollArea>
      </CardContent>
    </Card>);

}
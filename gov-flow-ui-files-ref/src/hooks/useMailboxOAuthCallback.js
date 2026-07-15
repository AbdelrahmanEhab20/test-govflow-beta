import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import { useNodeBackend } from '@/api/nodeBackendClient';
import { syncMailboxInbox } from '@/api/emailApi';

function cleanOAuthParams(params, keys) {
  keys.forEach((key) => params.delete(key));
  const newSearch = params.toString();
  window.history.replaceState(
    {},
    '',
    `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}`,
  );
}

export function useMailboxOAuthCallback({ refetchOutlookStatus, refetchGmailStatus } = {}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msConnected = params.get('ms_connected');
    const googleConnected = params.get('google_connected');
    const reason = params.get('reason');

    if (msConnected === '1') {
      toast({
        title: 'Microsoft connected',
        description: 'Your Outlook mailbox is now connected.',
      });
      refetchOutlookStatus?.();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });

      if (useNodeBackend) {
        (async () => {
          try {
            await syncMailboxInbox('outlook');
          } catch (err) {
            toast({
              variant: 'destructive',
              title: 'Inbox sync failed',
              description: err?.message || 'Please try refreshing from Email Inbox.',
            });
          } finally {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
          }
        })();
      }

      cleanOAuthParams(params, ['ms_connected', 'reason']);
    }

    if (msConnected === '0') {
      toast({
        variant: 'destructive',
        title: 'Microsoft connection failed',
        description: reason || 'OAuth flow did not complete.',
      });
      cleanOAuthParams(params, ['ms_connected', 'reason']);
    }

    if (googleConnected === '1') {
      toast({
        title: 'Google connected',
        description: 'Your Gmail mailbox is now connected.',
      });
      refetchGmailStatus?.();
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['emails'] });

      if (useNodeBackend) {
        (async () => {
          try {
            await syncMailboxInbox('gmail');
          } catch (err) {
            toast({
              variant: 'destructive',
              title: 'Inbox sync failed',
              description: err?.message || 'Please try refreshing from Email Inbox.',
            });
          } finally {
            queryClient.invalidateQueries({ queryKey: ['emails'] });
          }
        })();
      }

      cleanOAuthParams(params, ['google_connected', 'reason']);
    }

    if (googleConnected === '0') {
      toast({
        variant: 'destructive',
        title: 'Google connection failed',
        description: reason || 'OAuth flow did not complete.',
      });
      cleanOAuthParams(params, ['google_connected', 'reason']);
    }
  }, [toast, queryClient, refetchOutlookStatus, refetchGmailStatus]);
}

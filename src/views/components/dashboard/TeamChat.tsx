import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  CircularProgress,
  Divider,
  IconButton
} from '@mui/material';
import { Send as SendIcon, Reply as ReplyIcon } from '@mui/icons-material';
import { NostrService } from '../../../services/NostrService';
import { Event } from 'nostr-tools';

interface TeamChatProps {
  teamId: string;
  nostrService: NostrService;
  isVerifiedMember: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  pubkey: string;
  created_at: number;
  replyTo?: string;
}

export const TeamChat: React.FC<TeamChatProps> = ({
  teamId,
  nostrService,
  isVerifiedMember
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    subscribeToNewMessages();
  }, [teamId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      // Subscribe to existing messages
      const relays = ['wss://relay.damus.io', 'wss://relay.snort.social'];
      const filters = {
        kinds: [42],
        '#t': ['team_chat'],
        '#team': [teamId],
        limit: 50
      };

      const events: Event[] = []; // This would come from your relay subscription
      const chatMessages = events.map(event => ({
        id: event.id,
        content: event.content,
        pubkey: event.pubkey,
        created_at: event.created_at,
        replyTo: event.tags.find(t => t[0] === 'e')?.[1]
      }));

      setMessages(chatMessages.sort((a, b) => a.created_at - b.created_at));
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNewMessages = () => {
    // Subscribe to new messages using your relay subscription
    // This is a placeholder for the actual implementation
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isVerifiedMember) return;

    try {
      const messageId = await nostrService.createChatMessage(
        newMessage,
        teamId,
        replyTo || undefined
      );

      // Optimistically add message to the list
      const newChatMessage: ChatMessage = {
        id: messageId,
        content: newMessage,
        pubkey: 'self', // This should be the actual pubkey
        created_at: Math.floor(Date.now() / 1000),
        replyTo: replyTo || undefined
      };

      setMessages(prev => [...prev, newChatMessage]);
      setNewMessage('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReply = (messageId: string) => {
    setReplyTo(messageId);
  };

  return (
    <Paper sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>
        Team Chat
      </Typography>

      <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        ) : (
          <List>
            {messages.map((message) => (
              <React.Fragment key={message.id}>
                <ListItem
                  sx={{
                    backgroundColor: message.replyTo ? 'action.hover' : 'inherit',
                    borderRadius: 1
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">
                          {message.pubkey.substring(0, 8)}...
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(message.created_at * 1000).toLocaleString()}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        {message.replyTo && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            component="div"
                            sx={{ mt: 0.5 }}
                          >
                            Replying to: {message.replyTo.substring(0, 8)}...
                          </Typography>
                        )}
                        <Typography
                          variant="body2"
                          color="text.primary"
                          sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                        >
                          {message.content}
                        </Typography>
                      </>
                    }
                  />
                  {isVerifiedMember && (
                    <IconButton
                      size="small"
                      onClick={() => handleReply(message.id)}
                      sx={{ ml: 1 }}
                    >
                      <ReplyIcon fontSize="small" />
                    </IconButton>
                  )}
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {isVerifiedMember ? (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {replyTo && (
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: '70px',
                left: '24px',
                backgroundColor: 'background.paper',
                padding: '4px 8px',
                borderRadius: 1
              }}
            >
              Replying to: {replyTo.substring(0, 8)}...
              <IconButton
                size="small"
                onClick={() => setReplyTo(null)}
                sx={{ ml: 1 }}
              >
                ×
              </IconButton>
            </Typography>
          )}
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            size="small"
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            Send
          </Button>
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center">
          Only verified members can send messages
        </Typography>
      )}
    </Paper>
  );
};
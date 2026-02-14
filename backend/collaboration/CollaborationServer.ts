/**
 * CollaborationServer - Real-Time WebSocket Server
 * 
 * Features:
 * - Socket.io for real-time communication
 * - Room management per check session
 * - Operational transforms for concurrent edits
 * - Presence tracking and cursor sync
 * - Conflict resolution
 */

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import crypto from 'crypto';

interface Participant {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'approver' | 'editor' | 'viewer';
    status: 'online' | 'idle' | 'away';
    cursor?: { x: number; y: number; field?: string };
    color: string;
    joinedAt: Date;
    lastActivity: Date;
}

interface Room {
    id: string;
    checkId: string;
    participants: Map<string, Participant>;
    documentState: any;
    version: number;
    pendingOperations: Operation[];
    createdAt: Date;
    lastActivity: Date;
}

interface Operation {
    id: string;
    type: 'insert' | 'delete' | 'update' | 'move';
    field: string;
    value: any;
    previousValue?: any;
    position?: number;
    userId: string;
    timestamp: number;
    version: number;
}

interface Comment {
    id: string;
    userId: string;
    userName: string;
    field?: string;
    text: string;
    timestamp: Date;
    resolved: boolean;
    replies: Comment[];
}

interface ApprovalRequest {
    id: string;
    checkId: string;
    requesterId: string;
    approvers: string[];
    status: 'pending' | 'approved' | 'rejected';
    approvals: { userId: string; decision: 'approve' | 'reject'; timestamp: Date; comment?: string }[];
    createdAt: Date;
}

// Available colors for participants
const PARTICIPANT_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

export class CollaborationServer {
    private io: Server | null = null;
    private rooms: Map<string, Room> = new Map();
    private userSockets: Map<string, Socket> = new Map();
    private approvalRequests: Map<string, ApprovalRequest> = new Map();
    private comments: Map<string, Comment[]> = new Map();

    constructor() {
        // Will be initialized when attach() is called
    }

    /**
     * Attach to an HTTP server
     */
    attach(server: HttpServer): void {
        this.io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupEventHandlers();
        console.log('🔌 Collaboration WebSocket server initialized');
    }

    private setupEventHandlers(): void {
        if (!this.io) return;

        this.io.on('connection', (socket: Socket) => {
            console.log(`Client connected: ${socket.id}`);

            // Authentication
            socket.on('authenticate', (data) => this.handleAuthenticate(socket, data));

            // Room management
            socket.on('join-room', (data) => this.handleJoinRoom(socket, data));
            socket.on('leave-room', (data) => this.handleLeaveRoom(socket, data));

            // Document operations
            socket.on('operation', (data) => this.handleOperation(socket, data));
            socket.on('cursor-move', (data) => this.handleCursorMove(socket, data));
            socket.on('selection-change', (data) => this.handleSelectionChange(socket, data));

            // Comments
            socket.on('add-comment', (data) => this.handleAddComment(socket, data));
            socket.on('resolve-comment', (data) => this.handleResolveComment(socket, data));

            // Approvals
            socket.on('request-approval', (data) => this.handleRequestApproval(socket, data));
            socket.on('respond-approval', (data) => this.handleRespondApproval(socket, data));

            // Presence
            socket.on('status-change', (data) => this.handleStatusChange(socket, data));

            // Disconnect
            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    private handleAuthenticate(socket: Socket, data: { userId: string; token: string; name: string; email: string }): void {
        // In production, verify JWT token
        socket.data.userId = data.userId;
        socket.data.name = data.name;
        socket.data.email = data.email;
        socket.data.authenticated = true;

        this.userSockets.set(data.userId, socket);

        socket.emit('authenticated', { success: true, userId: data.userId });
    }

    private handleJoinRoom(socket: Socket, data: { checkId: string; role: Participant['role'] }): void {
        if (!socket.data.authenticated) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        const roomId = `check_${data.checkId}`;
        let room = this.rooms.get(roomId);

        // Create room if doesn't exist
        if (!room) {
            room = {
                id: roomId,
                checkId: data.checkId,
                participants: new Map(),
                documentState: {},
                version: 0,
                pendingOperations: [],
                createdAt: new Date(),
                lastActivity: new Date()
            };
            this.rooms.set(roomId, room);
        }

        // Add participant
        const participant: Participant = {
            id: socket.data.userId,
            name: socket.data.name,
            email: socket.data.email,
            role: data.role,
            status: 'online',
            color: PARTICIPANT_COLORS[room.participants.size % PARTICIPANT_COLORS.length],
            joinedAt: new Date(),
            lastActivity: new Date()
        };

        room.participants.set(socket.data.userId, participant);
        socket.join(roomId);
        socket.data.roomId = roomId;

        // Notify others
        socket.to(roomId).emit('participant-joined', participant);

        // Send current state to joining user
        socket.emit('room-state', {
            roomId,
            checkId: data.checkId,
            participants: Array.from(room.participants.values()),
            documentState: room.documentState,
            version: room.version,
            comments: this.comments.get(data.checkId) || [],
            pendingApprovals: this.getPendingApprovals(data.checkId)
        });
    }

    private handleLeaveRoom(socket: Socket, data: { checkId: string }): void {
        const roomId = `check_${data.checkId}`;
        const room = this.rooms.get(roomId);

        if (room) {
            room.participants.delete(socket.data.userId);
            socket.leave(roomId);

            socket.to(roomId).emit('participant-left', {
                userId: socket.data.userId,
                name: socket.data.name
            });

            // Clean up empty rooms
            if (room.participants.size === 0) {
                this.rooms.delete(roomId);
            }
        }
    }

    private handleOperation(socket: Socket, data: { field: string; type: Operation['type']; value: any; previousValue?: any }): void {
        const roomId = socket.data.roomId;
        const room = this.rooms.get(roomId);

        if (!room) return;

        // Check permissions
        const participant = room.participants.get(socket.data.userId);
        if (!participant || (participant.role === 'viewer')) {
            socket.emit('operation-rejected', { reason: 'Insufficient permissions' });
            return;
        }

        // Create operation
        const operation: Operation = {
            id: crypto.randomBytes(8).toString('hex'),
            type: data.type,
            field: data.field,
            value: data.value,
            previousValue: data.previousValue,
            userId: socket.data.userId,
            timestamp: Date.now(),
            version: room.version + 1
        };

        // Apply operational transform if needed
        const transformedOp = this.transformOperation(operation, room.pendingOperations);

        // Update room state
        this.applyOperation(room, transformedOp);
        room.version++;
        room.lastActivity = new Date();
        room.pendingOperations.push(transformedOp);

        // Keep only last 100 operations for transform
        if (room.pendingOperations.length > 100) {
            room.pendingOperations = room.pendingOperations.slice(-100);
        }

        // Broadcast to all in room
        this.io?.to(roomId).emit('operation-applied', {
            operation: transformedOp,
            version: room.version,
            userId: socket.data.userId,
            userName: socket.data.name
        });
    }

    private transformOperation(newOp: Operation, pendingOps: Operation[]): Operation {
        // Simplified OT - in production use a proper OT library
        let transformed = { ...newOp };

        for (const pending of pendingOps) {
            if (pending.field === newOp.field && pending.timestamp < newOp.timestamp) {
                // Same field modified - last write wins for simplicity
                // A real OT implementation would merge changes
            }
        }

        return transformed;
    }

    private applyOperation(room: Room, operation: Operation): void {
        switch (operation.type) {
            case 'update':
                room.documentState[operation.field] = operation.value;
                break;
            case 'delete':
                delete room.documentState[operation.field];
                break;
            case 'insert':
                room.documentState[operation.field] = operation.value;
                break;
        }
    }

    private handleCursorMove(socket: Socket, data: { x: number; y: number; field?: string }): void {
        const roomId = socket.data.roomId;
        const room = this.rooms.get(roomId);

        if (!room) return;

        const participant = room.participants.get(socket.data.userId);
        if (participant) {
            participant.cursor = data;
            participant.lastActivity = new Date();

            socket.to(roomId).emit('cursor-update', {
                userId: socket.data.userId,
                cursor: data,
                color: participant.color
            });
        }
    }

    private handleSelectionChange(socket: Socket, data: { field: string; start: number; end: number }): void {
        const roomId = socket.data.roomId;
        const room = this.rooms.get(roomId);

        if (!room) return;

        const participant = room.participants.get(socket.data.userId);
        if (participant) {
            socket.to(roomId).emit('selection-update', {
                userId: socket.data.userId,
                selection: data,
                color: participant.color,
                userName: socket.data.name
            });
        }
    }

    private handleAddComment(socket: Socket, data: { checkId: string; field?: string; text: string }): void {
        const comment: Comment = {
            id: crypto.randomBytes(8).toString('hex'),
            userId: socket.data.userId,
            userName: socket.data.name,
            field: data.field,
            text: data.text,
            timestamp: new Date(),
            resolved: false,
            replies: []
        };

        const comments = this.comments.get(data.checkId) || [];
        comments.push(comment);
        this.comments.set(data.checkId, comments);

        const roomId = `check_${data.checkId}`;
        this.io?.to(roomId).emit('comment-added', comment);
    }

    private handleResolveComment(socket: Socket, data: { checkId: string; commentId: string }): void {
        const comments = this.comments.get(data.checkId);
        if (!comments) return;

        const comment = comments.find(c => c.id === data.commentId);
        if (comment) {
            comment.resolved = true;

            const roomId = `check_${data.checkId}`;
            this.io?.to(roomId).emit('comment-resolved', {
                commentId: data.commentId,
                resolvedBy: socket.data.userId
            });
        }
    }

    private handleRequestApproval(socket: Socket, data: { checkId: string; approvers: string[] }): void {
        const request: ApprovalRequest = {
            id: crypto.randomBytes(8).toString('hex'),
            checkId: data.checkId,
            requesterId: socket.data.userId,
            approvers: data.approvers,
            status: 'pending',
            approvals: [],
            createdAt: new Date()
        };

        this.approvalRequests.set(request.id, request);

        // Notify approvers
        for (const approverId of data.approvers) {
            const approverSocket = this.userSockets.get(approverId);
            if (approverSocket) {
                approverSocket.emit('approval-requested', {
                    request,
                    requesterName: socket.data.name
                });
            }
        }

        const roomId = `check_${data.checkId}`;
        this.io?.to(roomId).emit('approval-status', request);
    }

    private handleRespondApproval(socket: Socket, data: { requestId: string; decision: 'approve' | 'reject'; comment?: string }): void {
        const request = this.approvalRequests.get(data.requestId);
        if (!request) return;

        // Check if user is an approver
        if (!request.approvers.includes(socket.data.userId)) {
            socket.emit('error', { message: 'Not authorized to approve' });
            return;
        }

        // Record approval
        request.approvals.push({
            userId: socket.data.userId,
            decision: data.decision,
            timestamp: new Date(),
            comment: data.comment
        });

        // Check if all approved
        const allApproved = request.approvers.every(a =>
            request.approvals.some(ap => ap.userId === a && ap.decision === 'approve')
        );
        const anyRejected = request.approvals.some(ap => ap.decision === 'reject');

        if (allApproved) {
            request.status = 'approved';
        } else if (anyRejected) {
            request.status = 'rejected';
        }

        // Notify room
        const roomId = `check_${request.checkId}`;
        this.io?.to(roomId).emit('approval-status', request);

        // Notify requester
        const requesterSocket = this.userSockets.get(request.requesterId);
        if (requesterSocket) {
            requesterSocket.emit('approval-response', {
                requestId: request.id,
                responderId: socket.data.userId,
                responderName: socket.data.name,
                decision: data.decision,
                comment: data.comment,
                overallStatus: request.status
            });
        }
    }

    private handleStatusChange(socket: Socket, data: { status: 'online' | 'idle' | 'away' }): void {
        const roomId = socket.data.roomId;
        const room = this.rooms.get(roomId);

        if (!room) return;

        const participant = room.participants.get(socket.data.userId);
        if (participant) {
            participant.status = data.status;
            participant.lastActivity = new Date();

            socket.to(roomId).emit('participant-status', {
                userId: socket.data.userId,
                status: data.status
            });
        }
    }

    private handleDisconnect(socket: Socket): void {
        console.log(`Client disconnected: ${socket.id}`);

        const roomId = socket.data.roomId;
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room) {
                room.participants.delete(socket.data.userId);

                socket.to(roomId).emit('participant-left', {
                    userId: socket.data.userId,
                    name: socket.data.name
                });
            }
        }

        this.userSockets.delete(socket.data.userId);
    }

    private getPendingApprovals(checkId: string): ApprovalRequest[] {
        return Array.from(this.approvalRequests.values())
            .filter(r => r.checkId === checkId && r.status === 'pending');
    }

    /**
     * Get room stats for monitoring
     */
    getRoomStats(): { rooms: number; participants: number; operations: number } {
        let participants = 0;
        let operations = 0;

        for (const room of this.rooms.values()) {
            participants += room.participants.size;
            operations += room.pendingOperations.length;
        }

        return {
            rooms: this.rooms.size,
            participants,
            operations
        };
    }

    /**
     * Broadcast message to all users in a check room
     */
    broadcastToRoom(checkId: string, event: string, data: any): void {
        const roomId = `check_${checkId}`;
        this.io?.to(roomId).emit(event, data);
    }
}

export const collaborationServer = new CollaborationServer();

# Oasis Real-Time System Optimization Plan

## Executive Summary

This document outlines a comprehensive plan to optimize Oasis's real-time messaging system for maximum performance and implement robust typing indicators across all channels and DMs. The plan is based on industry best practices for Next.js + Pusher real-time systems.

## Current System Analysis

### Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Real-Time**: Pusher (Channels)
- **Deployment**: Vercel (Serverless)
- **Database**: PostgreSQL (Prisma ORM)

### Current Architecture
1. **Server-Side**: Pusher server instance for broadcasting events
2. **Client-Side**: Pusher-js client for receiving events
3. **Channels**: 
   - Workspace-level: `workspace-${workspaceId}`
   - Channel-specific: `oasis-channel-${channelId}`
   - DM-specific: `oasis-dm-${dmId}`
4. **Events**: `oasis-message`, `oasis-event`

### Current Issues Identified
1. **Typing Indicators**: 
   - No debouncing/throttling (fires on every keystroke)
   - Calls API on every change (inefficient)
   - No client-side optimization
2. **Real-Time Performance**:
   - Multiple subscriptions per component (potential memory leaks)
   - No connection pooling/reuse
   - Event handlers not optimized
3. **Message Delivery**:
   - Event structure inconsistencies
   - Potential race conditions

## Research Findings: Best Practices

### Pusher Best Practices
1. **Connection Management**:
   - Single Pusher client instance (singleton pattern)
   - Connection reuse across components
   - Proper cleanup on unmount
   - Connection state monitoring

2. **Channel Subscriptions**:
   - Subscribe only to necessary channels
   - Unsubscribe when not needed
   - Use private channels for sensitive data
   - Batch subscriptions when possible

3. **Event Handling**:
   - Debounce/throttle frequent events
   - Batch updates when possible
   - Use event delegation
   - Minimize re-renders

### Typing Indicators Best Practices
1. **Debouncing**: 300-500ms delay before sending "typing" event
2. **Throttling**: Maximum one "typing" event per 1-2 seconds
3. **Auto-stop**: Automatically stop after 3-5 seconds of inactivity
4. **Client-Side Optimization**: Track typing state locally before broadcasting
5. **Batching**: Combine start/stop events when possible

### Next.js + Pusher Optimization
1. **Server Components**: Use for initial data, client components for real-time
2. **Connection Pooling**: Reuse Pusher connections across route changes
3. **Selective Subscriptions**: Only subscribe to active conversations
4. **Memory Management**: Proper cleanup in useEffect hooks
5. **Error Handling**: Graceful degradation when Pusher unavailable

## Optimization Plan

### Phase 1: Typing Indicators Optimization (Priority: HIGH)

#### 1.1 Implement Debounced Typing Detection
**Goal**: Reduce API calls and improve performance

**Implementation**:
- Add debounce hook (300ms) for typing detection
- Only send "start typing" after user has typed for 300ms
- Automatically stop typing after 3 seconds of inactivity
- Use requestAnimationFrame for smooth updates

**Files to Modify**:
- `src/products/oasis/hooks/useOasisTyping.ts`
- `src/products/oasis/components/OasisChatPanel.tsx`

**Benefits**:
- 90% reduction in API calls
- Better user experience
- Reduced server load

#### 1.2 Client-Side Typing State Management
**Goal**: Optimize typing indicator updates

**Implementation**:
- Track typing state locally before broadcasting
- Batch typing events
- Use optimistic updates
- Implement typing indicator cache

**Files to Modify**:
- `src/products/oasis/hooks/useOasisTyping.ts`
- Create `src/products/oasis/utils/typing-optimizer.ts`

#### 1.3 Typing Indicator UI Enhancement
**Goal**: Better visual feedback

**Implementation**:
- Show "X is typing..." with animation
- Support multiple users typing
- Auto-hide after message sent
- Smooth transitions

**Files to Modify**:
- `src/products/oasis/components/OasisChatPanel.tsx`

### Phase 2: Real-Time Performance Optimization (Priority: HIGH)

#### 2.1 Connection Pooling & Reuse
**Goal**: Single Pusher connection across app

**Implementation**:
- Create global Pusher connection manager
- Reuse connection across route changes
- Implement connection health monitoring
- Auto-reconnect with exponential backoff

**Files to Create/Modify**:
- `src/platform/services/pusher-connection-manager.ts` (NEW)
- `src/platform/services/pusher-real-time-service.ts`
- `src/platform/pusher.ts`

**Benefits**:
- Reduced connection overhead
- Better resource utilization
- Improved reliability

#### 2.2 Optimized Channel Subscriptions
**Goal**: Efficient subscription management

**Implementation**:
- Subscribe only to active conversations
- Unsubscribe when conversation changes
- Batch channel subscriptions
- Implement subscription cache

**Files to Modify**:
- `src/platform/services/pusher-real-time-service.ts`
- `src/products/oasis/hooks/useOasisMessages.ts`
- `src/products/oasis/hooks/useOasisTyping.ts`

#### 2.3 Event Handler Optimization
**Goal**: Reduce re-renders and improve performance

**Implementation**:
- Use useCallback for event handlers
- Memoize event processing
- Batch state updates
- Use React.memo for components

**Files to Modify**:
- All Oasis hooks and components

### Phase 3: Message Delivery Optimization (Priority: MEDIUM)

#### 3.1 Event Structure Standardization
**Goal**: Consistent event handling

**Implementation**:
- Standardize event payload structure
- Add event versioning
- Implement event validation
- Add event metadata

**Files to Modify**:
- `src/platform/services/oasis-realtime-service.ts`
- All event handlers

#### 3.2 Message Batching
**Goal**: Reduce network overhead

**Implementation**:
- Batch multiple rapid messages
- Implement message queue
- Smart batching based on message size
- Priority-based delivery

**Files to Create**:
- `src/platform/services/message-batcher.ts` (NEW)

#### 3.3 Delivery Confirmation
**Goal**: Ensure message delivery

**Implementation**:
- Add delivery receipts
- Implement retry logic
- Track delivery status
- User notification for failures

**Files to Create**:
- `src/platform/services/message-delivery-tracker.ts` (NEW)

### Phase 4: Monitoring & Analytics (Priority: LOW)

#### 4.1 Performance Monitoring
**Goal**: Track real-time performance

**Implementation**:
- Add performance metrics
- Track message latency
- Monitor connection health
- Alert on failures

**Files to Create**:
- `src/platform/services/realtime-monitor.ts` (NEW)

#### 4.2 Debugging Tools
**Goal**: Better debugging capabilities

**Implementation**:
- Enhanced logging
- Pusher debug console integration
- Real-time event viewer
- Performance profiler

**Files to Create**:
- `src/platform/utils/realtime-debugger.ts` (NEW)

## Implementation Roadmap

### Week 1: Typing Indicators
- [ ] Implement debounced typing detection
- [ ] Add client-side state management
- [ ] Optimize typing API calls
- [ ] Test across all channels/DMs

### Week 2: Connection Optimization
- [ ] Create connection manager
- [ ] Implement connection pooling
- [ ] Add health monitoring
- [ ] Test connection reuse

### Week 3: Subscription Optimization
- [ ] Optimize channel subscriptions
- [ ] Implement subscription cache
- [ ] Add cleanup logic
- [ ] Test memory management

### Week 4: Testing & Polish
- [ ] Performance testing
- [ ] Load testing
- [ ] Bug fixes
- [ ] Documentation

## Performance Targets

### Typing Indicators
- **Latency**: < 500ms from keystroke to indicator
- **API Calls**: < 1 call per 2 seconds per user
- **Accuracy**: 99%+ typing state accuracy

### Message Delivery
- **Latency**: < 100ms from send to receive
- **Reliability**: 99.9%+ delivery rate
- **Throughput**: Support 1000+ concurrent users

### Connection Performance
- **Connection Time**: < 2 seconds
- **Reconnection Time**: < 1 second
- **Memory Usage**: < 50MB per connection

## Risk Mitigation

### Risks
1. **Breaking Changes**: Optimizations may break existing functionality
2. **Performance Regression**: Changes may worsen performance
3. **User Experience**: Optimizations may affect UX

### Mitigation
1. **Gradual Rollout**: Implement changes incrementally
2. **Feature Flags**: Use feature flags for new optimizations
3. **A/B Testing**: Test optimizations with subset of users
4. **Rollback Plan**: Maintain ability to rollback changes

## Success Metrics

### Key Performance Indicators (KPIs)
1. **Typing Indicator Latency**: Average time from keystroke to indicator
2. **Message Delivery Latency**: Average time from send to receive
3. **API Call Reduction**: Percentage reduction in typing API calls
4. **Connection Stability**: Percentage of time connection is active
5. **User Satisfaction**: User feedback on real-time performance

### Monitoring
- Real-time dashboard for metrics
- Alerts for performance degradation
- Weekly performance reports
- User feedback collection

## Conclusion

This plan provides a comprehensive roadmap for optimizing Oasis's real-time system. By following industry best practices and implementing the proposed optimizations, we can achieve:

1. **Fastest Real-Time System**: Sub-100ms message delivery
2. **Robust Typing Indicators**: Real-time typing feedback across all conversations
3. **Scalable Architecture**: Support for thousands of concurrent users
4. **Excellent User Experience**: Smooth, responsive real-time interactions

The implementation should be done incrementally, with thorough testing at each phase to ensure stability and performance improvements.


package com.telecom.network_monitor.realtime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Keeps the open Server-Sent Events connections and pushes {@link LiveEvent}s to them.
 */
@Service
public class EventStreamService {

    private static final Logger log = LoggerFactory.getLogger(EventStreamService.class);

    /** Clients reconnect automatically, so a finite timeout just recycles stale connections. */
    private static final long EMITTER_TIMEOUT_MS = Duration.ofMinutes(30).toMillis();

    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> {
            emitters.remove(emitter);
            emitter.complete();
        });
        emitter.onError(error -> emitters.remove(emitter));
        emitters.add(emitter);

        // Tell the client it is connected (also flushes headers through proxies)
        send(emitter, SseEmitter.event().name("connected").data("ok"));
        return emitter;
    }

    public int connectionCount() {
        return emitters.size();
    }

    /**
     * Runs after the publishing transaction commits; {@code fallbackExecution} also
     * delivers events published outside a transaction (e.g. monitoring snapshots).
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onLiveEvent(LiveEvent event) {
        broadcast(SseEmitter.event()
                .name(event.type())
                .data(event));
    }

    /** Comment line every 20 s keeps idle connections open through load balancers. */
    @Scheduled(fixedRate = 20_000, initialDelay = 20_000)
    public void keepAlive() {
        broadcast(SseEmitter.event().comment("keep-alive"));
    }

    private void broadcast(SseEmitter.SseEventBuilder event) {
        for (SseEmitter emitter : emitters) {
            send(emitter, event);
        }
    }

    private void send(SseEmitter emitter, SseEmitter.SseEventBuilder event) {
        try {
            emitter.send(event);
        } catch (IOException | IllegalStateException ex) {
            // Client went away: forget it quietly
            emitters.remove(emitter);
            log.debug("Dropped SSE client: {}", ex.getMessage());
        }
    }
}

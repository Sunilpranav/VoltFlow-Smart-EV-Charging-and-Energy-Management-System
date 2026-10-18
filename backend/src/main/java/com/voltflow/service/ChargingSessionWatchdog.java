package com.voltflow.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Safety net for abandoned charging sessions. Sessions running longer than
 * four hours are stopped by the service and their chargers are released.
 */
@Component
public class ChargingSessionWatchdog {
    private static final Logger log = LoggerFactory.getLogger(ChargingSessionWatchdog.class);
    private final ChargingSessionService chargingSessionService;

    public ChargingSessionWatchdog(ChargingSessionService chargingSessionService) {
        this.chargingSessionService = chargingSessionService;
    }

    @Scheduled(fixedDelayString = "${voltflow.sessions.watchdog-delay-ms:60000}")
    public void stopStaleSessions() {
        int stopped = chargingSessionService.autoStopStaleSessions();
        if (stopped > 0) {
            log.warn("Automatically stopped {} stale charging session(s).", stopped);
        }
    }
}

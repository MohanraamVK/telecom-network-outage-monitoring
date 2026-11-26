package com.telecom.network_monitor.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.telecom.network_monitor.entity.User;
import com.telecom.network_monitor.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end tests over real HTTP against the running application (H2 + Flyway +
 * demo data): authentication, token rotation, brute-force lockout, roles, validation,
 * security headers, live events and analytics.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ApiIntegrationTest {

    private static final ObjectMapper JSON = new ObjectMapper();

    @Value("${local.server.port}")
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    @BeforeEach
    void ensureAdmin() {
        assertThat(userRepository.existsByUsername("admin")).isTrue();
    }

    // ------------------------------------------------------------------ public surface

    @Test
    void healthIsPublicAndCarriesSecurityHeaders() throws Exception {
        HttpResponse<String> response = get("/api/health", null);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("UP");
        assertThat(header(response, "X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(header(response, "X-Frame-Options")).isEqualTo("DENY");
        assertThat(header(response, "Content-Security-Policy")).contains("default-src 'none'");
        assertThat(header(response, "Referrer-Policy")).isEqualTo("no-referrer");
    }

    @Test
    void apiDocsArePublic() throws Exception {
        assertThat(get("/v3/api-docs", null).statusCode()).isEqualTo(200);
    }

    @Test
    void protectedEndpointsRequireAToken() throws Exception {
        HttpResponse<String> response = get("/api/nodes/search", null);

        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(json(response).path("status").asInt()).isEqualTo(401);
    }

    @Test
    void garbageTokenIsRejected() throws Exception {
        assertThat(get("/api/nodes/search", "not-a-jwt").statusCode()).isEqualTo(401);
    }

    // ------------------------------------------------------------------ login and tokens

    @Test
    void loginReturnsAccessAndRefreshTokens() throws Exception {
        JsonNode tokens = login("admin", "admin123");

        assertThat(tokens.path("token").asText()).isNotBlank();
        assertThat(tokens.path("refreshToken").asText()).isNotBlank();
        assertThat(tokens.path("expiresIn").asLong()).isEqualTo(900);
        assertThat(tokens.path("role").asText()).isEqualTo("ADMIN");

        HttpResponse<String> me = get("/api/auth/me", tokens.path("token").asText());
        assertThat(me.statusCode()).isEqualTo(200);
        assertThat(json(me).path("data").path("username").asText()).isEqualTo("admin");
    }

    @Test
    void wrongPasswordAndUnknownUserGetTheSameAnswer() throws Exception {
        HttpResponse<String> wrongPassword = post("/api/auth/login", null, "{\"username\":\"admin\",\"password\":\"nope\"}");
        HttpResponse<String> unknownUser = post("/api/auth/login", null, "{\"username\":\"ghost-" + UUID.randomUUID() + "\",\"password\":\"nope\"}");

        assertThat(wrongPassword.statusCode()).isEqualTo(401);
        assertThat(unknownUser.statusCode()).isEqualTo(401);
        assertThat(json(wrongPassword).path("message").asText()).isEqualTo(json(unknownUser).path("message").asText());
    }

    @Test
    void repeatedFailuresLockTheUsernameForThisAddress() throws Exception {
        String user = "brute-" + UUID.randomUUID();
        String body = "{\"username\":\"" + user + "\",\"password\":\"guess\"}";

        for (int i = 0; i < 4; i++) {
            assertThat(post("/api/auth/login", null, body).statusCode()).isEqualTo(401);
        }
        HttpResponse<String> fifth = post("/api/auth/login", null, body);

        assertThat(fifth.statusCode()).isEqualTo(429);
        assertThat(header(fifth, "Retry-After")).isNotNull();
        assertThat(json(fifth).path("message").asText()).contains("Too many failed login attempts");
        // Still locked even if the next guess were right
        assertThat(post("/api/auth/login", null, body).statusCode()).isEqualTo(429);
    }

    @Test
    void refreshRotatesTokensAndReuseRevokesTheSession() throws Exception {
        JsonNode first = login("admin", "admin123");
        String r1 = first.path("refreshToken").asText();

        HttpResponse<String> rotated = post("/api/auth/refresh", null, "{\"refreshToken\":\"" + r1 + "\"}");
        assertThat(rotated.statusCode()).isEqualTo(200);
        String r2 = json(rotated).path("refreshToken").asText();
        assertThat(r2).isNotEqualTo(r1);
        assertThat(get("/api/auth/me", json(rotated).path("token").asText()).statusCode()).isEqualTo(200);

        // r1 was already used: treat as stolen, which also kills r2
        assertThat(post("/api/auth/refresh", null, "{\"refreshToken\":\"" + r1 + "\"}").statusCode()).isEqualTo(401);
        assertThat(post("/api/auth/refresh", null, "{\"refreshToken\":\"" + r2 + "\"}").statusCode()).isEqualTo(401);
    }

    @Test
    void logoutRevokesTheRefreshToken() throws Exception {
        String refresh = login("admin", "admin123").path("refreshToken").asText();

        assertThat(post("/api/auth/logout", null, "{\"refreshToken\":\"" + refresh + "\"}").statusCode()).isEqualTo(204);
        assertThat(post("/api/auth/refresh", null, "{\"refreshToken\":\"" + refresh + "\"}").statusCode()).isEqualTo(401);
    }

    @Test
    void changingPasswordSignsOutOldSessions() throws Exception {
        String username = "ops-" + UUID.randomUUID().toString().substring(0, 8);
        userRepository.save(new User(username, passwordEncoder.encode("first-password-1"), "ADMIN"));
        JsonNode oldTokens = login(username, "first-password-1");
        Thread.sleep(1100); // JWT "issued at" has second precision

        HttpResponse<String> wrongCurrent = post("/api/auth/change-password", oldTokens.path("token").asText(),
                "{\"currentPassword\":\"not-it\",\"newPassword\":\"second-password-2\"}");
        assertThat(wrongCurrent.statusCode()).isEqualTo(400);

        HttpResponse<String> tooShort = post("/api/auth/change-password", oldTokens.path("token").asText(),
                "{\"currentPassword\":\"first-password-1\",\"newPassword\":\"short\"}");
        assertThat(tooShort.statusCode()).isEqualTo(400);

        HttpResponse<String> changed = post("/api/auth/change-password", oldTokens.path("token").asText(),
                "{\"currentPassword\":\"first-password-1\",\"newPassword\":\"second-password-2\"}");
        assertThat(changed.statusCode()).isEqualTo(200);

        assertThat(get("/api/auth/me", oldTokens.path("token").asText()).statusCode()).isEqualTo(401);
        assertThat(post("/api/auth/refresh", null,
                "{\"refreshToken\":\"" + oldTokens.path("refreshToken").asText() + "\"}").statusCode()).isEqualTo(401);
        assertThat(get("/api/auth/me", json(changed).path("token").asText()).statusCode()).isEqualTo(200);
        assertThat(login(username, "second-password-2").path("token").asText()).isNotBlank();
    }

    // ------------------------------------------------------------------ roles and validation

    @Test
    void viewerCanReadButNotWrite() throws Exception {
        String username = "viewer-" + UUID.randomUUID().toString().substring(0, 8);
        userRepository.save(new User(username, passwordEncoder.encode("viewer-pass-1"), "VIEWER"));
        String token = login(username, "viewer-pass-1").path("token").asText();

        assertThat(get("/api/nodes/search", token).statusCode()).isEqualTo(200);
        assertThat(get("/api/analytics?days=7", token).statusCode()).isEqualTo(200);
        assertThat(post("/api/nodes", token, "{\"name\":\"X\",\"location\":\"Y\",\"status\":\"ACTIVE\"}").statusCode())
                .isEqualTo(403);
        assertThat(post("/api/auth/change-password", token,
                "{\"currentPassword\":\"viewer-pass-1\",\"newPassword\":\"another-pass-2\"}").statusCode()).isEqualTo(403);
    }

    @Test
    void invalidInputGetsFieldErrors() throws Exception {
        String token = adminToken();

        HttpResponse<String> response = post("/api/nodes", token, "{\"name\":\"\",\"location\":\"\",\"status\":\"ACTIVE\"}");

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(json(response).path("data").has("name")).isTrue();
        assertThat(json(response).path("data").has("location")).isTrue();
    }

    @Test
    void unknownSortFieldAndBadEnumAreClientErrors() throws Exception {
        String token = adminToken();

        assertThat(get("/api/incidents/search?sort=password", token).statusCode()).isEqualTo(400);
        assertThat(get("/api/incidents/search?status=EXPLODED", token).statusCode()).isEqualTo(400);
        assertThat(get("/api/incidents/999999", token).statusCode()).isEqualTo(404);
    }

    @Test
    void createSearchAndResolveAnIncidentOverHttp() throws Exception {
        String token = adminToken();
        String nodeName = "IT-Node-" + UUID.randomUUID().toString().substring(0, 6);

        HttpResponse<String> node = post("/api/nodes", token,
                "{\"name\":\"" + nodeName + "\",\"location\":\"Test lab\",\"status\":\"ACTIVE\"}");
        assertThat(node.statusCode()).isIn(200, 201);
        long nodeId = json(node).path("data").path("id").asLong();

        HttpResponse<String> incident = post("/api/incidents/node/" + nodeId, token,
                "{\"description\":\"Integration test outage\",\"severity\":\"HIGH\",\"status\":\"OPEN\"}");
        assertThat(incident.statusCode()).isIn(200, 201);
        long incidentId = json(incident).path("data").path("id").asLong();

        HttpResponse<String> found = get("/api/incidents/search?q=" + nodeName, token);
        assertThat(json(found).path("data").path("totalElements").asInt()).isEqualTo(1);

        assertThat(put("/api/incidents/" + incidentId + "/status", token, "{\"status\":\"RESOLVED\"}").statusCode())
                .isEqualTo(200);
        assertThat(put("/api/incidents/" + incidentId + "/status", token, "{\"status\":\"CLOSED\"}").statusCode())
                .isEqualTo(200);
        HttpResponse<String> reopen = put("/api/incidents/" + incidentId + "/status", token, "{\"status\":\"OPEN\"}");
        assertThat(reopen.statusCode()).isEqualTo(400);

        JsonNode timeline = json(get("/api/incidents/" + incidentId + "/timeline", token)).path("data");
        assertThat(timeline.size()).isEqualTo(3); // created, resolved, closed
    }

    // ------------------------------------------------------------------ live events and analytics

    @Test
    void eventStreamPushesChanges() throws Exception {
        String token = adminToken();
        HttpRequest streamRequest = HttpRequest.newBuilder(uri("/api/events/stream"))
                .header("Authorization", "Bearer " + token)
                .header("Accept", "text/event-stream")
                .GET().build();
        HttpResponse<InputStream> stream = http.send(streamRequest, HttpResponse.BodyHandlers.ofInputStream());
        assertThat(stream.statusCode()).isEqualTo(200);
        assertThat(header(stream, "Content-Type")).startsWith("text/event-stream");

        CompletableFuture<String> nodeEvent = CompletableFuture.supplyAsync(() -> {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream.body(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("event:node.changed")) {
                        return line;
                    }
                }
                return null;
            } catch (Exception ex) {
                return null;
            }
        });

        Thread.sleep(300); // let the subscription register
        post("/api/nodes", token, "{\"name\":\"SSE-" + UUID.randomUUID().toString().substring(0, 6)
                + "\",\"location\":\"Lab\",\"status\":\"ACTIVE\"}");

        assertThat(nodeEvent.get(10, TimeUnit.SECONDS)).isEqualTo("event:node.changed");
        stream.body().close();
    }

    @Test
    void analyticsReportsUptimeFromSeededHistory() throws Exception {
        JsonNode data = json(get("/api/analytics?days=30", adminToken())).path("data");

        assertThat(data.path("days").asInt()).isEqualTo(30);
        assertThat(data.path("daily").size()).isEqualTo(30);
        assertThat(data.path("slaTargetPercent").asDouble()).isEqualTo(99.5);
        assertThat(data.path("networkAvailabilityPercent").asDouble()).isBetween(90.0, 100.0);
        assertThat(data.path("incidentsOpened").asInt()).isPositive();
        assertThat(data.path("nodes").size()).isGreaterThanOrEqualTo(8);
        // Seeded outages: at least one node is below 100% over 30 days
        boolean someDowntime = false;
        for (JsonNode node : data.path("nodes")) {
            someDowntime |= node.path("uptime30d").asDouble() < 100.0;
        }
        assertThat(someDowntime).isTrue();
        // Range is clamped
        assertThat(json(get("/api/analytics?days=5000", adminToken())).path("data").path("days").asInt()).isEqualTo(90);
    }

    // ------------------------------------------------------------------ helpers

    private String adminToken() throws Exception {
        return login("admin", "admin123").path("token").asText();
    }

    private JsonNode login(String username, String password) throws Exception {
        HttpResponse<String> response = post("/api/auth/login", null,
                "{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}");
        assertThat(response.statusCode()).as("login %s: %s", username, response.body()).isEqualTo(200);
        return json(response);
    }

    private HttpResponse<String> get(String path, String token) throws Exception {
        return http.send(request(path, token).GET().build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> post(String path, String token, String body) throws Exception {
        return http.send(request(path, token).header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> put(String path, String token, String body) throws Exception {
        return http.send(request(path, token).header("Content-Type", "application/json")
                .PUT(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
    }

    private HttpRequest.Builder request(String path, String token) {
        HttpRequest.Builder builder = HttpRequest.newBuilder(uri(path)).timeout(Duration.ofSeconds(15));
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        return builder;
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    private static String header(HttpResponse<?> response, String name) {
        return response.headers().firstValue(name).orElse(null);
    }

    private static JsonNode json(HttpResponse<String> response) throws Exception {
        return JSON.readTree(response.body());
    }
}
